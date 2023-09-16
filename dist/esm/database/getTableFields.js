import { getDb } from './db.js';
export const getTableFields = async (tableName) => {
    const db = getDb();
    const result = (await db.query(`INFO FOR TABLE ${tableName};`, {}));
    const res = result[0]?.result;
    return res.fields;
};
//# sourceMappingURL=getTableFields.js.map