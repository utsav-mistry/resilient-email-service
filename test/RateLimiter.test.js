import assert from 'assert';
import RateLimiter from '../src/RateLimiter.js';

const limiter = new RateLimiter(2, 2000); // allow 2 requests per 2 sec

assert.strictEqual(limiter.allow(), true);
assert.strictEqual(limiter.allow(), true);
assert.strictEqual(limiter.allow(), false); // should hit limit

setTimeout(() => {
    assert.strictEqual(limiter.allow(), true); // after cooldown
    console.log('RateLimiter test passed');
}, 2100);
