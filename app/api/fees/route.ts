import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    const rows = await sql`
      SELECT country, fee_sar
      FROM country_fee_settings
      ORDER BY country
    `
    // Ensure fee_sar is parsed as number
    const data = rows.map((r: any) => ({
      country: r.country,
      fee_sar: Number(r.fee_sar)
    }))
    return NextResponse.json({ data, error: null })
  } catch (error: any) {
    console.error('Neon GET country_fee_settings error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items = Array.isArray(body) ? body : [body]

    for (const item of items) {
      if (!item.country) continue
      const fee = Number(item.fee_sar) || 0
      await sql`
        INSERT INTO country_fee_settings (country, fee_sar, updated_at)
        VALUES (${item.country}, ${fee}, NOW())
        ON CONFLICT (country) DO UPDATE SET
          fee_sar = EXCLUDED.fee_sar,
          updated_at = NOW()
      `
    }

    return NextResponse.json({ data: items, error: null })
  } catch (error: any) {
    console.error('Neon POST country_fee_settings error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database error' }, { status: 500 })
  }
}
