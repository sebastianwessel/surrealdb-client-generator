import { describe, test, expect } from 'vitest'
import { RecordId, StringRecordId } from 'surrealdb.js'
import z from 'zod';

const RecordIdValue = z.union([
    z.string(),
    z.number(),
    z.bigint(),
    z.record(z.unknown()),
    z.array(z.unknown()),
]);

type RecordIdValue = z.infer<typeof RecordIdValue>

type TableRecordId<T extends string> = RecordId<T> | StringRecordId | `${T}:${string}`;

function recordId<Table extends string = string>(table?: Table) {
    const tableRegex = table ? table : '[A-Za-z_][A-Za-z0-9_]*';
    const idRegex = '[^:]+';
    const fullRegex = new RegExp(`^${tableRegex}:${idRegex}$`);

    return z.union([
        z.custom<RecordId<string>>((val): val is RecordId<string> => val instanceof RecordId)
            .refine((val): val is RecordId<Table> => !table || val.tb === table, {
                message: table ? `RecordId must be of type '${table}'` : undefined
            }),
        z.custom<StringRecordId>((val): val is StringRecordId => val instanceof StringRecordId)
            .refine((val) => !table || val.rid.startsWith(`${table}:`), {
                message: table ? `StringRecordId must start with '${table}:'` : undefined
            }),
        z.string().regex(fullRegex, {
            message: table
                ? `Invalid record ID format. Must be '${table}:id'`
                : "Invalid record ID format. Must be 'table:id'"
        })
    ]).transform((val): TableRecordId<Table> => {
        if (typeof val === 'string') {
            return new StringRecordId(val) as TableRecordId<Table>;
        }
        return val as TableRecordId<Table>;
    });
}

describe('recordId type tests', () => {
    const createRecordId = (tb: string, id: RecordIdValue) => new RecordId(tb, id);
    const createStringRecordId = (tb: string, id: string | number | object | any[]) =>
        new StringRecordId(`${tb}:${typeof id === 'object' ? JSON.stringify(id) : id}`);

    test('Valid simple RecordId', () => {
        const schema = recordId();
        const result = schema.safeParse(createRecordId('internet', 'test'));
        expect(result.success).toBe(true);
    });

    test('Valid simple StringRecordId', () => {
        const schema = recordId();
        const result = schema.safeParse(createStringRecordId('internet', 'test'));
        expect(result.success).toBe(true);
    });

    test('Valid simple string (transformed to StringRecordId)', () => {
        const schema = recordId();
        const result = schema.safeParse('internet:test');
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toBeInstanceOf(StringRecordId);
            expect((result.data as StringRecordId).rid).toBe('internet:test');
        }
    });

    test('Invalid string (does not start with valid table name)', () => {
        const schema = recordId();
        const result = schema.safeParse('123invalid:test');
        expect(result.success).toBe(false);
    });

    test('Valid numeric RecordId', () => {
        const schema = recordId();
        const result = schema.safeParse(createRecordId('internet', 9000));
        expect(result.success).toBe(true);
    });

    test('Valid numeric StringRecordId', () => {
        const schema = recordId();
        const result = schema.safeParse(createStringRecordId('internet', 9000));
        expect(result.success).toBe(true);
    });

    test('Valid object-based RecordId', () => {
        const schema = recordId();
        const result = schema.safeParse(createRecordId('temperature', { location: 'London', date: new Date() }));
        expect(result.success).toBe(true);
    });

    test('Valid object-based StringRecordId', () => {
        const schema = recordId();
        const result = schema.safeParse(createStringRecordId('temperature', { location: 'London', date: new Date().toISOString() }));
        expect(result.success).toBe(true);
    });

    test('Invalid record ID (not a valid string format)', () => {
        const schema = recordId();
        const result = schema.safeParse('invalidstring');
        expect(result.success).toBe(false);
    });

    test('Valid RecordId with specific table', () => {
        const schema = recordId('internet');
        const result = schema.safeParse(createRecordId('internet', 'test'));
        expect(result.success).toBe(true);
    });

    test('Valid StringRecordId with specific table', () => {
        const schema = recordId('internet');
        const result = schema.safeParse(createStringRecordId('internet', 'test'));
        expect(result.success).toBe(true);
    });

    test('Valid string with specific table (transformed to StringRecordId)', () => {
        const schema = recordId('internet');
        const result = schema.safeParse('internet:test');
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toBeInstanceOf(StringRecordId);
            expect((result.data as StringRecordId).rid).toBe('internet:test');
        }
    });

    test('Invalid RecordId with wrong table', () => {
        const schema = recordId('internet');
        const result = schema.safeParse(createRecordId('users', 'test'));
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe("RecordId must be of type 'internet'");
        }
    });

    test('Invalid StringRecordId with wrong table', () => {
        const schema = recordId('internet');
        const result = schema.safeParse(createStringRecordId('users', 'test'));
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe("StringRecordId must start with 'internet:'");
        }
    });

    test('Invalid string with wrong table', () => {
        const schema = recordId('internet');
        const result = schema.safeParse('users:test');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe("Invalid record ID format. Must be 'internet:id'");
        }
    });
});