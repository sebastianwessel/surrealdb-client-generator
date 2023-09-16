"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUpperCamelCase = void 0;
const toCamelCase_js_1 = require("./toCamelCase.js");
const toUpperCamelCase = (str) => {
    const s = (0, toCamelCase_js_1.toCamelCase)(str);
    return s.slice(0, 1).toUpperCase() + s.slice(1);
};
exports.toUpperCamelCase = toUpperCamelCase;
//# sourceMappingURL=toUpperCamelCase.js.map