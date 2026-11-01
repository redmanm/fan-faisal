import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { worker_id, sponsor_email } = body

    if (!worker_id || !sponsor_email) {
      return NextResponse.json({ data: null, error: 'worker_id and sponsor_email required' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO worker_requests (worker_id, sponsor_email, status, created_at)
      VALUES (${worker_id}, ${sponsor_email}, 'pending', NOW())
      RETURNING id
    `

    return NextResponse.json({ data: result[0], error: null })
  } catch (error: any) {
    console.error('Neon POST worker_requests error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}
