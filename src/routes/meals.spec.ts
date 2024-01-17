import { afterAll, beforeAll, describe, expect, it, beforeEach } from 'vitest'
import { app } from '../app'
import { execSync } from 'node:child_process'
import request from 'supertest'
import TestAgent from 'supertest/lib/agent'

describe('meals routes', () => {
  let agent: TestAgent

  beforeAll(async () => {
    app.ready()
    agent = request.agent(app.server)
  })

  afterAll(async () => {
    app.close()
  })

  beforeEach(async () => {
    await execSync('npm run knex migrate:rollback --all')
    await execSync('npm run knex migrate:latest')
  })

  it('should not be able list meals without cookies', async () => {
    const listMealsResponse = await agent.get('/meals').expect(401)

    console.log('listMealsResponse.body', listMealsResponse.body)

    expect(listMealsResponse.body).toEqual(
      expect.objectContaining({
        statusCode: 401,
        message: 'unauthorized',
      }),
    )
  })

  it('should be able create a new meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
        email: 'gab@test.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-cookie')

    await agent
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'test',
        description: 'stest',
        date: '2023-02-13',
        hours: '11:04',
        onDiet: true,
      })
      .expect(201)
  })

  it('should be able to list meals of user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
        email: 'gab@test.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-cookie')

    const meal = {
      name: 'test',
      description: 'stest',
      date: '2023-02-13',
      hours: '11:04',
      onDiet: 1,
    }
    await agent.post('/meals').set('Cookie', cookies).send(meal).expect(201)

    const listMealsResponse = await agent.get('/meals').set('Cookie', cookies)

    expect(listMealsResponse.body.meals).toMatchObject([
      expect.objectContaining({
        name: 'test',
        description: 'stest',
        on_diet: 1,
      }),
    ])
  })

  it('should be able to show a specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
        email: 'gab@test.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-cookie')

    await agent
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'test',
        description: 'stest',
        date: '2023-02-13',
        hours: '11:04',
        onDiet: 1,
      })
      .expect(201)

    const listMealsResponse = await agent.get('/meals').set('Cookie', cookies)
    const mealId = listMealsResponse.body.meals[0].id

    const getMealResponse = await agent
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealResponse.body).toEqual(
      expect.objectContaining({
        id: mealId,
      }),
    )
  })

  it.only('should be able to delete a specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
        email: 'gab@test.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-cookie')

    await agent
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'test',
        description: 'stest',
        date: '2023-02-13',
        hours: '11:04',
        onDiet: 1,
      })
      .expect(201)

    const listMealsResponse = await agent
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)
    const mealId = listMealsResponse.body.meals[0].id

    await agent.delete(`/meals/${mealId}`).set('Cookie', cookies).expect(204)

    const listMealsAfterDeleteResponse = await agent
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(404)
  })
})
