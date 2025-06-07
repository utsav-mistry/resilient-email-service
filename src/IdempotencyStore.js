import { connectToMongo } from './mongo.js';

const dbName = 'resilientService';            
const collectionName = 'idempotencyKeys';      

export default class IdempotencyStore {
    constructor() {
        this.ready = connectToMongo().then(client => {
            this.collection = client.db(dbName).collection(collectionName);
            return this.collection.createIndex({ messageId: 1 }, { unique: true });
        });
    }

    async has(messageId) {
        await this.ready;
        const entry = await this.collection.findOne({ messageId });
        return !!entry;
    }

    async add(messageId) {
        await this.ready;
        try {
            await this.collection.insertOne({
                messageId,
                timestamp: new Date() 
            });
        } catch (err) {
            if (err.code === 11000) {
                return;
            }
            throw err;
        }
    }
}
