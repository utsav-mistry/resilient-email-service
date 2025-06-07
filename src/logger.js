import { client } from './mongo.js';

const dbName = 'resilientService';
const collectionName = 'emailLogs';

async function logToDB({ messageId, status, isDuplicate }) {
    try {
        const collection = client.db(dbName).collection(collectionName);
        await collection.insertOne({
            messageId,
            status,
            isDuplicate,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Logger DB error:', err.message);
    }
}

export default {
    info: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    async logEmail({ messageId, status, isDuplicate }) {
        await logToDB({ messageId, status, isDuplicate });
    },
    async getAllLogs() {
        try {
            const collection = client.db(dbName).collection(collectionName);
            return await collection.find({}).toArray();
        } catch (err) {
            console.error('Fetch logs error:', err.message);
            return [];
        }
    }
};
