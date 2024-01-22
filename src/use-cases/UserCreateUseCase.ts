import { ICreateUser, IUserRepository } from '../repositories/UsersRepository'

export class UserCreateUseCase {
  constructor(private readonly usersRepository: IUserRepository) {}

  async execute(data: ICreateUser): Promise<void> {
    await this.usersRepository.store(data)
  }
}
