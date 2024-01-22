import { randomUUID } from 'crypto'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserCreateUseCase } from '../../use-cases/UserCreateUseCase'
import { UserRepository } from '../../repositories/knex/UserRepository'

export async function UserCreateController(
  req: FastifyRequest,
  replay: FastifyReply,
): Promise<FastifyReply> {
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

  try {
    const usersRepository = new UserRepository()

    const userCreateUseCase = new UserCreateUseCase(usersRepository)
    await userCreateUseCase.execute({ name, email, sessionId })
  } catch (error) {
    return replay.status(500).send()
  }

  return replay.status(201).send()
}
