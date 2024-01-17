import { FastifyInstance, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { validationSessionIdExists } from '../middleware/validate-session-id-exists'
import { ZodError, z } from 'zod'
import { randomUUID } from 'node:crypto'
import {
  formatDateToIsoString,
  groupDateAndTime,
} from '../utils/format-date-to-iso-string'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [validationSessionIdExists],
    },
    async (req, replay) => {
      const userId = req.cookies.sessionId
      const meals = await knex('meals').where('user_id', userId).select('*')
      // console.log('userId', userId)
      return replay.send({ meals })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [validationSessionIdExists],
    },
    async (req, replay) => {
      const createSchemaParams = z.object({
        id: z.string().uuid(),
      })

      try {
        const { id } = createSchemaParams.parse(req.params)
        const userId = req.cookies.sessionId
        const meals = await knex('meals')
          .where({
            user_id: userId,
            id,
          })
          .select('*')
          .first()

        return replay.send(meals)
      } catch (error) {
        return replay.status(400).send({ message: 'bad request' })
      }
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [validationSessionIdExists],
    },
    async (req, replay) => {
      const createSchemaParams = z.object({
        id: z.string().uuid(),
      })

      try {
        const { id } = createSchemaParams.parse(req.params)
        const userId = req.cookies.sessionId
        await knex('meals')
          .where({
            user_id: userId,
            id,
          })
          .del()

        return replay.status(204).send()
      } catch (error) {
        return replay.status(400).send({ message: 'bad request' })
      }
    },
  )

  app.post(
    '/',
    {
      preHandler: [validationSessionIdExists],
    },
    async (req: FastifyRequest, replay) => {
      const createSchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        mealDate: z.date(),
        hours: z.string(),
        onDiet: z.coerce.boolean(),
      })

      const body: any = req.body
      body.mealDate = groupDateAndTime(body.date, body.hours)

      try {
        const { name, description, onDiet, mealDate } = createSchema.parse(body)

        const { sessionId } = req.cookies
        const formattedMealDateString = formatDateToIsoString(mealDate)

        await knex('meals').insert({
          id: randomUUID(),
          name,
          description,
          meal_date: formattedMealDateString,
          user_id: sessionId,
          on_diet: onDiet,
        })
      } catch (error: any) {
        let jsonResponse: {
          message: string
          error?: object
        } = {
          message: 'Error to insert meal',
        }

        if (error instanceof ZodError) {
          jsonResponse = {
            ...jsonResponse,
            error: error.formErrors.fieldErrors,
          }
        }

        return replay.status(400).send(jsonResponse)
      }

      return replay.status(201).send()
    },
  )
}
