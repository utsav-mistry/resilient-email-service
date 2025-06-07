import express from 'express';
import EmailService from './src/EmailService.js';
import EmailQueue from './src/EmailQueue.js';
import ProviderA from './src/MockProviderA.js';
import ProviderB from './src/MockProviderB.js';
import logger from './src/logger.js';
import IdempotencyStore from './src/IdempotencyStore.js';

const app = express();
app.use(express.json());

const emailService = new EmailService([new ProviderA(), new ProviderB()]);
const emailQueue = new EmailQueue(emailService);
const idempotencyStore = new IdempotencyStore();

emailQueue.process((email) => emailService.sendEmail(email));


app.post('/send', async (req, res) => {
    const { to, subject, body, messageId } = req.body;

    if (!to || !subject || !body || !messageId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const isDuplicate = await idempotencyStore.has(messageId)

        if (isDuplicate) {
            return res.status(200).json({ status: 'duplicate', messageId });
        }

        await idempotencyStore.add(messageId)

        emailQueue.enqueue({ to, subject, body, messageId });

        return res.status(200).json({ status: 'queued', messageId });
    } catch (err) {
        console.error('Error in /send:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Resilient Email Service - API Tester</title>
            <style>
                body {
                    font-family: 'Segoe UI', sans-serif;
                    padding: 2rem;
                    background: #f4f4f4;
                    color: #333;
                }
                h1 { margin-bottom: 1rem; }
                h2 { margin-top: 2rem; font-size: 1.2rem; }
                pre {
                    background: #eee;
                    padding: 1rem;
                    overflow-x: auto;
                    border-radius: 4px;
                }
                .response {
                    white-space: pre-wrap;
                    background: #fff;
                    border-left: 5px solid #ccc;
                    padding: 1rem;
                    margin-top: 1rem;
                    border-radius: 4px;
                }
                .success { border-left-color: #4CAF50; }
                .error { border-left-color: #f44336; }
                button {
                    padding: 0.4rem 1rem;
                    margin-top: 0.5rem;
                    margin-right: 0.5rem;
                    cursor: pointer;
                    border: none;
                    background-color: #007BFF;
                    color: white;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                button:hover { background-color: #0056b3; }
                #resetResponses {
                    background-color: #dc3545;
                }
                #resetResponses:hover {
                    background-color: #a71d2a;
                }
                #resetPayloads {
                    background-color: #ffc107;
                    color: #000;
                }
                #resetPayloads:hover {
                    background-color: #d39e00;
                }
                textarea {
                    width: 100%;
                    height: 100px;
                    font-family: monospace;
                    font-size: 0.95rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                    resize: vertical;
                }
                .section {
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 1rem;
                    margin-bottom: 1rem;
                }
            </style>
        </head>
        <body>
            <h1>Resilient Email Service - API Tester</h1>
            <button id="resetResponses" onclick="resetAll()">Reset Responses</button>
            <button id="resetPayloads" onclick="resetPayloadEditors()">Reset API Payloads to Default</button>
        
            <div class="section">
                <h2>Queue a Valid Email</h2>
                <textarea id="payload-send1"></textarea>
                <button onclick="sendRequest('send1')">▶ Run</button>
                <div id="send1" class="response"></div>
            </div>
        
            <div class="section">
                <h2>Check Status (Valid)</h2>
                <button onclick="sendRequest('status1', 'GET', '/status/abc-123')">▶ Run</button>
                <div id="status1" class="response"></div>
            </div>
        
            <div class="section">
                <h2>Send Duplicate Email</h2>
                <textarea id="payload-send2"></textarea>
                <button onclick="sendRequest('send2')">▶ Run</button>
                <div id="send2" class="response"></div>
            </div>
        
        
            <div class="section">
                <h2>Unknown Message ID</h2>
                <button onclick="sendRequest('status2', 'GET', '/status/unknown-id-xyz')">▶ Run</button>
                <div id="status2" class="response"></div>
            </div>
        
            <div class="section">
                <h2>Get All Logs</h2>
                <textarea rows="1" disabled style="width: 300px; resize: none; height:18px">/logs</textarea>
                <br>
                <button onclick="sendRequest('logs', 'GET', '/logs')">▶ Run</button>
                <div id="logs" class="response"></div>
            </div>
        
            <script>
                const defaultPayloads = {
                    send1: { to: "test@example.com", subject: "Hello", body: "This is a test email", messageId: "abc-123" },
                    send2: { to: "test@example.com", subject: "Hello again", body: "Duplicate attempt", messageId: "abc-123" },
                    send3: { to: "test@example.com", subject: "Missing body" }
                };
        
                function resetPayloadEditors() {
                    for (const id in defaultPayloads) {
                        const editor = document.getElementById('payload-' + id);
                        if (editor) {
                            editor.value = JSON.stringify(defaultPayloads[id], null, 2);
                        }
                    }
                }
        
                async function sendRequest(id, method = 'POST', url = '/send') {
                    const resBox = document.getElementById(id);
                    resBox.className = 'response';
        
                    let body = undefined;
                    if (method === 'POST') {
                        const text = document.getElementById('payload-' + id)?.value || '{}';
                        try {
                            body = JSON.stringify(JSON.parse(text)); // Validate JSON
                        } catch {
                            resBox.textContent = 'Invalid JSON payload';
                            resBox.classList.add('error');
                            return;
                        }
                    }
        
                    try {
                        const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body
                        });
                        const data = await res.json();
                        resBox.textContent = JSON.stringify(data, null, 2);
                        resBox.classList.add(res.ok ? 'success' : 'error');
                    } catch (err) {
                        resBox.textContent = 'Error: ' + err.message;
                        resBox.classList.add('error');
                    }
                }
        
                function resetAll() {
                    document.querySelectorAll('.response').forEach(el => {
                        el.textContent = '';
                        el.className = 'response';
                    });
                }
        
                window.onload = resetPayloadEditors;
            </script>
        </body>
        </html>
        `);
        
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
