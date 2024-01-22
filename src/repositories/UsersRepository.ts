export interface ICreateUser {
  name: string
  email: string
  sessionId: string
}

export interface IUserRepository {
  store(data: ICreateUser): Promise<void>
}
