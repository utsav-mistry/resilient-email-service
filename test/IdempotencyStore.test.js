import assert from 'assert';
import IdempotencyStore from '../src/IdempotencyStore.js';

const store = new IdempotencyStore();
const testId = `test-${Date.now()}`;

assert.strictEqual(store.has(testId), false);
store.add(testId);
assert.strictEqual(store.has(testId), true);

console.log('IdempotencyStore test passed');
