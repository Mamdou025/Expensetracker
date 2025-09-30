// Complete Email Forwarding Implementation
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');

class EmailForwardingService {
    constructor(db) {
        this.db = db;
        this.emailSalt = process.env.EMAIL_SALT || 'default-salt-change-in-production';
    }

    // Generate unique forwarding address for user
    generateForwardingAddress(userId) {
        const hash = crypto
            .createHash('sha256')
            .update(`${userId}-${this.emailSalt}`)
            .digest('hex')
            .substring(0, 16);
        
        const forwardingAddress = `transactions-${hash}@${process.env.APP_DOMAIN || 'yourapp.com'}`;
        
        // Store in database for reverse lookup
        this.db.prepare(`
            INSERT OR REPLACE INTO forwarding_addresses (user_id, hash, email_address, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(userId, hash, forwardingAddress);
        
        return forwardingAddress;
    }

    // Get user ID from forwarding address
    getUserIdFromForwardingAddress(emailAddress) {
        // Extract hash from: transactions-a1b2c3d4e5f6@yourapp.com
        const match = emailAddress.match(/transactions-([a-f0-9]+)@/);
        if (!match) {
            console.warn('Invalid forwarding address format:', emailAddress);
            return null;
        }
        
        const hash = match[1];
        const result = this.db.prepare('SELECT user_id FROM forwarding_addresses WHERE hash = ?').get(hash);
        
        if (!result) {
            console.warn('No user found for forwarding hash:', hash);
            return null;
        }
        
        return result.user_id;
    }

    // Detect bank from email metadata
    detectBankFromEmail(emailData) {
        const sender = emailData.from.toLowerCase();
        const subject = emailData.subject.toLowerCase();
        const headers = emailData.headers || {};
        
        // Canadian bank detection patterns
        const bankPatterns = {
            'cibc': {
                domains: ['cibc.com', 'cibc.ca'],
                senders: ['noreply@cibc.com', 'alerts@cibc.com', 'transactions@cibc.com'],
                subjects: ['transaction alert', 'purchase notification', 'cibc']
            },
            'td': {
                domains: ['tdcanada.com', 'td.com'],
                senders: ['noreply@tdcanada.com', 'alerts@td.com'],
                subjects: ['td canada', 'transaction notification']
            },
            'rbc': {
                domains: ['rbc.com', 'royalbank.com'],
                senders: ['noreply@rbc.com', 'alerts@rbc.com'],
                subjects: ['rbc', 'royal bank', 'transaction']
            },
            'scotiabank': {
                domains: ['scotiabank.com', 'scotiabankcontact.com'],
                senders: ['noreply@scotiabank.com', 'alerts@scotiabank.com'],
                subjects: ['scotiabank', 'transaction alert']
            },
            'bmo': {
                domains: ['bmo.com', 'bmoharris.com'],
                senders: ['noreply@bmo.com', 'alerts@bmo.com'],
                subjects: ['bmo', 'bank of montreal']
            },
            'mbna': {
                domains: ['mbna.ca', 'mbna.com'],
                senders: ['noreply@mbna.ca', 'customerservice@mbna.ca'],
                subjects: ['mbna', 'transaction notification']
            },
            'capitalOne': {
                domains: ['capitalone.ca', 'capitalone.com'],
                senders: ['noreply@capitalone.ca', 'alerts@capitalone.ca'],
                subjects: ['capital one', 'transaction alert']
            }
        };

        // Check each bank pattern
        for (const [bankCode, patterns] of Object.entries(bankPatterns)) {
            // Check domains
            if (patterns.domains.some(domain => sender.includes(domain))) {
                return bankCode;
            }
            
            // Check specific sender addresses
            if (patterns.senders.some(senderPattern => sender.includes(senderPattern))) {
                return bankCode;
            }
            
            // Check subject patterns
            if (patterns.subjects.some(subjectPattern => subject.includes(subjectPattern))) {
                return bankCode;
            }
        }
        
        console.warn('Unknown bank detected:', { sender, subject });
        return 'unknown';
    }

    // Verify email security and authenticity
    verifyEmailSecurity(emailData) {
        const security = {
            isValid: true,
            warnings: [],
            details: {}
        };

        // 1. Check if sender is from a legitimate bank domain
        const bankDomains = [
            'cibc.com', 'tdcanada.com', 'rbc.com', 'scotiabank.com', 
            'bmo.com', 'mbna.ca', 'capitalone.ca'
        ];
        
        const senderDomain = emailData.from.split('@')[1]?.toLowerCase();
        const isLegitimateBank = bankDomains.some(domain => 
            senderDomain?.includes(domain)
        );
        
        if (!isLegitimateBank) {
            security.warnings.push('Sender not from recognized bank domain');
            security.details.senderDomain = senderDomain;
        }

        // 2. Check for suspicious content patterns
        const suspiciousPatterns = [
            /click here to verify/i,
            /urgent action required/i,
            /account suspended/i,
            /verify your password/i,
            /login credentials/i
        ];
        
        const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
            pattern.test(emailData.body)
        );
        
        if (hasSuspiciousContent) {
            security.isValid = false;
            security.warnings.push('Email contains suspicious phishing-like content');
        }

        // 3. Basic header validation
        if (!emailData.headers || !emailData.headers['message-id']) {
            security.warnings.push('Missing standard email headers');
        }

        // 4. Check email age (reject very old forwarded emails)
        const emailDate = new Date(emailData.date || emailData.headers?.date);
        const daysSinceEmail = (Date.now() - emailDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceEmail > 30) {
            security.warnings.push('Email is older than 30 days');
        }

        security.details.bankVerified = isLegitimateBank;
        security.details.contentSafe = !hasSuspiciousContent;
        security.details.emailAge = Math.round(daysSinceEmail);

        return security;
    }

    // Extract transactions using existing Python scripts
    async extractTransactions(emailBody, bankType) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, '../Application/extracteur.py');
            const py = spawn('python', [pythonScript, bankType || 'generic']);
            
            let output = '';
            let errorOutput = '';
            
            // Send email content to Python script
            py.stdin.write(emailBody);
            py.stdin.end();
            
            py.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            py.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            py.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        resolve(result.transactions || []);
                    } catch (parseError) {
                        console.error('Failed to parse Python output:', output);
                        resolve([]); // Return empty array instead of failing
                    }
                } else {
                    console.error('Python extraction failed:', errorOutput);
                    reject(new Error(`Transaction extraction failed: ${errorOutput}`));
                }
            });
            
            py.on('error', (error) => {
                console.error('Python process error:', error);
                reject(error);
            });
        });
    }

    // Store transactions for specific user
    async storeTransactionsForUser(userId, transactions) {
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return { stored: 0, skipped: 0 };
        }

        const stmt = this.db.prepare(`
            INSERT INTO transactions (
                user_id, date, description, amount, 
                card_type, bank, category, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        let stored = 0;
        let skipped = 0;

        for (const transaction of transactions) {
            try {
                // Validate required fields
                if (!transaction.amount || !transaction.description) {
                    skipped++;
                    continue;
                }

                // Parse and validate date
                let transactionDate = transaction.date;
                if (!transactionDate) {
                    transactionDate = new Date().toISOString().split('T')[0];
                }

                // Clean and validate amount
                const amount = parseFloat(transaction.amount);
                if (isNaN(amount) || amount <= 0) {
                    skipped++;
                    continue;
                }

                // Store transaction
                stmt.run(
                    userId,
                    transactionDate,
                    transaction.description.trim(),
                    amount,
                    transaction.card_type || 'unknown',
                    transaction.bank || 'unknown',
                    transaction.category || null
                );

                stored++;

            } catch (error) {
                console.error('Error storing individual transaction:', error, transaction);
                skipped++;
            }
        }

        return { stored, skipped, total: transactions.length };
    }

    // Main processing function for incoming forwarded emails
    async processForwardedEmail(emailData) {
        const processingResult = {
            success: false,
            userId: null,
            bankType: null,
            transactions: 0,
            warnings: [],
            error: null
        };

        try {
            // 1. Extract user ID from forwarding address
            const userId = this.getUserIdFromForwardingAddress(emailData.to);
            if (!userId) {
                throw new Error('Invalid forwarding address or user not found');
            }
            processingResult.userId = userId;

            // 2. Verify email security
            const securityCheck = this.verifyEmailSecurity(emailData);
            if (!securityCheck.isValid) {
                throw new Error(`Email failed security validation: ${securityCheck.warnings.join(', ')}`);
            }
            processingResult.warnings = securityCheck.warnings;

            // 3. Detect bank type
            const bankType = this.detectBankFromEmail(emailData);
            processingResult.bankType = bankType;

            // 4. Extract transactions
            const transactions = await this.extractTransactions(emailData.body, bankType);
            
            // 5. Store transactions
            const storeResult = await this.storeTransactionsForUser(userId, transactions);
            processingResult.transactions = storeResult.stored;

            // 6. Log the successful processing
            this.db.prepare(`
                INSERT INTO email_processing_log (
                    user_id, bank_type, transactions_found, transactions_stored,
                    email_subject, processed_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(
                userId, 
                bankType, 
                transactions.length, 
                storeResult.stored,
                emailData.subject || 'No Subject'
            );

            processingResult.success = true;
            console.log(`✅ Processed email for user ${userId}: ${storeResult.stored} transactions stored`);

        } catch (error) {
            processingResult.error = error.message;
            console.error('❌ Email processing failed:', error);
            
            // Log the failed processing
            if (processingResult.userId) {
                this.db.prepare(`
                    INSERT INTO email_processing_log (
                        user_id, bank_type, transactions_found, transactions_stored,
                        email_subject, error_message, processed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `).run(
                    processingResult.userId,
                    processingResult.bankType || 'unknown',
                    0, 0,
                    emailData.subject || 'No Subject',
                    error.message
                );
            }
        }

        return processingResult;
    }

    // Get processing statistics for a user
    getUserProcessingStats(userId) {
        return this.db.prepare(`
            SELECT 
                COUNT(*) as total_emails,
                SUM(transactions_stored) as total_transactions,
                COUNT(CASE WHEN error_message IS NULL THEN 1 END) as successful_emails,
                COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed_emails,
                MAX(processed_at) as last_processed
            FROM email_processing_log 
            WHERE user_id = ?
        `).get(userId);
    }
}

module.exports = EmailForwardingService;