import { toCamelCase } from './toCamelCase'

export const toUpperCamelCase = (str: string): string => {
	const s = toCamelCase(str)
	return s.slice(0, 1).toUpperCase() + s.slice(1)
}
