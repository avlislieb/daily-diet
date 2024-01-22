import { randomUUID } from 'crypto'
import { ICreateUser, IUserRepository } from '../UsersRepository'
import { knex } from '../../database'

export class UserRepository implements IUserRepository {
  async store({ name, email, sessionId }: ICreateUser): Promise<void> {
    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })
  }
}
