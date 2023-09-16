"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTableNames = void 0;
const db_js_1 = require("./db.js");
const getAllTableNames = async () => {
    const db = (0, db_js_1.getDb)();
    const result = (await db.query(`INFO FOR DB;`, {}));
    if (!result[0]?.result) {
        console.error('', result);
        console.error('🤷‍♂️ Sorry, but no tables found.');
        console.error('Please check the config');
        console.error('');
        process.exit(1);
    }
    const res = result[0]?.result;
    return Object.keys(res.tables);
};
exports.getAllTableNames = getAllTableNames;
//# sourceMappingURL=getAllTableNames.js.map