import express from 'express';
import EmailService from './EmailService.js';
import ProviderA from './providers/ProviderA.js';
import ProviderB from './providers/ProviderB.js';
import EmailQueue from './EmailQueue.js';

const app = express();
app.use(express.json());

const providers = [
    new ProviderA(),
    new ProviderB()
];

const emailService = new EmailService(providers);
const queue = new EmailQueue();

queue.process(async (email) => {
    await emailService.sendEmail(email.to, email.subject, email.body, email.messageId);
});

app.post('/send-email', async (req, res) => {
    const { to, subject, body, messageId } = req.body;
    if (!to || !subject || !body || !messageId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    queue.enqueue({ to, subject, body, messageId });
    res.status(202).json({ status: 'Queued' });
});

export default app;