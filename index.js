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

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Resilient Email Service - API Tester</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 2rem; background: #f9f9f9; }
                h2 { color: #333; }
                pre { background: #eee; padding: 1rem; overflow-x: auto; }
                button { margin: 0.5rem 0; padding: 0.5rem 1rem; }
                .response { white-space: pre-wrap; background: #fff; border: 1px solid #ccc; padding: 1rem; margin-top: 1rem; }
            </style>
        </head>
        <body>
            <h1>Resilient Email Service - API Tester</h1>
            <h2>Queue an email (valid request)</h2>
            <pre><code>curl -X POST https://resilient-email-service.onrender.com/send \\
  -H "Content-Type: application/json" \\
  -d '{"to":"test@example.com","subject":"Hello","body":"This is a test email","messageId":"abc-123"}'</code></pre>
            <button onclick="send('send1')">Run</button>
            <div id="send1" class="response"></div>

            <h2>Check status of a valid message</h2>
            <pre><code>curl https://resilient-email-service.onrender.com/status/abc-123</code></pre>
            <button onclick="send('status1', 'GET', '/status/abc-123')">▶ Run</button>
            <div id="status1" class="response"></div>

            <h2>Send duplicate email (should return status: duplicate)</h2>
            <pre><code>curl -X POST https://resilient-email-service.onrender.com/send \\
  -H "Content-Type: application/json" \\
  -d '{"to":"test@example.com","subject":"Hello again","body":"Duplicate attempt","messageId":"abc-123"}'</code></pre>
            <button onclick="send('send2')">Run</button>
            <div id="send2" class="response"></div>

            <h2>Send request with missing fields (should return 400 error)</h2>
            <pre><code>curl -X POST https://resilient-email-service.onrender.com/send \\
  -H "Content-Type: application/json" \\
  -d '{"to":"test@example.com","subject":"Missing body"}'</code></pre>
            <button onclick="send('send3')">Run</button>
            <div id="send3" class="response"></div>

            <h2>Check unknown messageId status</h2>
            <pre><code>curl https://resilient-email-service.onrender.com/status/unknown-id-xyz</code></pre>
            <button onclick="send('status2', 'GET', '/status/unknown-id-xyz')">▶ Run</button>
            <div id="status2" class="response"></div>

            <h2>Check all the logs</h2>
            <pre><code>curl -X GET https://resilient-email-service.onrender.com/logs</code></pre>
            <button onclick="send('logs', 'GET', '/logs')">Run</button>
            <div id="logs" class="response"></div>

            <script>
                async function send(id, method = 'POST', url = '/send') {
                    const payloads = {
                        send1: { to: "test@example.com", subject: "Hello", body: "This is a test email", messageId: "abc-123" },
                        send2: { to: "test@example.com", subject: "Hello again", body: "Duplicate attempt", messageId: "abc-123" },
                        send3: { to: "test@example.com", subject: "Missing body" }
                    };

                    try {
                        const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: method === 'POST' ? JSON.stringify(payloads[id]) : undefined
                        });
                        const data = await res.json();
                        document.getElementById(id).textContent = JSON.stringify(data, null, 2);
                    } catch (err) {
                        document.getElementById(id).textContent = 'Error: ' + err.message;
                    }
                }
            </script>
        </body>
        </html>
    `);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
