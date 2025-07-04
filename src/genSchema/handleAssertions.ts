const COMPARISON_OPERATORS = ['<=', '<', '>=', '>', '=', '=='] as const
type ComparisonOperator = (typeof COMPARISON_OPERATORS)[number]

// Types
export type SchemaType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'

// Utility functions
const parseComparison = (condition: string): [ComparisonOperator, string] | null => {
	for (const op of COMPARISON_OPERATORS) {
		if (condition.includes(op)) {
			const [_, value] = condition.split(op)
			if (value) {
				return [op, value.trim()]
			}
		}
	}
	return null
}

const handleStringAssertions = (schema: string, condition: string): string => {
	const stringAssertionRegex = /\s?string::is::([^)]*)\(/im
	const match = condition.match(stringAssertionRegex)

	if (match) {
		switch (match[1]?.toLowerCase()) {
			case 'alphanum':
				return `${schema}.regex(/^[a-zA-Z0-9]*$/)`
			case 'alpha':
				return `${schema}.regex(/^[a-zA-Z]*$/)`
			case 'ascii':
				return `${schema}.regex(/^[\x00-\x7F]*$/)`
			case 'datetime':
				return `z.coerce.date()`
			case 'url':
				return `${schema}.url()`
			case 'email':
				return `${schema}.email()`
			case 'hexadecimal':
				return `${schema}.regex(/^[0-9a-fA-F]*$/)`
			case 'latitude':
				return `${schema}.regex(/^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/)`
			case 'longitude':
				return `${schema}.regex(/^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$/)`
			case 'numeric':
				return `${schema}.regex(/^[0-9]*$/)`
			case 'semver':
				return `${schema}.regex(/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-(0|[1-9A-Za-z-][0-9A-Za-z-]*)(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/)`
			case 'uuid':
				return `${schema}.uuid()`
			case 'ip':
				return `${schema}.ip()`
			case 'ipv4':
				return `${schema}.ip({ version: "v4" })`
			case 'ipv6':
				return `${schema}.ip({ version: "v6" })`
			default:
				return schema
		}
	}

	const lenComparisonRegex = /string::len\(\$value\)\s*([<>]=?|=)\s*(\d+)/
	const lenMatch = condition.match(lenComparisonRegex)
	if (lenMatch) {
		const [_, op, value] = lenMatch
		if (value) {
			switch (op) {
				case '<=':
					return `${schema}.max(${value})`
				case '<':
					return `${schema}.max(${Number(value) - 1})`
				case '>=':
					return `${schema}.min(${value})`
				case '>':
					return `${schema}.min(${Number(value) + 1})`
				case '=':
				case '==':
					return `${schema}.length(${value})`
				default:
					throw new Error(`Unsupported operator: ${op}`)
			}
		}
	}

	if (condition.includes('NOT IN') || condition.includes('NOTINSIDE')) {
		const match = condition.match(/(NOT IN|NOTINSIDE)\s*(\[.*?])/)
		if (match?.[2]) {
			const values = match[2].trim()
			return `${schema}.refine((val) => !${values}.includes(val), {
            message: "String must not be one of ${values}",
        })`
		}
	} else if (condition.includes('INSIDE')) {
		const match = condition.match(/INSIDE\s*(\[.*?])/)
		if (match?.[1]) {
			return `z.enum(${match[1].trim()})`
		}
	} else if (condition.includes('IN')) {
		const match = condition.match(/\bIN\s*(\[.*?])/)
		if (match?.[1]) {
			return `z.enum(${match[1].trim()})`
		}
	}

	const multiWordRegex = /^array::len\(string::words\(\$value\)\)\s*>\s*1$/
	if (multiWordRegex.test(condition)) {
		return `${schema}.refine((val) => val.trim().split(/\\s+/).length > 1, {
        message: "String must contain more than 1 word",
    })`
	}

	const emptyOrMultiWordRegex =
		/^IF\s+\$value\s+THEN\s+array::len\(string::words\(\$value\)\)\s*>\s*1\s+ELSE\s+true\s+END$/
	if (emptyOrMultiWordRegex.test(condition)) {
		return `${schema}.refine((val) => !val || val.trim().split(/\\s+/).length > 1, {
        message: "String must be empty or contain more than 1 word",
    })`
	}

	return schema
}

const handleNumberAssertions = (schema: string, condition: string): string => {
	const comparisonResult = parseComparison(condition)
	if (comparisonResult) {
		const [op, value] = comparisonResult
		switch (op) {
			case '<=':
				return `${schema}.max(${value})`
			case '<':
				return `${schema}.max(${Number(value) - 1})`
			case '>=':
				return `${schema}.min(${value})`
			case '>':
				return `${schema}.min(${Number(value) + 1})`
			case '=':
			case '==':
				return `z.literal(${value})`
			default:
				throw new Error(`Unsupported operator: ${op}`)
		}
	}

	return schema
}

const handleDateAssertions = (schema: string): string => {
	return schema
}

const handleArrayAssertions = (schema: string, condition: string): string => {
	let newSchema = schema
	if (condition.includes('array::len($value)')) {
		const lenMatch = condition.match(/array::len\(\$value\)\s*(>|>=|=|<=|<)\s*(\d+)/)
		if (lenMatch) {
			const [_, operator, value] = lenMatch
			return `${schema}.refine(
                (arr) => arr.length ${operator} ${value},
                { message: "Array length must be ${operator} ${value}" }
            )`
		}
	}

	const enumMatch = condition.match(/(IN|INSIDE|ALLINSIDE)\s*(\[.*?])/)

	if (enumMatch) {
		const [_, __, values] = enumMatch
		newSchema = newSchema.replace('z.array(z.unknown())', `z.array(z.enum(${values}))`)
	}

	if (condition.includes('ALLINSIDE')) {
		const [_, values] = condition.split(/ALLINSIDE\s*(\[.*])/)

		if (!values) throw new Error('Invalid ALLINSIDE assertion')
		return `${newSchema}.refine(
            (arr) => arr.every((item) => ${values}.includes(item)),
            { message: "Array items must be one of ${values}" }
        )`
	}

	return newSchema
}

export const handleAssertions = (schema: string, assertion: string, schemaType: SchemaType): string => {
	const conditions = assertion.split(/AND|&&/)

	return conditions.reduce((acc, condition) => {
		const con = condition.trim()
		if (!con) return acc
		switch (schemaType) {
			case 'string':
				return handleStringAssertions(acc, con)
			case 'number':
				return handleNumberAssertions(acc, con)
			case 'date':
				return handleDateAssertions(acc)
			case 'array':
				return handleArrayAssertions(acc, con)
			default:
				return acc
		}
	}, schema)
}
