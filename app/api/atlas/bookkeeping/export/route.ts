import { NextResponse } from 'next/server'
import { requireAtlasAdminApi } from '@/lib/server/atlas-api'
import { bookkeepingFilename, bookkeepingRowsToCsv, bookkeepingRowsToXlsx, loadBookkeepingRows } from '@/lib/bookkeeping'

export const runtime = 'nodejs'

function cleanDate(value: string | null) {
  const raw = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

export async function GET(request: Request) {
  const auth = await requireAtlasAdminApi('orders')
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'xlsx'
  const from = cleanDate(url.searchParams.get('from'))
  const to = cleanDate(url.searchParams.get('to'))
  const { rows } = await loadBookkeepingRows(auth.admin, { from, to, limit: 5000 })
  const filename = bookkeepingFilename(format, { from, to })

  if (format === 'csv') {
    return new NextResponse(bookkeepingRowsToCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  return new NextResponse(bookkeepingRowsToXlsx(rows), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
