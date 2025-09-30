const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const { authenticateToken } = require('./auth');

// Virus scanning (integrate with ClamAV or Windows Defender)
const scanFileForViruses = async (filePath) => {
    // For production, integrate with actual antivirus
    // For now, basic checks
    const stats = await fs.stat(filePath);
    
    // Basic security checks
    if (stats.size === 0) {
        throw new Error('Empty file detected');
    }
    
    if (stats.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File too large');
    }
    
    // Check for suspicious file signatures
    const buffer = await fs.readFile(filePath, { highWaterMark: 1024 });
    const header = buffer.toString('hex', 0, 4);
    
    // Block executable files
    const suspiciousHeaders = ['4d5a', '7f45']; // MZ (Windows PE), ELF
    if (suspiciousHeaders.some(sig => header.startsWith(sig))) {
        throw new Error('Executable file detected');
    }
    
    return true;
};

// Secure file storage configuration
const createSecureStorage = () => {
    return multer.diskStorage({
        destination: async (req, file, cb) => {
            const userDir = path.join(__dirname, '../uploads', req.user.id.toString());
            try {
                await fs.mkdir(userDir, { recursive: true });
                cb(null, userDir);
            } catch (error) {
                cb(error);
            }
        },
        filename: (req, file, cb) => {
            // Generate cryptographically secure filename
            const uniqueName = crypto.randomBytes(16).toString('hex');
            const timestamp = Date.now();
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${uniqueName}-${timestamp}${ext}`);
        }
    });
};

// File upload middleware
const uploadMiddleware = multer({
    storage: createSecureStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 10, // Max 10 files per upload
        fieldSize: 1024 * 1024 // 1MB for form fields
    },
    fileFilter: (req, file, cb) => {
        // Whitelist of allowed file types
        const allowedTypes = {
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.txt': 'text/plain',
            '.eml': 'message/rfc822'
        };
        
        const ext = path.extname(file.originalname).toLowerCase();
        const expectedMimeType = allowedTypes[ext];
        
        if (expectedMimeType && (file.mimetype === expectedMimeType || file.mimetype === 'application/octet-stream')) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not allowed. Supported: ${Object.keys(allowedTypes).join(', ')}`), false);
        }
    }
});

// Process CSV files
const processCSV = async (filePath, bankType) => {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        throw new Error('Empty CSV file');
    }
    
    const transactions = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
        
        // Bank-specific CSV parsing
        let transaction = null;
        
        switch (bankType?.toLowerCase()) {
            case 'cibc':
                // CIBC CSV format: Date, Description, Debit, Credit
                if (columns.length >= 4) {
                    transaction = {
                        date: columns[0],
                        description: columns[1],
                        amount: parseFloat(columns[3] || columns[2]) || 0,
                        type: columns[3] ? 'credit' : 'debit'
                    };
                }
                break;
            case 'td':
                // TD CSV format: Date, Description, Amount
                if (columns.length >= 3) {
                    const amount = parseFloat(columns[2]);
                    transaction = {
                        date: columns[0],
                        description: columns[1],
                        amount: Math.abs(amount),
                        type: amount >= 0 ? 'credit' : 'debit'
                    };
                }
                break;
            default:
                // Generic format: try to detect columns
                if (columns.length >= 3) {
                    transaction = {
                        date: columns[0],
                        description: columns[1],
                        amount: Math.abs(parseFloat(columns[2]) || 0),
                        type: 'debit' // Default to debit
                    };
                }
        }
        
        if (transaction && transaction.amount > 0) {
            transactions.push(transaction);
        }
    }
    
    return transactions;
};

// Process PDF files (basic text extraction)
const processPDF = async (filePath, bankType) => {
    // For production, use pdf-parse or similar library
    // This is a placeholder for PDF processing
    throw new Error('PDF processing not implemented yet. Please use CSV files or contact support.');
};

// Process email files (.eml)
const processEmailFile = async (filePath) => {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract email body (simplified)
    const bodyMatch = content.match(/\r?\n\r?\n([\s\S]*)/);
    const emailBody = bodyMatch ? bodyMatch[1] : content;
    
    // Use existing email extraction logic
    const { extractTransactions } = require('../Application/extracteur');
    return await extractTransactions(emailBody);
};

