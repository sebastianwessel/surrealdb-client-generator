const FIELD_CLAUSES = ['TYPE', 'REFERENCE', 'DEFAULT', 'READONLY', 'VALUE', 'ASSERT', 'PERMISSIONS', 'COMMENT'] as const

const PATTERNS = {
	CLAUSE_BOUNDARY: `\\s+(?:${FIELD_CLAUSES.join('|')})\\s+|$`,
	CAPTURE_UNTIL_NEXT_CLAUSE: (keyword: string) =>
		new RegExp(`${keyword}\\s+(.*?)(?=${`\\s+(?:${FIELD_CLAUSES.join('|')})\\s+|$`})`, 'im'),
	FOR_CLAUSE: /FOR\s+(select|create|update|delete)\s+([^FOR]*?)(?=\s+FOR\s+|$)/gim,
	DEFINE_FIELD: /DEFINE FIELD(?: IF NOT EXISTS)? (.*?) ON(?: TABLE)? (\w+)/im,
} as const

type PermissionOperation = 'select' | 'create' | 'update' | 'delete'

export type Permissions = {
	none?: boolean
	full?: boolean
} & {
	[K in PermissionOperation]?: string
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

function findNextClause(str: string, startIndex: number): number {
	const matches = FIELD_CLAUSES.map(clause => {
		const index = str.toUpperCase().indexOf(clause, startIndex)
		return index === -1 ? Number.POSITIVE_INFINITY : index
	})

	const nextIndex = Math.min(...matches)
	return nextIndex === Number.POSITIVE_INFINITY ? -1 : nextIndex
}

function parsePermissions(definition: string): [Permissions | undefined, string] {
	const permIndex = definition.toUpperCase().indexOf('PERMISSIONS')
	if (permIndex === -1) {
		return [undefined, definition]
	}

	const nextClauseIndex = findNextClause(definition, permIndex + 'PERMISSIONS'.length)
	const permSection =
		nextClauseIndex === -1 ? definition.slice(permIndex) : definition.slice(permIndex, nextClauseIndex)

	const permissions: Permissions = {}

	const remainingDef =
		definition.slice(0, permIndex) + (nextClauseIndex !== -1 ? definition.slice(nextClauseIndex) : '')

	if (permSection.match(/PERMISSIONS\s+NONE\b/i)) {
		permissions.none = true
		return [permissions, remainingDef.trim()]
	}

	if (permSection.match(/PERMISSIONS\s+FULL\b/i)) {
		permissions.full = true
	}

	const forMatches = Array.from(permSection.matchAll(PATTERNS.FOR_CLAUSE))

	for (const match in forMatches) {
		const [, operation, expression] = match
		if (operation && expression) {
			permissions[operation.toLowerCase() as PermissionOperation] = expression.trim()
		}
	}

	return [Object.keys(permissions).length ? permissions : undefined, remainingDef.trim()]
}

export const tokenize = (originalDefinition: string): TokenizedDefinition => {
	const result: TokenizedDefinition = {
		name: '',
		table: '',
	}

	let definition = originalDefinition

	const [permissions, defWithoutPerms] = parsePermissions(definition)
	if (permissions && Object.keys(permissions).length > 0) {
		result.permissions = permissions
	}
	definition = defWithoutPerms

	const nameMatch = definition.match(PATTERNS.DEFINE_FIELD)
	if (nameMatch) {
		if (typeof nameMatch[1] === 'string') {
			result.name = nameMatch[1].trim()
		}
		if (typeof nameMatch[2] === 'string') {
			result.table = nameMatch[2].trim()
		}
	}

	if (definition.match(/FLEXIBLE TYPE/i)) {
		result.flexible = true
		const flexibleTypePattern = PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('FLEXIBLE TYPE')
		const typeMatch = definition.match(flexibleTypePattern)
		if (typeMatch?.[1]) {
			result.type = typeMatch[1].trim()
		}
	} else {
		const typePattern = PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('TYPE')
		const typeMatch = definition.match(typePattern)
		if (typeMatch?.[1]) {
			result.type = typeMatch[1].trim()
		}
	}

	const defaultMatch = definition.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('DEFAULT'))
	if (defaultMatch?.[1]) {
		result.default = defaultMatch[1].trim()
	}

	if (definition.match(/READONLY/im)) {
		result.readonly = true
	}

	const valueMatch = definition.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('VALUE'))
	if (valueMatch?.[1]) {
		result.value = valueMatch[1].trim()
	}

	const assertMatch = definition.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('ASSERT'))
	if (assertMatch?.[1]) {
		result.assert = assertMatch[1].trim()
	}

	return result
}
