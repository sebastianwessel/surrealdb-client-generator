import { tokenize } from './tokenize.js'

const optionalTypeRegex = /option<([^>]*)>/im
const stringAssertionRegex = /\sstring::is::([^)]*)\(/im

const getZodTypeFromQLType = (defString: string) => {
	switch (defString.toLowerCase()) {
		case 'string':
			return 'z.string()'
		case 'datetime':
			return 'z.string().datetime()'
		case 'array':
			return 'z.array(z.unknown())'
		case 'set':
			return 'z.array(z.unknown())'
		case 'number':
			return 'z.number()'
		case 'float':
			return 'z.number()'
		case 'int':
			return 'z.number()'
		case 'decimal':
			return 'z.number()'
		case 'bool':
			return 'z.boolean()'
		case 'object':
			return 'z.record(z.unknown(),z.unknown())'
		case 'record':
			return 'z.any()'
		case 'geometry':
			return 'z.any()'
		default:
			return 'z.any()'
	}
}

const addAssertion = (definition: string) => {
	const match = definition.match(stringAssertionRegex)
	if (!match) {
		return ''
	}

	switch (match[1]?.toLowerCase()) {
		case 'email':
			return '.email()'
		case 'uuid':
			return '.uuid()'
		case 'url':
			return '.url()'
		default:
			return ''
	}
}

const convertStringToEnum = (schema: string, definition: string) => {
	return schema.replace('.string()', `.enum(${definition})`)
}

export const getSchemaStringFromDefinition = (definition: string, isInputSchema: boolean) => {
	let schema = 'z.any()'
	let isOptional = false

	const tokens = tokenize(definition)

	if (!tokens.fieldType) {
		return schema
	}

	let defString = tokens.fieldType
	const optionalDefinition = defString.match(optionalTypeRegex)
	if (optionalDefinition) {
		defString = optionalDefinition[1] as string
		isOptional = true
	}
	schema = getZodTypeFromQLType(defString)

	if (defString.toLowerCase() === 'string' && tokens.inside) {
		schema = convertStringToEnum(schema, tokens.inside)
	}

	if (defString.toLowerCase() === 'string' && tokens.assert) {
		schema += addAssertion(tokens.assert)
	}

	if (isInputSchema && tokens.defaultValue) {
		isOptional = true
	}

	if (!isInputSchema && tokens.defaultValue) {
		isOptional = false
	}

	if (isOptional) {
		schema += '.optional().nullable()'
	}

	return schema
}
