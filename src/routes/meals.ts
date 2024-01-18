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

        if (!meals)
          return replay.status(404).send({ message: 'Meal not found' })

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
        const whereMeal = {
          user_id: userId,
          id,
        }
        const meal = await knex('meals').where(whereMeal).first()
        if (!meal)
          return replay.status(404).send({ message: 'Meal not found.' })

        await knex('meals').where(whereMeal).del()

        return replay.status(204).send()
      } catch (error) {
        console.log('error', error)
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

  app.put(
    '/:id',
    {
      preHandler: [validationSessionIdExists],
    },
    async (req, replay) => {
      const createSchemaToParams = z.object({
        id: z.string().uuid(),
      })
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
        const { id } = createSchemaToParams.parse(req.params)

        const { sessionId } = req.cookies
        const formattedMealDateString = formatDateToIsoString(mealDate)

        const whereMeal = {
          user_id: sessionId,
          id,
        }
        const meal = await knex('meals').where(whereMeal).first()
        if (!meal) {
          return replay.status(404).send({ message: 'Meal not found.' })
        }

        await knex('meals').where(whereMeal).update({
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

      return replay.status(200).send()
    },
  )

  app.get(
    '/sumary',
    {
      preHandler: [validationSessionIdExists],
    },
    async (req, replay) => {
      const userId = req.cookies.sessionId
      console.log('userId', userId)
      const totalMeals = await knex('meals')
        .where('user_id', userId)
        .orderBy('meal_date', 'desc')

      const totalMealsOnDiet = await knex('meals')
        .where({
          user_id: userId,
          on_diet: 1,
        })
        .count('*', { as: 'total' })
        .first()

      const totalMealsOutsideTheDiet = await knex('meals')
        .where({
          user_id: userId,
          on_diet: 0,
        })
        .count('*', { as: 'total' })
        .first()

      const { bestOnDietSequency } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.on_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequency) {
            acc.bestOnDietSequency = acc.currentSequence
          }

          return acc
        },
        {
          bestOnDietSequency: 0,
          currentSequence: 0,
        },
      )

      return replay.send({
        total_meals: totalMeals.length,
        total_meals_on_diet: totalMealsOnDiet?.total ?? 0,
        total_meals_outside_the_diet: totalMealsOutsideTheDiet?.total ?? 0,
        best_on_diet_sequency: bestOnDietSequency,
      })
    },
  )
}
