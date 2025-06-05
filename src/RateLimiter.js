export default class RateLimiter {
    constructor(limit, windowMs) {
        this.limit = limit;
        this.windowMs = windowMs;
        this.requests = [];
    }

    allow() {
        const now = Date.now();
        this.requests = this.requests.filter(t => now - t < this.windowMs);
        if (this.requests.length >= this.limit) return false;
        this.requests.push(now);
        return true;
    }
}
  