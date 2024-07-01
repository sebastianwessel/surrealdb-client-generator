import { type TokenizedDefinition, tokenize } from './tokenize.js'
import { handleAssertions } from './handleAssertions.js'

const typeRegex = /(?:option<)?(\w+)(?:<)?(\w+)?/i

export type FieldDetail = TokenizedDefinition & { zodString: string; skip: boolean }

const getStringType = (tokens: TokenizedDefinition): string => {
	let result = 'z.string()';
	if (tokens.assert) {
		result = handleAssertions(result, tokens.assert, 'string');
	}
	return result;
}

const getArrayType = (tokens: TokenizedDefinition): string => {
	const match = tokens.type?.match(typeRegex)

	if (match && match.length > 2) {
		const elementType = getZodTypeFromQLType(
			{
				...tokens,
				type: match[2],
			},
			false,
		)
		let result = `z.array(${elementType})`;
		if (tokens.assert) {
			result = handleAssertions(result, tokens.assert, 'array');
		}
		return result;
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

export const getZodTypeFromQLType = (tokens: TokenizedDefinition, isInputSchema: boolean, subSchema?: string) => {
	const match = tokens.type?.match(typeRegex)

	if (match) {
		let schema: string;
		switch (match[1]?.toLowerCase()) {
			case 'string':
				schema = getStringType(tokens);
				break;
			case 'datetime':
				schema = 'z.string().datetime()';
				break;
			case 'array':
				schema = getArrayType(tokens);
				break;
			case 'set':
				schema = 'z.array(z.unknown())';
				break;
			case 'number':
			case 'float':
			case 'int':
			case 'decimal':
				schema = 'z.number()';
				if (tokens.assert) {
					schema = handleAssertions(schema, tokens.assert, 'number');
				}
				break;
			case 'bool':
				schema = 'z.boolean()';
				if (tokens.assert) {
					schema = handleAssertions(schema, tokens.assert, 'boolean');
				}
				break;
			case 'object':
				schema = subSchema ?? 'z.object({})';
				break;
			case 'record':
			case 'geometry':
			default:
				schema = 'z.unknown()';
		}
		schema = makeOptional(schema, tokens, isInputSchema);
		if (match[1]?.toLowerCase() === 'object') {
			schema = makeFlexible(schema, !!tokens.flexible);
		}
		return schema;
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