import RateLimiter from './RateLimiter.js';
import CircuitBreaker from './CircuitBreaker.js';
import IdempotencyStore from './IdempotencyStore.js';
import logger from './logger.js';
import { connectToMongo } from './mongo.js';

export default class EmailService {
    constructor(providers) {
        this.providers = providers.map(p => ({
            name: p.name,
            send: p.send,
            circuit: new CircuitBreaker()
        }));
        this.rateLimiter = new RateLimiter(10, 60 * 1000);
        this.idempotencyStore = new IdempotencyStore();
    }

    async sendEmail({ to, subject, body, messageId }) {
        const isDuplicate = await this.idempotencyStore.has(messageId);

        if (isDuplicate) {
            logger.warn(`Duplicate send attempt for messageId: ${messageId}`);
            await logger.logEmail({ messageId, status: 'not sent', isDuplicate: true });
            return { status: 'duplicate' };
        }

        if (!this.rateLimiter.allow()) {
            logger.warn('Rate limit exceeded');
            return { status: 'rate_limited' };
        }

        for (let provider of this.providers) {
            if (!provider.circuit.canRequest()) {
                logger.warn(`Circuit open for provider: ${provider.name}`);
                continue;
            }

            try {
                const response = await this._retry(() => provider.send({ to, subject, body }), 3);
                await this.idempotencyStore.add(messageId);

                logger.info(`Email sent via ${provider.name} to ${to}`);
                await logger.logEmail({ messageId, status: 'sent', isDuplicate: false });

                return { status: 'sent', provider: provider.name, response };
            } catch (error) {
                provider.circuit.recordFailure();
                logger.error(`Provider ${provider.name} failed: ${error.message}`);
            }
        }

        await logger.logEmail({ messageId, status: 'failed', isDuplicate: false });
        return { status: 'failed' };
    }

    async _retry(fn, retries, delay = 500) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await fn();
            } catch (err) {
                attempt++;
                if (attempt === retries) throw err;
                await new Promise(res => setTimeout(res, delay * 2 ** attempt));
            }
        }
    }


    async getStatus(messageId) {
        const client = await connectToMongo();
        const collection = client.db("resilientService").collection("emailLogs");
        const log = await collection.findOne({ messageId });
        return log ? log.status : 'unknown';
    }
    
}
