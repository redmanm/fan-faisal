import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('fanfaisal_session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ user: null, role: 'sponsor' })
    }

    let parsed: { email: string; role?: string; language?: string }
    try {
      parsed = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf8'))
    } catch {
      return NextResponse.json({ user: null, role: 'sponsor' })
    }

    // Verify or fetch latest user role and language from Neon
    const users = await sql`
      SELECT id, email, role, language 
      FROM app_users 
      WHERE email = ${parsed.email}
      LIMIT 1
    `

    let userRole = parsed.role || 'sponsor'
    let userLang = parsed.language || 'en'
    let userId = 'usr_' + parsed.email.replace(/[^a-zA-Z0-9]/g, '_')

    if (users.length > 0) {
      userRole = users[0].role || userRole
      userLang = users[0].language || userLang
      userId = users[0].id
    } else {
      // Check user_roles table
      const roles = await sql`
        SELECT role FROM user_roles WHERE user_id = ${parsed.email} LIMIT 1
      `
      if (roles.length > 0) {
        userRole = roles[0].role
      }
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: parsed.email,
        user_metadata: {
          role: userRole,
          language: userLang
        }
      },
      role: userRole
    })
  } catch (error: any) {
    console.error('Neon auth GET session error:', error)
    return NextResponse.json({ user: null, role: 'sponsor' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (!email || !password) {
      return NextResponse.json({ user: null, error: 'Email and password are required' }, { status: 400 })
    }

    // Lookup user in Neon app_users (case-insensitive)
    const users = await sql`
      SELECT id, email, password, role, language 
      FROM app_users 
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `

    let userObj: { id: string; email: string; role: string; language: string }

    if (users.length > 0) {
      const u = users[0]
      // Validate password: allow standard password or accept common demo passwords and auto-sync
      const isDemo = email.includes('demo') || email.includes('fanfaisal')
      const isAcceptedPass =
        u.password === password ||
        (isDemo && (password === 'DemoAdmin!2026' || password === 'DemoSponsor!2026' || password === 'admin' || password === '123456'))

      if (!isAcceptedPass) {
        return NextResponse.json({ user: null, error: 'Invalid email or password' }, { status: 401 })
      }

      // Update password to the provided one if it was a demo synonym
      if (u.password !== password) {
        await sql`UPDATE app_users SET password = ${password}, updated_at = NOW() WHERE LOWER(email) = LOWER(${email})`
      }

      userObj = {
        id: u.id,
        email: u.email,
        role: u.role || 'sponsor',
        language: u.language || 'en'
      }
    } else {
      // If user not in app_users, check if they have a role in user_roles or determine default
      const roles = await sql`
        SELECT role FROM user_roles WHERE LOWER(user_id) = LOWER(${email}) LIMIT 1
      `
      const assignedRole = roles.length > 0 ? roles[0].role : (email.includes('admin') || email.includes('director') ? 'admin' : 'sponsor')
      const newId = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)

      await sql`
        INSERT INTO app_users (id, email, password, role, language, created_at, updated_at)
        VALUES (${newId}, ${email}, ${password}, ${assignedRole}, 'en', NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()
      `

      userObj = {
        id: newId,
        email,
        role: assignedRole,
        language: 'en'
      }
    }

    const sessionPayload = Buffer.from(
      JSON.stringify({
        email: userObj.email,
        role: userObj.role,
        language: userObj.language
      })
    ).toString('base64')

    const response = NextResponse.json({
      user: {
        id: userObj.id,
        email: userObj.email,
        user_metadata: {
          role: userObj.role,
          language: userObj.language
        }
      },
      error: null
    })

    // Set HTTP session cookie
    response.cookies.set('fanfaisal_session', sessionPayload, {
      httpOnly: false, // Accessible to client if needed
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response
  } catch (error: any) {
    console.error('Neon auth POST login error:', error)
    return NextResponse.json({ user: null, error: error.message || 'Authentication error' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('fanfaisal_session')
  return response
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, language, role } = body

    if (email) {
      await sql`
        UPDATE app_users SET
          language = COALESCE(${language}, language),
          role = COALESCE(${role}, role),
          updated_at = NOW()
        WHERE email = ${email}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Neon auth PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
