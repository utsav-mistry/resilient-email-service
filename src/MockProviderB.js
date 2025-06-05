export default class ProviderB {
    constructor() {
        this.name = 'ProviderB';
    }

    send({ to, subject, body }) {
        return new Promise((resolve, reject) => {
            Math.random() < 0.9
                ? resolve({ success: true, to, subject })
                : reject(new Error('ProviderA failed'));
        });
    }
}
