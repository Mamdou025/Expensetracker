// Email webhook endpoints for different email services
const EmailForwardingService = require('./emailForwardingService');
const multer = require('multer');
const upload = multer();

const setupEmailWebhooks = (app, db) => {
    const emailService = new EmailForwardingService(db);

    // Mailgun Webhook (Recommended)
    app.post('/webhook/mailgun', upload.none(), async (req, res) => {
        try {
            // Verify Mailgun signature for security
            const signature = req.body.signature;
            const token = req.body.token;
            const timestamp = req.body.timestamp;
            
            // Mailgun signature verification
            if (!verifyMailgunSignature(signature, token, timestamp)) {
                return res.status(401).json({ error: 'Invalid signature' });
            }

            const emailData = {
                to: req.body.recipient,
                from: req.body.sender,
                subject: req.body.Subject || req.body.subject,
                body: req.body['body-html'] || req.body['body-plain'],
                date: req.body.Date,
                headers: {
                    'message-id': req.body['Message-Id'],
                    'received': req.body.Received
                }
            };

            console.log(`📧 Received email from ${emailData.from} to ${emailData.to}`);

            const result = await emailService.processForwardedEmail(emailData);
            
            if (result.success) {
                console.log(`✅ Processed ${result.transactions} transactions for user ${result.userId}`);
                res.status(200).json({ 
                    message: 'Email processed successfully',
                    transactions: result.transactions 
                });
            } else {
                console.error(`❌ Processing failed: ${result.error}`);
                res.status(200).json({ 
                    message: 'Email received but processing failed',
                    error: result.error 
                });
            }

        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // SendGrid Webhook
    app.post('/webhook/sendgrid', express.json(), async (req, res) => {
        try {
            // SendGrid sends an array of events
            const events = req.body;
            
            for (const event of events) {
                if (event.event === 'inbound') {
                    const emailData = {
                        to: event.to,
                        from: event.from,
                        subject: event.subject,
                        body: event.html || event.text,
                        date: new Date(event.timestamp * 1000).toISOString(),
                        headers: event.headers
                    };

                    await emailService.processForwardedEmail(emailData);
                }
            }

            res.status(200).json({ message: 'Events processed' });

        } catch (error) {
            console.error('SendGrid webhook error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // AWS SES Webhook (via SNS)
    app.post('/webhook/aws-ses', express.json(), async (req, res) => {
        try {
            // Handle SNS subscription confirmation
            if (req.body.Type === 'SubscriptionConfirmation') {
                // Auto-confirm subscription
                const https = require('https');
                https.get(req.body.SubscribeURL);
                return res.status(200).json({ message: 'Subscription confirmed' });
            }

            // Handle email notification
            if (req.body.Type === 'Notification') {
                const message = JSON.parse(req.body.Message);
                
                if (message.eventType === 'receipt') {
                    const emailData = {
                        to: message.receipt.recipients[0],
                        from: message.mail.commonHeaders.from[0],
                        subject: message.mail.commonHeaders.subject,
                        body: message.content, // You'd need to fetch the actual content
                        date: message.mail.timestamp,
                        headers: message.mail.commonHeaders
                    };

                    await emailService.processForwardedEmail(emailData);
                }
            }

            res.status(200).json({ message: 'Notification processed' });

        } catch (error) {
            console.error('AWS SES webhook error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Manual email processing endpoint (for testing)
    app.post('/api/process-email-manual', authenticateToken, async (req, res) => {
        try {
            const { emailContent, bankType } = req.body;
            
            if (!emailContent) {
                return res.status(400).json({ error: 'Email content is required' });
            }

            // Create mock email data for testing
            const emailData = {
                to: `transactions-test@yourapp.com`,
                from: 'noreply@cibc.com',
                subject: 'Transaction Alert',
                body: emailContent,
                date: new Date().toISOString(),
                headers: { 'message-id': `test-${Date.now()}` }
            };

            // Override user lookup for manual processing
            const originalGetUserId = emailService.getUserIdFromForwardingAddress;
            emailService.getUserIdFromForwardingAddress = () => req.user.id;

            const result = await emailService.processForwardedEmail(emailData);

            // Restore original method
            emailService.getUserIdFromForwardingAddress = originalGetUserId;

            res.json({
                success: result.success,
                transactions: result.transactions,
                warnings: result.warnings,
                error: result.error
            });

        } catch (error) {
            console.error('Manual email processing error:', error);
            res.status(500).json({ error: 'Failed to process email' });
        }
    });

    // Get user's forwarding address
    app.get('/api/forwarding-address', authenticateToken, (req, res) => {
        try {
            const forwardingAddress = emailService.generateForwardingAddress(req.user.id);
            
            res.json({
                forwardingAddress,
                instructions: {
                    gmail: "Go to Settings > Forwarding and POP/IMAP > Add forwarding address",
                    outlook: "Go to Settings > Mail > Forwarding > Enable forwarding",
                    appleMail: "Mail > Preferences > Rules > Create forwarding rule"
                }
            });

        } catch (error) {
            console.error('Forwarding address error:', error);
            res.status(500).json({ error: 'Failed to generate forwarding address' });
        }
    });

    // Get email processing statistics
    app.get('/api/email-stats', authenticateToken, (req, res) => {
        try {
            const stats = emailService.getUserProcessingStats(req.user.id);
            
            res.json({
                totalEmails: stats.total_emails || 0,
                totalTransactions: stats.total_transactions || 0,
                successfulEmails: stats.successful_emails || 0,
                failedEmails: stats.failed_emails || 0,
                lastProcessed: stats.last_processed,
                successRate: stats.total_emails > 0 
                    ? Math.round((stats.successful_emails / stats.total_emails) * 100) 
                    : 0
            });

        } catch (error) {
            console.error('Email stats error:', error);
            res.status(500).json({ error: 'Failed to get email statistics' });
        }
    });
};

// Mailgun signature verification
const verifyMailgunSignature = (signature, token, timestamp) => {
    const crypto = require('crypto');
    const apiKey = process.env.MAILGUN_API_KEY;
    
    if (!apiKey) {
        console.warn('MAILGUN_API_KEY not set, skipping signature verification');
        return true; // Allow in development
    }
    
    const encoded = crypto
        .createHmac('sha256', apiKey)
        .update(timestamp + token)
        .digest('hex');
    
    return encoded === signature;
};

module.exports = { setupEmailWebhooks };