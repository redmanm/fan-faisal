import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    const rows = await sql`
      SELECT user_id, role
      FROM user_roles
      ORDER BY created_at DESC
    `
    return NextResponse.json({ data: rows, error: null })
  } catch (error: any) {
    console.error('Neon GET user_roles error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, role } = body

    if (!user_id || !role) {
      return NextResponse.json({ data: null, error: 'User ID and Role are required' }, { status: 400 })
    }

    await sql`
      INSERT INTO user_roles (user_id, role, updated_at)
      VALUES (${user_id}, ${role}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW()
    `

    // Also sync to app_users if user exists
    await sql`
      UPDATE app_users SET
        role = ${role},
        updated_at = NOW()
      WHERE email = ${user_id}
    `

    return NextResponse.json({ data: { user_id, role }, error: null })
  } catch (error: any) {
    console.error('Neon POST user_roles error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ data: null, error: 'User ID is required' }, { status: 400 })
    }

    await sql`DELETE FROM user_roles WHERE user_id = ${userId}`
    return NextResponse.json({ data: { user_id: userId }, error: null })
  } catch (error: any) {
    console.error('Neon DELETE user_roles error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}
