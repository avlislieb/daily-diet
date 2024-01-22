import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { appRoutes } from './http/routes'

export const app = fastify()

app.register(cookie)
app.register(appRoutes)
