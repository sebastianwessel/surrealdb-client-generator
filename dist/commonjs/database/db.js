"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDb = exports.insertDefinitions = exports.connectDb = exports.getDb = void 0;
const surrealdb_js_1 = require("surrealdb.js");
let db;
const getDb = () => {
    if (db) {
        return db;
    }
    throw new Error('Not connected to a database');
};
exports.getDb = getDb;
const connectDb = async (config) => {
    console.log('connect to database');
    db = new surrealdb_js_1.Surreal();
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
exports.connectDb = connectDb;
const insertDefinitions = async (content) => {
    const db = (0, exports.getDb)();
    const result = await db.query(content, {});
    console.log('insertDefinitions:', JSON.stringify(result, null, 2));
};
exports.insertDefinitions = insertDefinitions;
const closeDb = async () => {
    db?.close();
    console.log('database closed');
};
exports.closeDb = closeDb;
//# sourceMappingURL=db.js.map