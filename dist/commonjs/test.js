"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenize_js_1 = require("./genSchema/tokenize.js");
const result = (0, tokenize_js_1.tokenize)(`DEFINE FIELD name ON TABLE subscription TYPE string ASSERT $value INSIDE ["create", "read", "write", "delete"];`);
console.log(JSON.stringify(result, null, 2));
//# sourceMappingURL=test.js.map