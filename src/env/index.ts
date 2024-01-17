import { config } from 'dotenv'
import { z } from 'zod'

let dataConfig = {}
if (process.env.NODE_ENV === 'test') {
  dataConfig = { path: '.env.test', override: true }
}
config(dataConfig)

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3334),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.log('invalid envoriment variables', _env.error.format())

  throw new Error('invalid envoriment variables')
}

export const env = _env.data
