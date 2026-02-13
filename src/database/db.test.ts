import type { Config } from '../config/types.js'

const connectMock = vi.fn()
const useMock = vi.fn()
const signinMock = vi.fn()
const closeMock = vi.fn()

vi.mock('surrealdb', () => ({
	Surreal: vi.fn().mockImplementation(() => ({
		connect: connectMock,
		use: useMock,
		signin: signinMock,
		close: closeMock,
	})),
}))

describe('connectDb', () => {
	const config: Config = {
		schemaFile: undefined,
		surreal: 'http://localhost:8000',
		db: 'test-db',
		ns: 'test-ns',
		username: 'user',
		password: 'pass',
		outputFolder: 'client_generated',
		generateClient: true,
		surrealImage: 'surrealdb/surrealdb:latest',
	}

	beforeEach(() => {
		vi.clearAllMocks()
		connectMock.mockResolvedValue(undefined)
		useMock.mockResolvedValue(undefined)
		closeMock.mockResolvedValue(undefined)
	})

	it('uses namespace/database signin payload first', async () => {
		signinMock.mockResolvedValue(undefined)

		const { connectDb, closeDb } = await import('./db.js')
		await connectDb(config)
		await closeDb()

		expect(signinMock).toHaveBeenCalledTimes(1)
		expect(signinMock).toHaveBeenCalledWith({
			namespace: 'test-ns',
			database: 'test-db',
			username: 'user',
			password: 'pass',
		})
		expect(useMock).toHaveBeenCalledWith({
			namespace: 'test-ns',
			database: 'test-db',
		})
	})

	it('falls back to username/password signin payload if scoped signin fails', async () => {
		signinMock
			.mockRejectedValueOnce(new Error('scoped signin failed'))
			.mockResolvedValueOnce(undefined)

		const { connectDb, closeDb } = await import('./db.js')
		await connectDb(config)
		await closeDb()

		expect(signinMock).toHaveBeenCalledTimes(2)
		expect(signinMock).toHaveBeenNthCalledWith(1, {
			namespace: 'test-ns',
			database: 'test-db',
			username: 'user',
			password: 'pass',
		})
		expect(signinMock).toHaveBeenNthCalledWith(2, {
			username: 'user',
			password: 'pass',
		})
		expect(useMock).toHaveBeenCalledWith({
			namespace: 'test-ns',
			database: 'test-db',
		})
	})
})
