import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async (req, replay) => {
    const users = await knex('users').select('*')

    return replay.send({
      statusCode: 200,
      users,
    })
  })

  app.post('/', async (req, replay) => {
    const createUsersSchema = z.object({
      name: z.string(),
      email: z.string(),
    })

    const { name, email } = createUsersSchema.parse(req.body)

    let sessionId = req.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()

      replay.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7dias
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    replay.status(201).send()
  })
}
