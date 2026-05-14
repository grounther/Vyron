type MolliePaymentResponse = {
  id: string
  status: string
  _links?: { checkout?: { href?: string } }
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function hasMollieConfig() {
  return Boolean(process.env.MOLLIE_API_KEY)
}

export async function createMolliePayment(order: Record<string, any>) {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY ontbreekt.')

  const baseUrl = siteUrl()
  const response = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: {
        currency: order.currency || 'EUR',
        value: Number(order.total || 0).toFixed(2),
      },
      description: `ASORTA order ${order.order_number}`,
      redirectUrl: `${baseUrl}/checkout/success?order=${encodeURIComponent(order.order_number)}`,
      webhookUrl: `${baseUrl}/api/webhooks/payment/mollie`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
    }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as MolliePaymentResponse & { detail?: string; title?: string }
  if (!response.ok) {
    throw new Error(`Mollie payment failed: ${body.detail || body.title || response.status}`)
  }

  return body
}

export async function getMolliePayment(paymentId: string) {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY ontbreekt.')

  const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  })
  const body = (await response.json().catch(() => ({}))) as MolliePaymentResponse & { metadata?: Record<string, string> }
  if (!response.ok) throw new Error(`Mollie get payment failed: HTTP ${response.status}`)
  return body
}
