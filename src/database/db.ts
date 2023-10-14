import { Surreal } from 'surrealdb.node'

import { Config } from '../config/types.js'

let db: Surreal

export const getDb = () => {
  if (db) {
    return db
  }
  throw new Error('Not connected to a database')
}

export const connectDb = async (config: Config) => {
  console.log('connect to database')
  db = new Surreal()
  await db.connect(config.surreal, {
    ns: config.ns,
    db: config.db,
    auth: { user: config.username, pass: config.password },
  })
  await db.use({
    ns: config.ns,
    db: config.db,
  })
}

export const insertDefinitions = async (content: string) => {
  const db = getDb()
  const result = await db.query(content, {})
  console.log('insertDefinitions:', JSON.stringify(result, null, 2))
}

export const closeDb = async () => {
  console.log('database closed')
}
