import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { mkdirp } from 'mkdirp'

export const ensureRecordSchema = async (rootPath: string) => {
	const content = `import z from 'zod';
import { RecordId, StringRecordId } from 'surrealdb'

export function recordId<Table extends string = string>(table?: Table) {
    const tableRegex = table ? table : '[A-Za-z_][A-Za-z0-9_]*';
    const idRegex = '[^:]+';
    const fullRegex = new RegExp(\`^\${tableRegex}:\${idRegex}$\`);

    return z.union([
        z.custom<RecordId<string>>((val): val is RecordId<string> => val instanceof RecordId)
            .refine((val): val is RecordId<Table> => !table || val.tb === table, {
                message: table ? \`RecordId must be of type '\${table}'\` : undefined
            }),
        z.custom<StringRecordId>((val): val is StringRecordId => val instanceof StringRecordId)
            .refine((val) => !table || val.rid.startsWith(\`\${table}:\`), {
                message: table ? \`StringRecordId must start with '\${table}:'\` : undefined
            }),
        z.string().regex(fullRegex, {
            message: table
                ? \`Invalid record ID format. Must be '\${table}:id'\`
                : "Invalid record ID format. Must be 'table:id'"
        }),
        z.object({
            tb: z.string(),
            id: z.union([z.string(), z.number(), z.record(z.unknown())])
        }).refine((val) => !table || val.tb === table, {
            message: table ? \`RecordId must be of type '\${table}'\` : undefined
        })
    ]).transform((val): RecordId<Table> => {
        if (val instanceof RecordId) {
            return val as RecordId<Table>;
        }
        if (val instanceof StringRecordId) {
            const [tb!, id!] = val.rid.split(':');
            return new RecordId(tb, id) as RecordId<Table>;
        }
        if (typeof val === 'string') {
            const [tb!, id!] = val.split(':');
            return new RecordId(tb, id) as RecordId<Table>;
        }
        if (typeof val === 'object' && val !== null && 'tb' in val && 'id' in val) {
            return new RecordId(val.tb, val.id) as RecordId<Table>;
        }
        throw new Error('Invalid input for RecordId');
    });
}`

	await mkdirp(rootPath)

	const fileName = join(rootPath, 'recordSchema.ts')

	console.log(fileName)
	if (!existsSync(fileName)) {
		writeFileSync(fileName, content, { flag: 'wx' })
	}
}
