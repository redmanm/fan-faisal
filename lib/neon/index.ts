import { neon, neonConfig } from '@neondatabase/serverless'
import { Agent, fetch as undiciFetch } from 'undici'

// Configure robust SSL connection to Neon preventing Windows CA / proxy leaf verification errors
if (typeof window === 'undefined') {
  try {
    const dispatcher = new Agent({
      connect: {
        rejectUnauthorized: false
      }
    })

    neonConfig.fetchFunction = (url: any, init: any) => {
      return undiciFetch(url, {
        ...init,
        dispatcher
      })
    }
  } catch (e) {
    // fallback to default fetch
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://neondb_owner:npg_sR7xl3qkKFgU@ep-sweet-base-b5gc16h2-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

export const sql = neon(connectionString)
