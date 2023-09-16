"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configFileSchema = void 0;
const zod_1 = require("zod");
exports.configFileSchema = zod_1.z.object({
    schemaFile: zod_1.z.string().optional(),
    surreal: zod_1.z.string().default('ws://127.0.0.1:8000'),
    db: zod_1.z.string().default('test'),
    ns: zod_1.z.string().default('test'),
    username: zod_1.z.string().default('root'),
    password: zod_1.z.string().default('root'),
    outputFolder: zod_1.z.string().default('client_generated'),
    generateClient: zod_1.z.boolean().default(true),
});
//# sourceMappingURL=configFileSchema.js.map