import { type SchemaType, handleAssertions } from './handleAssertions'
import { type TokenizedDefinition, tokenize } from './tokenize'

const typeRegex = /(?:option<)?(\w+)(?:<(\w+)(?:<(\w+)>)?>)?/i
const recordRegex = /record(?:<(\w+)>)?/i

export type FieldDetail = TokenizedDefinition & { zodString: string; skip: boolean }

const getArrayType = (tokens: TokenizedDefinition, isInputSchema: boolean): string => {
	const match = tokens.type?.match(typeRegex)

	if (match?.[2]) {
		const elementType = match[2].toLowerCase()
		if (elementType === 'record') {
			const recordType = match[3]
			return recordType ? `recordId('${recordType}').array()` : 'recordId().array()'
		}
		const innerType = getZodTypeFromQLType(
			{
				...tokens,
				type: match[2],
			},
			isInputSchema,
		)
		return `z.array(${innerType})`
	}
	return 'z.array(z.unknown())'
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

const makeFlexible = (zodString: string, isFlexible: boolean) => (isFlexible ? `${zodString}.passthrough()` : zodString)

const getSchemaForType = (type: string, tokens: TokenizedDefinition, isInputSchema: boolean, subSchema?: string) => {
	switch (type) {
		case 'string':
			return 'z.string()'
		case 'datetime':
			return 'z.coerce.date()'
		case 'set':
			return 'z.array(z.unknown())'
		case 'array':
			return getArrayType(tokens, isInputSchema)
		case 'number':
		case 'float':
		case 'int':
		case 'decimal':
			return 'z.number()'
		case 'bool':
			return 'z.boolean()'
		case 'object':
			return subSchema ?? 'z.object({})'
		case 'record': {
			const recordMatch = tokens.type?.match(recordRegex)
			const recordType = recordMatch?.[1]
			return recordType ? `recordId('${recordType}')` : 'recordId()'
		}
		default:
			return 'z.unknown()'
	}
}

export const getZodTypeFromQLType = (tokens: TokenizedDefinition, isInputSchema: boolean, subSchema?: string) => {
	const match = tokens.type?.match(typeRegex)

	if (match?.[1]) {
		const type = match[1].toLowerCase() as SchemaType
		let schema = getSchemaForType(type, tokens, isInputSchema, subSchema)

		if (tokens.assert) {
			schema = handleAssertions(schema, tokens.assert, type)
		}

		if (type === 'object') {
			schema = makeFlexible(schema, !!tokens.flexible)
		}
		schema = makeOptional(schema, tokens, isInputSchema)

		return schema
	}
	return 'z.unknown()'
}

export const shouldFieldBeSkipped = (tokens: TokenizedDefinition, isInputSchema: boolean): boolean => {
	return !!tokens.value?.trim().toLowerCase().startsWith('<future>') && isInputSchema
}

export const getDetailsFromDefinition = (definition: string, isInputSchema: boolean): FieldDetail => {
	const tokens = tokenize(definition)

	return {
		...tokens,
		zodString: getZodTypeFromQLType(tokens, isInputSchema),
		skip: shouldFieldBeSkipped(tokens, isInputSchema),
	}
}
