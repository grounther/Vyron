export type ShippingCarrier = 'postnl' | 'dhl' | 'ups' | 'other'

export const shippingCarrierLabels: Record<ShippingCarrier, string> = {
  postnl: 'PostNL',
  dhl: 'DHL',
  ups: 'UPS',
  other: 'Anders',
}

export function normalizeShippingCarrier(value: unknown): ShippingCarrier {
  const raw = String(value || '').trim().toLowerCase()
  if (raw.includes('post')) return 'postnl'
  if (raw.includes('dhl')) return 'dhl'
  if (raw.includes('ups')) return 'ups'
  return 'other'
}

export function shippingCarrierLabel(value: unknown) {
  return shippingCarrierLabels[normalizeShippingCarrier(value)]
}

export function cleanTrackingNumber(value: unknown) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120)
}

export function shippingPostalCodeFromOrder(order: Record<string, any>) {
  const shipping = order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address : {}
  const rawShipping = order.raw?.shipping_address && typeof order.raw.shipping_address === 'object' ? order.raw.shipping_address : {}
  return String(shipping.postalCode || shipping.postal_code || shipping.zip || rawShipping.postalCode || rawShipping.postal_code || rawShipping.zip || '').trim().replace(/\s+/g, '')
}

export function buildTrackingUrl(input: { carrier?: unknown; trackingNumber?: unknown; order?: Record<string, any> | null }) {
  const trackingNumber = cleanTrackingNumber(input.trackingNumber)
  if (!trackingNumber) return ''

  const carrier = normalizeShippingCarrier(input.carrier)
  if (carrier === 'postnl') {
    const postalCode = input.order ? shippingPostalCodeFromOrder(input.order) : ''
    return postalCode
      ? `https://jouw.postnl.nl/track-and-trace/${encodeURIComponent(trackingNumber)}-NL-${encodeURIComponent(postalCode)}`
      : `https://jouw.postnl.nl/track-en-trace`
  }
  if (carrier === 'dhl') return `https://www.dhl.com/nl-nl/home/tracking.html?tracking-id=${encodeURIComponent(trackingNumber)}`
  if (carrier === 'ups') return `https://www.ups.com/track?loc=nl_NL&tracknum=${encodeURIComponent(trackingNumber)}`
  return ''
}

export function carrierPortalUrl(value: unknown) {
  const carrier = normalizeShippingCarrier(value)
  if (carrier === 'postnl') return 'https://jouw.postnl.nl/'
  if (carrier === 'dhl') return 'https://my.dhlparcel.nl/'
  if (carrier === 'ups') return 'https://www.ups.com/ship'
  return ''
}

export function customerTrackingEmailBody(input: { orderNumber: string; carrier?: unknown; trackingNumber?: string | null; trackingUrl?: string | null }) {
  const carrier = shippingCarrierLabel(input.carrier)
  const lines = [
    'Goed nieuws: je ASORTA bestelling is aangemeld voor verzending.',
    '',
    `Order: ${input.orderNumber}`,
    `Vervoerder: ${carrier}`,
    input.trackingNumber ? `Track & trace: ${input.trackingNumber}` : '',
    input.trackingUrl ? `Trackinglink: ${input.trackingUrl}` : '',
    '',
    'De tracking kan soms pas na enkele uren actief worden zodra de vervoerder het pakket heeft gescand.',
  ].filter(Boolean)
  return lines.join('\n')
}
