import type { z } from 'zod'

import type { configFileSchema } from './configFileSchema.js'

export type Config = z.output<typeof configFileSchema>
