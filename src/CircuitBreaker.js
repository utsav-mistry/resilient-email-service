export default class CircuitBreaker {
    constructor(action, options = {}) {
        this.action = action;
        this.failureThreshold = options.failureThreshold || 3;
        this.recoveryTime = options.recoveryTime || 5000;

        this.failureCount = 0;
        this.state = 'CLOSED';
        this.nextAttempt = Date.now();
    }

    canRequest() {
        if (this.state === 'OPEN') {
            const now = Date.now();
            if (now >= this.nextAttempt) {
                this.state = 'HALF';
                return true;
            }
            return false;
        }
        return true;
    }

    async fire(...args) {
        if (!this.canRequest()) {
            throw new Error('Circuit is open');
        }

        try {
            const result = await this.action(...args);
            this._reset();
            return result;
        } catch (err) {
            this.failureCount++;

            if (this.failureCount >= this.failureThreshold) {
                this._trip();
            }

            throw err;
        }
    }

    _reset() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    _trip() {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.recoveryTime;
    }
}
  