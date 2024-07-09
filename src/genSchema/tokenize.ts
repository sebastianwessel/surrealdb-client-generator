export type Permissions = {
	none?: boolean
	full?: boolean
	select?: string
	create?: string
	update?: string
	delete?: string
}
export interface TokenizedDefinition {
	name: string
	table: string
	flexible?: boolean
	type?: string
	default?: string
	readonly?: boolean
	value?: string
	assert?: string
	permissions?: Permissions
}

export const tokenize = (definition: string): TokenizedDefinition => {
	const result: TokenizedDefinition = {
		name: '',
		table: '',
	}

	const nameMatch = definition.match(/DEFINE FIELD(?: IF NOT EXISTS)? (.*) ON(?: TABLE)? (\w+)/im)
	if (nameMatch) {
		result.name = nameMatch[1] as string
		result.table = nameMatch[2] as string
	} else {
		console.log('==== no match')
		console.error(definition)
	}

	if (definition.match(/FLEXIBLE TYPE/i)) {
		result.flexible = true
		const typeMatch = definition.match(/FLEXIBLE TYPE \b([^\s]+)/im)
		if (typeMatch) {
			result.type = typeMatch[1]
		}
	} else {
		const typeMatch = definition.match(/TYPE \b([^\s]+)/im)
		if (typeMatch) {
			result.type = typeMatch[1]
		}
	}

	const defaultMatch = definition.match(/DEFAULT (\S+)/im)
	if (defaultMatch) {
		// Default makes no sense in base schemas.
		// Get should only return existing values
		// Create with default means optional in schema
		result.default = defaultMatch[1]
	}

	if (definition.match(/READONLY/im)) {
		result.readonly = true
	}

	const valueMatch = definition.match(/VALUE ([^"]+)/im)
	if (valueMatch) {
		result.value = valueMatch[1]
	}

	const assertMatch = definition.match(/ASSERT ([^"]+)/im)
	if (assertMatch) {
		result.assert = assertMatch[1]
	}

	const permissions: Permissions = {}
	if (definition.match(/PERMISSIONS NONE/im)) {
		permissions.none = true
	} else if (definition.match(/PERMISSIONS FULL/im)) {
		permissions.full = true
		const selectMatch = definition.match(/FOR select "([^"]+)"/im)
		if (selectMatch) {
			permissions.select = selectMatch[1]
		}

		const createMatch = definition.match(/FOR create "([^"]+)"/i)
		if (createMatch) {
			permissions.create = createMatch[1]
		}

		const updateMatch = definition.match(/FOR update "([^"]+)"/i)
		if (updateMatch) {
			permissions.update = updateMatch[1]
		}

		const deleteMatch = definition.match(/FOR delete "([^"]+)"/i)
		if (deleteMatch) {
			permissions.delete = deleteMatch[1]
		}
	}

	if (Object.keys(permissions).length > 0) {
		result.permissions = permissions
	}

	return result
}
