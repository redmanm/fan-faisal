import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        id,
        full_name,
        job_title,
        nationality,
        birth_date,
        age,
        gender,
        religion,
        marital_status,
        children,
        experience_years,
        availability,
        skills,
        portrait_data,
        passport_data,
        passport_number,
        fee_sar
      FROM worker_profiles
      ORDER BY created_at DESC
    `
    return NextResponse.json({ data: rows, error: null })
  } catch (error: any) {
    console.error('Neon GET worker_profiles error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = body.id || 'wp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

    const result = await sql`
      INSERT INTO worker_profiles (
        id,
        full_name,
        job_title,
        nationality,
        birth_date,
        age,
        gender,
        religion,
        marital_status,
        children,
        experience_years,
        availability,
        skills,
        portrait_data,
        passport_data,
        passport_number,
        fee_sar,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${body.full_name || ''},
        ${body.job_title || ''},
        ${body.nationality || ''},
        ${body.birth_date || null},
        ${body.age != null ? Number(body.age) : null},
        ${body.gender || null},
        ${body.religion || null},
        ${body.marital_status || null},
        ${body.children != null ? Number(body.children) : 0},
        ${body.experience_years != null ? Number(body.experience_years) : 0},
        ${body.availability || 'Available'},
        ${Array.isArray(body.skills) ? body.skills : []},
        ${body.portrait_data || null},
        ${body.passport_data || null},
        ${body.passport_number || null},
        ${body.fee_sar != null ? Number(body.fee_sar) : null},
        NOW(),
        NOW()
      )
      RETURNING id
    `
    return NextResponse.json({ data: result[0], error: null })
  } catch (error: any) {
    console.error('Neon POST worker_profiles error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ data: null, error: 'Worker ID is required' }, { status: 400 })
    }

    await sql`
      UPDATE worker_profiles SET
        full_name = COALESCE(${updates.full_name}, full_name),
        job_title = COALESCE(${updates.job_title}, job_title),
        nationality = COALESCE(${updates.nationality}, nationality),
        birth_date = COALESCE(${updates.birth_date}, birth_date),
        age = COALESCE(${updates.age != null ? Number(updates.age) : null}, age),
        gender = COALESCE(${updates.gender}, gender),
        religion = COALESCE(${updates.religion}, religion),
        marital_status = COALESCE(${updates.marital_status}, marital_status),
        children = COALESCE(${updates.children != null ? Number(updates.children) : null}, children),
        experience_years = COALESCE(${updates.experience_years != null ? Number(updates.experience_years) : null}, experience_years),
        availability = COALESCE(${updates.availability}, availability),
        skills = COALESCE(${Array.isArray(updates.skills) ? updates.skills : null}, skills),
        portrait_data = COALESCE(${updates.portrait_data}, portrait_data),
        passport_data = COALESCE(${updates.passport_data}, passport_data),
        passport_number = COALESCE(${updates.passport_number}, passport_number),
        fee_sar = COALESCE(${updates.fee_sar != null ? Number(updates.fee_sar) : null}, fee_sar),
        updated_at = NOW()
      WHERE id = ${id}
    `
    return NextResponse.json({ data: { id, ...updates }, error: null })
  } catch (error: any) {
    console.error('Neon PUT worker_profiles error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ data: null, error: 'Worker ID is required' }, { status: 400 })
    }

    await sql`DELETE FROM worker_profiles WHERE id = ${id}`
    return NextResponse.json({ data: { id }, error: null })
  } catch (error: any) {
    console.error('Neon DELETE worker_profiles error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}
