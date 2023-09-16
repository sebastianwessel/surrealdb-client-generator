import { Surreal } from 'surrealdb.js';
import { Config } from '../config/types.js';
export declare const getDb: () => Surreal;
export declare const connectDb: (config: Config) => Promise<void>;
export declare const insertDefinitions: (content: string) => Promise<void>;
export declare const closeDb: () => Promise<void>;
//# sourceMappingURL=db.d.ts.map