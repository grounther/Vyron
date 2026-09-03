import { NextRequest, NextResponse } from 'next/server'

type PdokDocument = {
  id?: string
  weergavenaam?: string
  woonplaatsnaam?: string
  gemeentenaam?: string
  provincienaam?: string
}

export async function GET(request: NextRequest) {
  const query = String(request.nextUrl.searchParams.get('q') || '').trim().slice(0, 80)
  if (query.length < 2) return NextResponse.json({ suggestions: [] })

  const endpoint = new URL('https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest')
  endpoint.searchParams.set('q', query)
  endpoint.searchParams.set('fq', 'type:woonplaats')
  endpoint.searchParams.set('rows', '8')
  endpoint.searchParams.set('fl', 'id,weergavenaam,woonplaatsnaam,gemeentenaam,provincienaam,type')

  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } })
    if (!response.ok) throw new Error(`PDOK gaf status ${response.status}`)
    const payload = await response.json()
    const documents = (payload?.response?.docs || []) as PdokDocument[]
    const seen = new Set<string>()
    const suggestions = documents.flatMap((document) => {
      const name = String(document.woonplaatsnaam || document.weergavenaam?.split(',')[0] || '').trim()
      if (!name || seen.has(name.toLocaleLowerCase('nl-NL'))) return []
      seen.add(name.toLocaleLowerCase('nl-NL'))
      return [{ id: String(document.id || name), name, municipality: document.gemeentenaam || null, province: document.provincienaam || null }]
    })
    return NextResponse.json({ suggestions }, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' } })
  } catch {
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: 200 })
  }
}
