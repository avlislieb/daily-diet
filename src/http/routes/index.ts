import { FastifyInstance } from 'fastify'
import { UserCreateController } from '../controllers/UserCreateController'
import { usersRoutes } from '../../routes/users'
import { mealsRoutes } from '../../routes/meals'

export async function appRoutes(app: FastifyInstance) {
  app.register(usersRoutes, {
    prefix: 'users',
  })
  app.register(mealsRoutes, {
    prefix: 'meals',
  })

  app.post('/usuario', UserCreateController)
}
