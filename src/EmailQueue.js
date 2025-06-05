export default class EmailQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    enqueue(email) {
        this.queue.push(email);
        this._startProcessing();
    }

    process(handler) {
        this.handler = handler;
        this._startProcessing();
    }

    async _startProcessing() {
        if (this.processing || !this.handler) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const email = this.queue.shift();
            try {
                await this.handler(email);
            } catch (err) {
                console.error(`Failed to process ${email?.messageId || 'unknown'}:`, err.message);
            }
        }

        this.processing = false;
    }
}
  