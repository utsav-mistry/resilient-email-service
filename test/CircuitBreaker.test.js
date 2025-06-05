import assert from 'assert';
import CircuitBreaker from '../src/CircuitBreaker.js';

const unstableFunction = async () => {
    throw new Error('Failure');
};

const breaker = new CircuitBreaker(unstableFunction, {
    failureThreshold: 2,
    recoveryTime: 1000
});

(async () => {
    try { await breaker.fire(); } catch (_) { }
    try { await breaker.fire(); } catch (_) { }

    // Circuit should now be open
    try {
        await breaker.fire();
        assert.fail('Expected circuit to be open');
    } catch (err) {
        assert.strictEqual(err.message, 'Circuit is open');
    }

    // Wait for recovery
    setTimeout(async () => {
        // Replace with a working function
        breaker.action = async () => 'Success';

        const result = await breaker.fire();
        assert.strictEqual(result, 'Success');

        console.log('CircuitBreaker test passed');
    }, 1100);
})();
