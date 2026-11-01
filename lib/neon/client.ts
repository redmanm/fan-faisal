/**
 * Neon Database Client SDK for Next.js
 * Provides unified, client-safe query and auth methods communicating with Neon Postgres backend.
 */

export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    role?: 'super_admin' | 'admin' | 'sponsor'
    language?: 'en' | 'ar'
    [key: string]: any
  }
}

class QueryBuilder {
  private table: string
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private payload: any = null
  private conditions: Record<string, any> = {}
  private isSingle = false

  constructor(table: string) {
    this.table = table
  }

  select(_columns = '*') {
    // Chainable select
    return this
  }

  order(_col: string, _opts?: { ascending?: boolean }) {
    return this
  }

  eq(column: string, value: any) {
    this.conditions[column] = value
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  insert(data: any) {
    this.action = 'insert'
    this.payload = data
    return this
  }

  update(data: any) {
    this.action = 'update'
    this.payload = data
    return this
  }

  upsert(data: any, _options?: any) {
    this.action = 'upsert'
    this.payload = data
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      let result: { data: any; error: any } = { data: null, error: null }

      if (this.table === 'worker_profiles') {
        if (this.action === 'select') {
          const res = await fetch('/api/workers', { cache: 'no-store' })
          const json = await res.json()
          result = json
        } else if (this.action === 'insert') {
          const res = await fetch('/api/workers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.payload)
          })
          const json = await res.json()
          result = { data: this.isSingle ? json.data : [json.data], error: json.error }
        } else if (this.action === 'update') {
          const id = this.conditions.id || this.payload.id
          const res = await fetch('/api/workers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...this.payload, id })
          })
          const json = await res.json()
          result = json
        } else if (this.action === 'delete') {
          const id = this.conditions.id
          const res = await fetch(`/api/workers?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
          })
          const json = await res.json()
          result = json
        }
      } else if (this.table === 'country_fee_settings') {
        if (this.action === 'select') {
          const res = await fetch('/api/fees', { cache: 'no-store' })
          const json = await res.json()
          result = json
        } else if (this.action === 'upsert' || this.action === 'insert') {
          const res = await fetch('/api/fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.payload)
          })
          const json = await res.json()
          result = json
        }
      } else if (this.table === 'user_roles') {
        if (this.action === 'select') {
          const res = await fetch('/api/roles', { cache: 'no-store' })
          const json = await res.json()
          result = json
        } else if (this.action === 'upsert' || this.action === 'insert' || this.action === 'update') {
          const res = await fetch('/api/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.payload)
          })
          const json = await res.json()
          result = json
        } else if (this.action === 'delete') {
          const userId = this.conditions.user_id
          const res = await fetch(`/api/roles?user_id=${encodeURIComponent(userId)}`, {
            method: 'DELETE'
          })
          const json = await res.json()
          result = json
        }
      } else if (this.table === 'worker_requests') {
        if (this.action === 'insert') {
          const res = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.payload)
          })
          const json = await res.json()
          result = json
        }
      }

      return onfulfilled ? (onfulfilled(result) as any) : (result as any)
    } catch (err: any) {
      const errRes = { data: null, error: err }
      if (onrejected) return onrejected(err) as any
      return onfulfilled ? (onfulfilled(errRes) as any) : (errRes as any)
    }
  }
}

class NeonClient {
  from(tableName: string) {
    return new QueryBuilder(tableName)
  }

  auth = {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const json = await res.json()
        if (!res.ok || json.error) {
          return { data: { user: null }, error: new Error(json.error || 'Authentication failed') }
        }
        return { data: { user: json.user }, error: null }
      } catch (err: any) {
        return { data: { user: null }, error: err }
      }
    },

    getUser: async (): Promise<{ data: { user: AuthUser | null }; error: any }> => {
      try {
        const res = await fetch('/api/auth', { cache: 'no-store' })
        const json = await res.json()
        return { data: { user: json.user || null }, error: null }
      } catch (err: any) {
        return { data: { user: null }, error: err }
      }
    },

    signOut: async () => {
      try {
        await fetch('/api/auth', { method: 'DELETE' })
        return { error: null }
      } catch (err: any) {
        return { error: err }
      }
    },

    updateUser: async ({ data }: { data: any }) => {
      try {
        const userRes = await fetch('/api/auth', { cache: 'no-store' })
        const current = await userRes.json()
        if (current.user?.email) {
          await fetch('/api/auth', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: current.user.email,
              language: data?.language,
              role: data?.role
            })
          })
        }
        return { data: current.user, error: null }
      } catch (err: any) {
        return { data: null, error: err }
      }
    }
  }

  async rpc(funcName: string, _args?: any) {
    if (funcName === 'current_user_role') {
      try {
        const res = await fetch('/api/auth', { cache: 'no-store' })
        const json = await res.json()
        return { data: json.role || 'sponsor', error: null }
      } catch {
        return { data: 'sponsor', error: null }
      }
    }
    return { data: null, error: null }
  }
}

export const neonClient = new NeonClient()
export const db = neonClient
// Backward-compatibility alias for zero-breakage transition
export const supabase = neonClient
