import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cardScannerKeywords, mapProductToScannerResult, scoreScannerResult } from '@/lib/card-scanner'

export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function escapeOrValue(value: string) {
  return value.replace(/[,%]/g, '').replace(/[^a-zA-Z0-9 _.-]/g, '').trim()
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = String(url.searchParams.get('q') || '').trim()
  const limit = Math.max(1, Math.min(30, Number(url.searchParams.get('limit') || 12)))

  if (q.length < 2) {
    return NextResponse.json({ query: q, results: [], message: 'Typ minimaal 2 tekens of scan tekst op de kaart.' })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ query: q, results: [], error: 'Supabase admin client ontbreekt.' }, { status: 500 })
  }

  const words = cardScannerKeywords(q)
  const safeWords = words.map(escapeOrValue).filter(Boolean).slice(0, 6)

  let query = admin
    .from('products')
    .select('id,name,slug,category,hero_image,images,price,compare_at,market_value,suggested_price,market_source,condition_label,sealed_status,inventory_online,inventory_market,inventory_total,cardmarket_url,tags,status')
    .in('status', ['active', 'launch', 'draft', 'sold_out'])
    .limit(120)

  if (safeWords.length) {
    const orParts = safeWords.flatMap((word) => [
      `name.ilike.%${word}%`,
      `slug.ilike.%${word}%`,
      `category.ilike.%${word}%`,
      `condition_label.ilike.%${word}%`,
      `sealed_status.ilike.%${word}%`,
    ])
    query = query.or(orParts.join(','))
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ query: q, results: [], error: error.message }, { status: 500 })
  }

  const results = ((data || []) as AnyRow[])
    .map(mapProductToScannerResult)
    .map((row) => ({ ...row, score: scoreScannerResult(row, q) }))
    .filter((row) => (row.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit)

  return NextResponse.json({ query: q, results })
}
