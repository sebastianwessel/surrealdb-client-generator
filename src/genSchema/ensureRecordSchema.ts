import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { mkdirp } from 'mkdirp'

export const ensureRecordSchema = async (rootPath: string) => {
	const content = `import z from 'zod';
import { RecordId } from 'surrealdb.js'

export const ZRecordIdInstanceOf = z.instanceof(RecordId);

export function recordId<Table extends string = string>(table?: Table) {
  return z.custom<RecordId<Table>>(
    val => {
      const instanceOfCheck = ZRecordIdInstanceOf.safeParse(val);
      const tableCheck = table ? val?.tb === table : true;
      return instanceOfCheck.success && tableCheck;
    },
    val => {
      let msgArray: string[] = [];
      const instanceOfCheck = ZRecordIdInstanceOf.safeParse(val);
      if (!instanceOfCheck.success) msgArray.push('Must be a RecordId class');

      const tableCheck = table ? val?.tb === table : true;
      if (!tableCheck) msgArray.push(\`RecordId must be of type '\${table}', not '\${val?.tb}'\`);

      return { message: msgArray.join("; ") };
    }
  );
}`

	await mkdirp(rootPath)

	const fileName = join(rootPath, 'recordSchema.ts')

	console.log(fileName)
	if (!existsSync(fileName)) {
		writeFileSync(fileName, content, { flag: 'wx' })
	}
}
