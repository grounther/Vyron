import { getAtlasSupportSnapshot, requireAtlasAdminApi, snapshotSignature } from '@/lib/support-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const encoder = new TextEncoder()
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function write(controller: ReadableStreamDefaultController<Uint8Array>, chunk: string) {
  controller.enqueue(encoder.encode(chunk))
}

export async function GET(request: Request) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin } = auth

  const url = new URL(request.url)
  let selectedId = url.searchParams.get('id') || null
  let closed = false

  request.signal.addEventListener('abort', () => {
    closed = true
  })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastSignature = ''
      let lastKeepAlive = Date.now()

      try {
        while (!closed) {
          const snapshot = await getAtlasSupportSnapshot(admin, selectedId)
          if (!selectedId && snapshot.selected?.id) selectedId = snapshot.selected.id

          const signature = snapshotSignature(snapshot)
          if (signature !== lastSignature) {
            write(controller, `data: ${JSON.stringify(snapshot)}\n\n`)
            lastSignature = signature
          }

          if (Date.now() - lastKeepAlive > 15000) {
            write(controller, ': keep-alive\n\n')
            lastKeepAlive = Date.now()
          }

          await sleep(1200)
        }
      } catch (error) {
        console.error('Atlas support stream failed', error)
        try {
          write(controller, `event: stream-error\ndata: ${JSON.stringify({ error: 'Live verbinding verbroken.' })}\n\n`)
        } catch {}
      } finally {
        try {
          controller.close()
        } catch {}
      }
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
