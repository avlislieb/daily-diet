import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../app'
import { execSync } from 'node:child_process'
import request from 'supertest'

describe('Users routes', () => {
  beforeAll(async () => {
    app.ready()
  })

  afterAll(async () => {
    app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to list users', async () => {
    const listUsersResponse = await request(app.server)
      .get('/users')
      .expect(200)

    expect(listUsersResponse.body).toMatchObject({
      statusCode: 200,
    })

    if (listUsersResponse.body.users.length > 0) {
      expect(listUsersResponse.body.users).toBeInstanceOf(Array)
      expect(listUsersResponse.body.users).toEqual([
        expect.objectContaining({
          name: expect.any(String),
          email: expect.any(String),
        }),
      ])
    }
  })

  it('should be able to create a new user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
        email: 'gab@test.com',
      })
      .expect(201)
  })

  it('should be able to create a new user and list user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
        email: 'gab@test.com',
      })
      .expect(201)

    const listUsersResponse = await request(app.server).get('/users')

    expect(listUsersResponse.body.users).toEqual([
      expect.objectContaining({
        name: 'GAB',
        email: 'gab@test.com',
      }),
    ])
  })

  it('should be able to create a new user with session_id', async () => {
    const createUserReponse = await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
        email: 'gab@test.com',
      })
      .expect(201)

    const listUsersResponse = await request(app.server).get('/users')

    expect(listUsersResponse.body.users).toEqual([
      expect.objectContaining({
        name: 'GAB',
        email: 'gab@test.com',
        session_id: expect.anything(),
      }),
    ])
  })

  it('should not be able to create a new user without email', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'GAB',
      })
      .expect(500)
  })

  it('should not be able to create a new user without name', async () => {
    await request(app.server)
      .post('/users')
      .send({
        email: 'GAB@gmail.com',
      })
      .expect(500)
  })
})
