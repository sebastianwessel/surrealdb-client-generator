import { Surreal } from 'surrealdb.js';
let db;
export const getDb = () => {
    if (db) {
        return db;
    }
    throw new Error('Not connected to a database');
};
export const connectDb = async (config) => {
    console.log('connect to database');
    db = new Surreal();
    await db.connect(config.surreal, {
        ns: config.ns,
        db: config.db,
        auth: { user: config.username, pass: config.password },
    });
    await db.use({
        ns: config.ns,
        db: config.db,
    });
};
export const insertDefinitions = async (content) => {
    const db = getDb();
    const result = await db.query(content, {});
    console.log('insertDefinitions:', JSON.stringify(result, null, 2));
};
export const closeDb = async () => {
    db?.close();
    console.log('database closed');
};
//# sourceMappingURL=db.js.map