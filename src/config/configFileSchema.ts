import { z } from 'zod'

export const configFileSchema = z.object({
	schemaFile: z.string().optional(),
	surreal: z.string().default('memory'),
	db: z.string().default('test'),
	ns: z.string().default('test'),
	username: z.string().default('root'),
	password: z.string().default('root'),
	outputFolder: z.string().default('client_generated'),
	outputGenFolder: z.string().default('__generated'),
	generateClient: z.boolean().default(true),
})
