"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableFields = void 0;
const db_js_1 = require("./db.js");
const getTableFields = async (tableName) => {
    const db = (0, db_js_1.getDb)();
    const result = (await db.query(`INFO FOR TABLE ${tableName};`, {}));
    const res = result[0]?.result;
    return res.fields;
};
exports.getTableFields = getTableFields;
//# sourceMappingURL=getTableFields.js.map