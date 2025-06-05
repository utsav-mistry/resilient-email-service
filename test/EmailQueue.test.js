import assert from 'assert';
import EmailQueue from '../src/EmailQueue.js';

const queue = new EmailQueue();
let processedCount = 0;

queue.enqueue({
    to: 'a@example.com',
    subject: 'Subject A',
    body: 'Body A',
    messageId: 'id-a',
});

queue.enqueue({
    to: 'b@example.com',
    subject: 'Subject B',
    body: 'Body B',
    messageId: 'id-b',
});

queue.process(async (email) => {
    assert.ok(email.to.includes('@'), 'Invalid email object');
    processedCount++;
});

setTimeout(() => {
    try {
        assert.strictEqual(processedCount, 2);
        console.log('EmailQueue test passed');
    } catch (err) {
        console.error('EmailQueue test failed:', err.message);
        process.exit(1);
    }
}, 1000);
