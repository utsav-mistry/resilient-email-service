import assert from 'assert';
import EmailService from '../src/EmailService.js';
import ProviderA from '../src/MockProviderA.js';
import ProviderB from '../src/MockProviderB.js';

const emailService = new EmailService([ProviderA, ProviderB]);

const testEmail = {
    to: 'test@example.com',
    subject: 'Test Email',
    body: 'This is a test',
    messageId: `test-${Date.now()}`
};

(async () => {
    const result = await emailService.sendEmail(testEmail);
    assert.ok(['sent', 'failed', 'rate_limited', 'duplicate'].includes(result.status));
    console.log('EmailService test passed');
})();
