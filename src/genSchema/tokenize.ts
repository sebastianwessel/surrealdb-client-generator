const FIELD_CLAUSES = ['TYPE', 'REFERENCE', 'DEFAULT', 'READONLY', 'VALUE', 'ASSERT', 'PERMISSIONS', 'COMMENT'] as const

const PATTERNS = {
	CLAUSE_BOUNDARY: `\\s+(?:${FIELD_CLAUSES.join('|')})\\s+|$`,
	CAPTURE_UNTIL_NEXT_CLAUSE: (keyword: string) =>
		new RegExp(`${keyword}\\s+(.*?)(?=${`\\s+(?:${FIELD_CLAUSES.join('|')})\\s+|$`})`, 'im'),
	FOR_CLAUSE: /FOR\s+(select|create|update|delete)\s+([^FOR]*?)(?=\s+FOR\s+|$)/gim,
	DEFINE_FIELD: /DEFINE FIELD(?: IF NOT EXISTS)?\s+(.*?)\s+ON(?: TABLE)?\s+([\w.:`\-\[\]*]+)/im,
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
	reference?: string
	comment?: string
}

function findNextClause(str: string, startIndex: number): number {
	const matches = FIELD_CLAUSES.map(clause => {
		const regex = new RegExp(`\\s+${clause}(\\s+|$)`, 'i')
		const match = regex.exec(str.substring(startIndex))
		return match ? match.index + startIndex : Number.POSITIVE_INFINITY
	})

	const nextIndex = Math.min(...matches)
	return nextIndex === Number.POSITIVE_INFINITY ? -1 : nextIndex
}

function parsePermissions(definition: string): [Permissions | undefined, string] {
	const permKeyword = 'PERMISSIONS'
	const permIndex = definition.toUpperCase().indexOf(` ${permKeyword} `)

	if (permIndex === -1) {
		return [undefined, definition]
	}

	const nextClauseActualIndex = findNextClause(definition, permIndex + ` ${permKeyword} `.length)
	const permSection =
		nextClauseActualIndex === -1 ? definition.slice(permIndex) : definition.slice(permIndex, nextClauseActualIndex)

	const permissions: Permissions = {}
	const remainingDef =
		definition.slice(0, permIndex) + (nextClauseActualIndex !== -1 ? definition.slice(nextClauseActualIndex) : '')

	if (permSection.match(new RegExp(`\\s${permKeyword}\\s+NONE\\b`, 'i'))) {
		permissions.none = true
		return [permissions, remainingDef.trim()]
	}

	if (permSection.match(new RegExp(`\\s${permKeyword}\\s+FULL\\b`, 'i'))) {
		permissions.full = true
	}

	const forMatches = Array.from(permSection.matchAll(PATTERNS.FOR_CLAUSE))
	for (const match of forMatches) {
		const [, operation, expression] = match
		if (operation && expression) {
			permissions[operation.toLowerCase() as PermissionOperation] = expression.trim()
		}
	}
	return [Object.keys(permissions).length ? permissions : undefined, remainingDef.trim()]
}

export const tokenize = (originalDefinition: string): TokenizedDefinition => {
	const result: TokenizedDefinition = { name: '', table: '' }
	let definition = originalDefinition.trim()

	const [permissions, defWithoutPerms] = parsePermissions(definition)
	if (permissions && Object.keys(permissions).length > 0) {
		result.permissions = permissions
	}
	definition = defWithoutPerms

	const nameMatch = definition.match(PATTERNS.DEFINE_FIELD)
	let remainingDefinitionAfterNameAndTable = definition

	if (nameMatch) {
		result.name = nameMatch[1] ? nameMatch[1].trim() : ''
		result.table = nameMatch[2] ? nameMatch[2].trim() : ''
		const defineFieldPartRegex = new RegExp(
			`^DEFINE FIELD(?: IF NOT EXISTS)?\\s+${result.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+ON(?: TABLE)?\\s+${result.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`,
			'i',
		)
		remainingDefinitionAfterNameAndTable = definition.replace(defineFieldPartRegex, '').trim()
	}

	const currentDefinitionSegment = remainingDefinitionAfterNameAndTable

	let typeValue: string | undefined
	const flexibleTypeKeyword = 'FLEXIBLE TYPE'
	const typeKeyword = 'TYPE'

	const flexibleTypeIndex = currentDefinitionSegment.toUpperCase().indexOf(flexibleTypeKeyword)
	const simpleTypeIndex = currentDefinitionSegment.toUpperCase().indexOf(typeKeyword)

	if (flexibleTypeIndex !== -1 && (simpleTypeIndex === -1 || flexibleTypeIndex < simpleTypeIndex)) {
		result.flexible = true
		const typePattern = PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE(flexibleTypeKeyword)
		const typeMatch = currentDefinitionSegment.match(typePattern)
		if (typeMatch?.[1]) {
			typeValue = typeMatch[1].trim()
		}
	} else if (simpleTypeIndex !== -1) {
		const typePattern = PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE(typeKeyword)
		const typeMatch = currentDefinitionSegment.match(typePattern)
		if (typeMatch?.[1]) {
			typeValue = typeMatch[1].trim()
		}
	}

	if (typeValue) {
		if (typeValue.endsWith(';')) {
			typeValue = typeValue.slice(0, -1).trim()
		}
		result.type = typeValue
	}

	const defaultMatch = currentDefinitionSegment.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('DEFAULT'))
	if (defaultMatch?.[1]) {
		const defaultValue = defaultMatch[1].trim().replace(/;$/, '').trim()
		const readonlyInDefaultMatch = defaultValue.toUpperCase().match(/(.*)\s+READONLY$/)
		if (readonlyInDefaultMatch) {
			result.default = readonlyInDefaultMatch[1]?.trim()
			result.readonly = true
		} else {
			result.default = defaultValue
		}
	}

	if (!result.readonly && currentDefinitionSegment.match(/\sREADONLY(\s|$)/i)) {
		result.readonly = true
	}

	const valueMatch = currentDefinitionSegment.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('VALUE'))
	if (valueMatch?.[1]) {
		result.value = valueMatch[1].trim().replace(/;$/, '').trim()
	}

	const assertMatch = currentDefinitionSegment.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('ASSERT'))
	if (assertMatch?.[1]) {
		result.assert = assertMatch[1].trim().replace(/;$/, '').trim()
	}

	const referenceMatch = currentDefinitionSegment.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('REFERENCE'))
	if (referenceMatch?.[1]) {
		result.reference = referenceMatch[1].trim().replace(/;$/, '').trim()
	}

	const commentMatch = currentDefinitionSegment.match(PATTERNS.CAPTURE_UNTIL_NEXT_CLAUSE('COMMENT'))
	if (commentMatch?.[1]) {
		result.comment = commentMatch[1].trim().replace(/;$/, '').trim()
	}

	return result
}
