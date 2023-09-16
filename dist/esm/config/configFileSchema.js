import { z } from 'zod';
export const configFileSchema = z.object({
    schemaFile: z.string().optional(),
    surreal: z.string().default('ws://127.0.0.1:8000'),
    db: z.string().default('test'),
    ns: z.string().default('test'),
    username: z.string().default('root'),
    password: z.string().default('root'),
    outputFolder: z.string().default('client_generated'),
    generateClient: z.boolean().default(true),
});
//# sourceMappingURL=configFileSchema.js.map