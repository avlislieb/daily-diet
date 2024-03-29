import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      session_id?: string
      name: string
      email: string
      created_at: string
    }

    meals: {
      id: string
      user_id: string
      name: string
      description: string
      meal_date: string
      on_diet: boolean | number
      created_at: string
      updated_at: string
    }
  }
}
