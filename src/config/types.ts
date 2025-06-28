import type { z } from 'zod'

import type { configFileSchema } from './configFileSchema'

export type Config = z.output<typeof configFileSchema>