// Store transactions for user
const storeTransactionsForUser = async (db, userId, transactions) => {
    const stmt = db.prepare(`
        INSERT INTO transactions (user_id, date, description, amount, category_id, created_at)
        VALUES (?, ?, ?, ?, NULL, CURRENT_TIMESTAMP)
    `);
    
    let stored = 0;
    for (const transaction of transactions) {
        try {
            // Validate transaction data
            if (!transaction.date || !transaction.description || !transaction.amount) {
                continue;
            }
            
            // Parse date
            const date = new Date(transaction.date);
            if (isNaN(date.getTime())) {
                continue;
            }
            
            stmt.run(userId, date.toISOString().split('T')[0], transaction.description, transaction.amount);
            stored++;
        } catch (error) {
            console.error('Error storing transaction:', error);
        }
    }
    
    return stored;
};

// Clean up uploaded files
const cleanupFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
};

// Setup file upload routes
const setupFileUploadRoutes = (app, db) => {
    
    // Upload transactions endpoint
    app.post('/api/upload-transactions', 
        authenticateToken, 
        uploadMiddleware.array('files', 10), 
        async (req, res) => {
            const uploadedFiles = [];
            
            try {
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({ error: 'No files uploaded' });
                }
                
                for (const file of req.files) {
                    try {
                        // Security scan
                        await scanFileForViruses(file.path);
                        
                        // Process based on file type
                        let transactions = [];
                        const ext = path.extname(file.originalname).toLowerCase();
                        const bankType = req.body.bankType || 'generic';
                        
                        switch (ext) {
                            case '.csv':
                                transactions = await processCSV(file.path, bankType);
                                break;
                            case '.pdf':
                                transactions = await processPDF(file.path, bankType);
                                break;
                            case '.eml':
                                transactions = await processEmailFile(file.path);
                                break;
                            default:
                                throw new Error(`Unsupported file type: ${ext}`);
                        }
                        
                        // Store transactions
                        const stored = await storeTransactionsForUser(db, req.user.id, transactions);
                        
                        uploadedFiles.push({
                            filename: file.originalname,
                            processed: transactions.length,
                            stored: stored,
                            status: 'success'
                        });
                        
                    } catch (error) {
                        uploadedFiles.push({
                            filename: file.originalname,
                            status: 'error',
                            error: error.message
                        });
                    } finally {
                        // Always clean up the file
                        await cleanupFile(file.path);
                    }
                }
                
                // Calculate totals
                const totalProcessed = uploadedFiles.reduce((sum, file) => sum + (file.processed || 0), 0);
                const totalStored = uploadedFiles.reduce((sum, file) => sum + (file.stored || 0), 0);
                const successCount = uploadedFiles.filter(f => f.status === 'success').length;
                
                res.json({
                    message: `Processed ${req.files.length} files`,
                    summary: {
                        filesUploaded: req.files.length,
                        filesSuccessful: successCount,
                        transactionsProcessed: totalProcessed,
                        transactionsStored: totalStored
                    },
                    files: uploadedFiles
                });
                
            } catch (error) {
                console.error('File upload error:', error);
                
                // Clean up any remaining files
                if (req.files) {
                    for (const file of req.files) {
                        await cleanupFile(file.path);
                    }
                }
                
                res.status(500).json({ 
                    error: 'Failed to process uploaded files',
                    details: error.message 
                });
            }
        }
    );
    
    // Get upload statistics
    app.get('/api/upload-stats', authenticateToken, (req, res) => {
        try {
            const stats = db.prepare(`
                SELECT 
                    COUNT(*) as total_transactions,
                    DATE(created_at) as upload_date,
                    COUNT(*) as daily_count
                FROM transactions 
                WHERE user_id = ? AND created_at >= date('now', '-30 days')
                GROUP BY DATE(created_at)
                ORDER BY upload_date DESC
            `).all(req.user.id);
            
            const totalTransactions = db.prepare(`
                SELECT COUNT(*) as count FROM transactions WHERE user_id = ?
            `).get(req.user.id);
            
            res.json({
                totalTransactions: totalTransactions.count,
                recentUploads: stats
            });
            
        } catch (error) {
            console.error('Upload stats error:', error);
            res.status(500).json({ error: 'Failed to get upload statistics' });
        }
    });
    
    // Error handler for multer
    app.use((error, req, res, next) => {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ error: 'Too many files. Maximum is 10 files per upload.' });
            }
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ error: 'Unexpected file field.' });
            }
        }
        
        if (error.message.includes('File type') && error.message.includes('not allowed')) {
            return res.status(400).json({ error: error.message });
        }
        
        next(error);
    });
};

module.exports = {
    setupFileUploadRoutes,
    scanFileForViruses,
    processCSV,
    storeTransactionsForUser
};