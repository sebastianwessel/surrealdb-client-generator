import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'

const SUPPORTED_SCHEMA_EXTENSIONS = new Set(['.surql', '.surrealql'])

const toPosix = (value: string) => value.replaceAll('\\', '/')

const globToRegex = (pattern: string): RegExp => {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replaceAll('**', '__DOUBLE_STAR__')
		.replaceAll('*', '[^/]*')
		.replaceAll('__DOUBLE_STAR__', '.*')
	return new RegExp(`^${escaped}$`)
}

const readIgnorePatterns = async (directory: string): Promise<RegExp[]> => {
	const ignoreFilePath = resolve(directory, '.ignore')
	try {
		const ignoreContent = await readFile(ignoreFilePath, 'utf-8')
		return ignoreContent
			.split(/\r?\n/)
			.map(line => line.trim())
			.filter(line => line.length > 0 && !line.startsWith('#'))
			.map(pattern => globToRegex(toPosix(pattern)))
	} catch {
		return []
	}
}

const isIgnored = (relativePath: string, ignoreRules: RegExp[]): boolean => {
	return ignoreRules.some(rule => rule.test(relativePath))
}

const collectSchemaFiles = async (
	baseDirectory: string,
	currentDirectory: string,
	ignoreRules: RegExp[],
): Promise<string[]> => {
	const entries = await readdir(currentDirectory, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const fullPath = resolve(currentDirectory, entry.name)
		const relPath = toPosix(relative(baseDirectory, fullPath))

		if (isIgnored(relPath, ignoreRules)) {
			continue
		}

		if (entry.isDirectory()) {
			files.push(...(await collectSchemaFiles(baseDirectory, fullPath, ignoreRules)))
			continue
		}

		if (!entry.isFile()) {
			continue
		}

		if (SUPPORTED_SCHEMA_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
			files.push(fullPath)
		}
	}

	return files
}

export const readSchemaDefinitions = async (schemaPath: string): Promise<string> => {
	const resolvedPath = resolve(process.cwd(), schemaPath)
	const schemaStats = await stat(resolvedPath)

	if (schemaStats.isFile()) {
		return readFile(resolvedPath, 'utf-8')
	}

	if (!schemaStats.isDirectory()) {
		throw new Error(`Schema path is neither file nor directory: ${resolvedPath}`)
	}

	const ignoreRules = await readIgnorePatterns(resolvedPath)
	const schemaFiles = await collectSchemaFiles(resolvedPath, resolvedPath, ignoreRules)
	const sortedFiles = schemaFiles.sort((a, b) => a.localeCompare(b))

	if (!sortedFiles.length) {
		throw new Error(`No schema files found in directory: ${resolvedPath}`)
	}

	const fileContents = await Promise.all(sortedFiles.map(file => readFile(file, 'utf-8')))
	return fileContents.join('\n\n')
}
