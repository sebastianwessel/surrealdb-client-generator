import { fieldsToObject } from './fieldsToObject.js'
import { type FieldDetail, getDetailsFromDefinition } from './getDetailsFromDefinition.js'

export const mergeNested = (fields: Record<string, string>, isInputSchema: boolean) => {
	const inputFields = Object.entries(fields)
		.filter(([fname, _definition]) => !fname.includes('['))
		.map(([_fname, definition]) => {
			return getDetailsFromDefinition(definition, isInputSchema)
		})

	const obj = fieldsToObject(inputFields)

	const fieldMap = new Map<string, FieldDetail>()

	for (const field of inputFields) {
		fieldMap.set(field.name, field)
	}

	const mergeSchemaString = (o: object, prev?: string) => {
		const entries = Object.entries(o)

		const current = prev ? fieldMap.get(prev) : undefined

		if (!entries.length) {
			return current?.zodString ?? 'z.any()'
		}

		let res = ''

		for (const [name, value] of entries) {
			const n = prev ? `${prev}.${name}` : name
			res += `${name}: ${mergeSchemaString(value, n)},\n`
		}

		if (current?.zodString.startsWith('z.object({})')) {
			return current.zodString.replace('z.object({})', `z.object({${res}})`)
		}

		if (current?.zodString.startsWith('z.array(z.any())')) {
			return current.zodString.replace('z.array(z.any())', `z.array(z.object({${res}}))`)
		}

		return `z.object({${res}})`
	}

	return mergeSchemaString(obj)
}
