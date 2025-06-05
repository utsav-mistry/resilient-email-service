// idempotency.js
import { connectToMongo } from './mongo.js';

const dbName = 'emailServiceDB';            // Change if your DB name is different
const collectionName = 'myCollection'; // Stores each ID as a document

export default class IdempotencyStore {
    constructor() {
        this.ready = connectToMongo().then(client => {
            this.collection = client.db(dbName).collection(collectionName);
            return this.collection.createIndex({ id: 1 }, { unique: true }); // Optional but recommended
        });
    }

    async has(id) {
        await this.ready;
        const entry = await this.collection.findOne({ id });
        return !!entry;
    }

    async add(id) {
        await this.ready;
        try {
            await this.collection.insertOne({ id });
        } catch (err) {
            if (err.code === 11000) {
                // Duplicate key error, already exists
                return;
            }
            throw err;
        }
    }
}
