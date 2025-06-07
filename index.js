import express from 'express';
import EmailService from './src/EmailService.js';
import EmailQueue from './src/EmailQueue.js';
import ProviderA from './src/MockProviderA.js';
import ProviderB from './src/MockProviderB.js';
import logger from './src/logger.js';

const app = express();
app.use(express.json());

const emailService = new EmailService([new ProviderA(), new ProviderB()]);
const emailQueue = new EmailQueue(emailService);

emailQueue.process((email) => emailService.sendEmail(email));

app.post('/send', (req, res) => {
    const { to, subject, body, messageId } = req.body;
    if (!to || !subject || !body || !messageId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    emailQueue.enqueue({ to, subject, body, messageId });
    res.json({ status: 'queued', messageId });
});

app.get('/status/:messageId', async (req, res) => {
    const status = await emailService.getStatus(req.params.messageId);
    res.json({ messageId: req.params.messageId, status });
});

app.get('/logs', async (req, res) => {
    try {
        const logs = await logger.getAllLogs();
        res.json(logs);
    } catch (err) {
        console.error('Error retrieving logs:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
