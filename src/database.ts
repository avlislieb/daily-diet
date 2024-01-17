import 'dotenv/config'
import { Knex, knex as setupKnex } from 'knex'
import { env } from './env'

const client = 'sqlite'

export const config: Knex.Config = {
  client,
  connection:
    client === 'sqlite'
      ? {
          filename: env.DATABASE_URL,
        }
      : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const knex = setupKnex(config)
