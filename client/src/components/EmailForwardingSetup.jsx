import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, Copy, Mail, AlertCircle, ExternalLink } from 'lucide-react';

const EmailForwardingSetup = () => {
    const [setupStep, setSetupStep] = useState(1);
    const [forwardingAddress, setForwardingAddress] = useState('');
    const [emailProvider, setEmailProvider] = useState('');
    const [setupComplete, setSetupComplete] = useState(false);
    const [testEmailSent, setTestEmailSent] = useState(false);

    useEffect(() => {
        // Generate forwarding address when component mounts
        generateForwardingAddress();
    }, []);

    const generateForwardingAddress = async () => {
        try {
            const response = await fetch('/api/forwarding-address', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setForwardingAddress(data.forwardingAddress);
        } catch (error) {
            console.error('Failed to generate forwarding address:', error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Show success feedback
    };

    const testSetup = async () => {
        setTestEmailSent(true);
        // In real implementation, this might send a test email
        // or check if any emails have been received
    };

    const renderStepContent = () => {
        switch (setupStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="text-center">
                            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Your Unique Email Address</h3>
                            <p className="text-gray-600 mb-4">
                                This is your personal forwarding address. Keep it safe!
                            </p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <code className="text-sm font-mono bg-white px-3 py-2 rounded border flex-1 mr-2">
                                    {forwardingAddress}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(forwardingAddress)}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
                                <div>
                                    <h4 className="font-medium text-blue-900">Important:</h4>
                                    <p className="text-blue-800 text-sm">
                                        This address is unique to you. You'll use it to forward your banking emails.
                                        Never share this with anyone else.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={() => setSetupStep(2)} className="w-full">
                            Next: Choose Email Provider
                        </Button>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-center mb-4">Choose Your Email Provider</h3>
                        
                        <div className="grid gap-3">
                            {[
                                { id: 'gmail', name: 'Gmail', icon: '📧', popular: true },
                                { id: 'outlook', name: 'Outlook / Hotmail', icon: '📮' },
                                { id: 'apple', name: 'Apple Mail', icon: '🍎' },
                                { id: 'other', name: 'Other Email Provider', icon: '✉️' }
                            ].map(provider => (
                                <button
                                    key={provider.id}
                                    onClick={() => {
                                        setEmailProvider(provider.id);
                                        setSetupStep(3);
                                    }}
                                    className={`p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                                        provider.popular ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3">{provider.icon}</span>
                                            <span className="font-medium">{provider.name}</span>
                                        </div>
                                        {provider.popular && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                Most Popular
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-center mb-4">
                            Setup Instructions for {emailProvider === 'gmail' ? 'Gmail' : 
                                                   emailProvider === 'outlook' ? 'Outlook' : 
                                                   emailProvider === 'apple' ? 'Apple Mail' : 'Your Email'}
                        </h3>

                        {emailProvider === 'gmail' && (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">📋 Step-by-Step Instructions:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm">
                                        <li>Go to Gmail Settings (gear icon → "See all settings")</li>
                                        <li>Click "Forwarding and POP/IMAP" tab</li>
                                        <li>Click "Add a forwarding address"</li>
                                        <li>Enter: <code className="bg-white px-1 rounded">{forwardingAddress}</code></li>
                                        <li>Click "Next" → "Proceed" (we'll auto-confirm the verification)</li>
                                        <li>Create a filter: From contains <code className="bg-white px-1 rounded">cibc.com OR td.com OR rbc.com</code></li>
                                        <li>Set action to "Forward it to" your address</li>
                                    </ol>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open('https://mail.google.com/mail/u/0/#settings/fwdandpop', '_blank')}
                                        className="flex-1"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open Gmail Settings
                                    </Button>
                                    <Button
                                        onClick={() => copyToClipboard(forwardingAddress)}
                                        variant="outline"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {emailProvider === 'outlook' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">📋 Outlook Setup:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm">
                                        <li>Go to Outlook Settings (gear icon → "View all Outlook settings")</li>
                                        <li>Navigate to "Mail" → "Forwarding"</li>
                                        <li>Check "Enable forwarding"</li>
                                        <li>Enter: <code className="bg-white px-1 rounded">{forwardingAddress}</code></li>
                                        <li>Click "Save"</li>
                                        <li>Create rules to forward only banking emails</li>
                                    </ol>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => window.open('https://outlook.live.com/mail/0/options/mail/forwarding', '_blank')}
                                    className="w-full"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Outlook Settings
                                </Button>
                            </div>
                        )}

                        <div className="border-t pt-4">
                            <Button onClick={() => setSetupStep(4)} className="w-full">
                                I've Set Up Forwarding
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setSetupStep(2)}
                                className="w-full mt-2"
                            >
                                Back to Email Providers
                            </Button>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4 text-center">
                        <div className="mb-6">
                            {!testEmailSent ? (
                                <>
                                    <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Let's Test Your Setup</h3>
                                    <p className="text-gray-600 mb-4">
                                        We'll check if your email forwarding is working correctly.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Looking Good!</h3>
                                    <p className="text-gray-600 mb-4">
                                        We're checking for forwarded emails. This may take a few minutes.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg text-left">
                            <h4 className="font-medium mb-2">What to do next:</h4>
                            <ul className="text-sm space-y-1">
                                <li>• Make a small purchase with your card</li>
                                <li>• Wait for your bank's transaction email</li>
                                <li>• Check if it appears in your dashboard</li>
                                <li>• Or forward an old transaction email manually</li>
                            </ul>
                        </div>

                        {!testEmailSent ? (
                            <Button onClick={testSetup} className="w-full">
                                Test My Setup
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <Button onClick={() => setSetupComplete(true)} className="w-full">
                                    Setup Complete!
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSetupStep(3)}
                                    className="w-full"
                                >
                                    Back to Instructions
                                </Button>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (setupComplete) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">🎉 All Set!</h2>
                    <p className="text-gray-600 mb-6">
                        Your email forwarding is configured. Transaction emails will now appear automatically in your dashboard.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                        <h4 className="font-medium text-green-900 mb-2">What happens next:</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                            <li>✅ Banking emails forward to your unique address</li>
                            <li>✅ Transactions extract automatically</li>
                            <li>✅ Smart categorization applied</li>
                            <li>✅ Real-time dashboard updates</li>
                        </ul>
                    </div>
                    <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Email Forwarding Setup</h2>
                    <div className="text-sm text-gray-500">
                        Step {setupStep} of 4
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(setupStep / 4) * 100}%` }}
                    ></div>
                </div>
            </CardHeader>
            <CardContent>
                {renderStepContent()}
            </CardContent>
        </Card>
    );
};

export default EmailForwardingSetup;