import { z } from 'zod';
import { configFileSchema } from './configFileSchema.js';
export type Config = z.output<typeof configFileSchema>;
//# sourceMappingURL=types.d.ts.map