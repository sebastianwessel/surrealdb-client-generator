import { z } from 'zod';
export declare const configFileSchema: z.ZodObject<{
    schemaFile: z.ZodOptional<z.ZodString>;
    surreal: z.ZodDefault<z.ZodString>;
    db: z.ZodDefault<z.ZodString>;
    ns: z.ZodDefault<z.ZodString>;
    username: z.ZodDefault<z.ZodString>;
    password: z.ZodDefault<z.ZodString>;
    outputFolder: z.ZodDefault<z.ZodString>;
    generateClient: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    surreal: string;
    db: string;
    ns: string;
    username: string;
    password: string;
    outputFolder: string;
    generateClient: boolean;
    schemaFile?: string | undefined;
}, {
    schemaFile?: string | undefined;
    surreal?: string | undefined;
    db?: string | undefined;
    ns?: string | undefined;
    username?: string | undefined;
    password?: string | undefined;
    outputFolder?: string | undefined;
    generateClient?: boolean | undefined;
}>;
//# sourceMappingURL=configFileSchema.d.ts.map