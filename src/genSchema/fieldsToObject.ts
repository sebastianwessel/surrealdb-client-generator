import type { FieldDetail } from './getDetailsFromDefinition.js'

interface NestedObject {
	[key: string]: NestedObject
}

export const fieldsToObject = (details: FieldDetail[]) => {
	const result: NestedObject = {}

	for (const detail of details) {
		const keys = detail.name.split('.')
		let currentLevel = result

		for (const key of keys) {
			if (!currentLevel[key]) {
				currentLevel[key] = {}
			}
			currentLevel = currentLevel[key] as NestedObject
		}
	}

	return result
}
