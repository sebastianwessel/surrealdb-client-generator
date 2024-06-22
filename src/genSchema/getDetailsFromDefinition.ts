import { type TokenizedDefinition, tokenize } from './tokenize.js'

const optionalTypeRegex = /option<([^>]*)>/im
const stringAssertionRegex = /\sstring::is::([^)]*)\(/im
const allInsideAssertionRegex = /ASSERT (?:.*)ALLINSIDE (\[.*\])/im
const insideAssertionRegex = /ASSERT (?:.*)INSIDE (\[.*\])/im

const typeRegex = /(?:option<)?(\w+)(?:<)?(\w+)?/i

export type FieldDetail = TokenizedDefinition & { zodString: string }

const getStringType = (tokens: TokenizedDefinition): string => {
	const result = 'z.string()'
	if (!tokens.assert) {
		return result
	}

	let match = tokens.assert.match(insideAssertionRegex)

	if (match) {
		// TODO: convert to enum
		return 'z.string()'
	}

	match = tokens.assert.match(stringAssertionRegex)
	if (match) {
		switch (match[1]?.toLowerCase()) {
			case 'email':
				return `${result}.email()`
			case 'uuid':
				return `${result}.uuid()`
			case 'url':
				return `${result}.url()`
			case 'datetime':
				return `${result}.datetime()`
			case 'startswith':
				return `${result}.startsWith()`
			case 'endswith':
				return `${result}.endsWith()`
		}
	}

	return result
}

const getArrayType = (tokens: TokenizedDefinition, subSchema?: string): string => {
	const match = tokens.type?.match(typeRegex)

	if (match && match.length > 2) {
		const t = getZodTypeFromQLType(
			{
				...tokens,
				type: match[2],
			},
			false,
		)
		return `z.array(${t})`
	}

	return `z.array(${subSchema ?? 'z.unknown()'})`
}

const makeOptional = (schema: string, tokens: TokenizedDefinition, isInputSchema: boolean) => {
	const typeIsOptional = tokens.type?.toLowerCase().startsWith('option<') ?? false

	if (
		(!isInputSchema && typeIsOptional && !tokens.default) ||
		(isInputSchema && tokens.default) ||
		(typeIsOptional && isInputSchema)
	) {
		return `${schema}.optional()`
	}

	return schema
}

export const getZodTypeFromQLType = (tokens: TokenizedDefinition, isInputSchema: boolean, subSchema?: string) => {
	const match = tokens.type?.match(typeRegex)
	if (match) {
		switch (match[1]?.toLowerCase()) {
			case 'string':
				return makeOptional(getStringType(tokens), tokens, isInputSchema)
			case 'datetime':
				return makeOptional('z.string().datetime()', tokens, isInputSchema)
			case 'array':
				return makeOptional(getArrayType(tokens), tokens, isInputSchema)
			case 'set':
				return makeOptional('z.array(z.unknown())', tokens, isInputSchema)
			case 'number':
				return makeOptional('z.number()', tokens, isInputSchema)
			case 'float':
				return makeOptional('z.number()', tokens, isInputSchema)
			case 'int':
				return makeOptional('z.number()', tokens, isInputSchema)
			case 'decimal':
				return makeOptional('z.number()', tokens, isInputSchema)
			case 'bool':
				return makeOptional('z.boolean()', tokens, isInputSchema)
			case 'object':
				return makeOptional(subSchema ?? 'z.object({})', tokens, isInputSchema)
			case 'record':
				return 'z.any()'
			case 'geometry':
				return 'z.any()'
			default:
				return 'z.any()'
		}
	}
	return 'z.any()'
}

export const getDetailsFromDefinition = (definition: string, isInputSchema: boolean): FieldDetail => {
	const schema = 'z.any()'
	const isOptional = false

	const tokens = tokenize(definition)

	return {
		...tokens,
		zodString: getZodTypeFromQLType(tokens, isInputSchema),
	}
}
