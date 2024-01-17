import { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError, z } from 'zod'
import { knex } from '../database'

export async function validationSessionIdExists(
  req: FastifyRequest,
  replay: FastifyReply,
) {
  const requestSchemaSessionId = z.object({
    sessionId: z.string().uuid(),
  })

  try {
    requestSchemaSessionId.parse(req.cookies)

    const user = await knex('users')
      .where('session_id', req.cookies.sessionId)
      .select('id')
      .first()

    if (!user) throw new Error()

    req.cookies.sessionId = user.id
  } catch (error: any) {
    return replay.status(401).send({ statusCode: 401, message: 'unauthorized' })
  }
}
