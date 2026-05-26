import { hasShopifyAdminConfig, shopifyAdminRest } from '@/lib/shopify/client'

type ManualDraftOrderItem = {
  product_slug?: string
  product_name?: string
  quantity?: number
  unit_price?: number
  variant_sku?: string
  supplier_sku?: string
}

type ManualDraftOrderShipping = {
  name?: string
  email?: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  postalCode?: string
  province?: string
  country?: string
  countryCode?: string
}

type ManualDraftOrderInput = {
  order: Record<string, any>
  items: ManualDraftOrderItem[]
  shipping: ManualDraftOrderShipping
  discountCode?: string
}

type ShopifyDraftOrderResponse = {
  draft_order?: {
    id?: number | string
    name?: string
    invoice_url?: string
    status?: string
  }
}

function money(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'
}

function splitName(value: unknown) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}

function cleanText(value: unknown, fallback = '') {
  return String(value || fallback).trim()
}

export function canCreateManualShopifyDraftOrder() {
  return hasShopifyAdminConfig()
}

export async function createManualShopifyDraftOrder(input: ManualDraftOrderInput) {
  const shippingTotal = Number(input.order.shipping_total || 0)
  const { firstName, lastName } = splitName(input.shipping.name)
  const orderNumber = cleanText(input.order.order_number)
  const discountCode = cleanText(input.discountCode)

  const lineItems = input.items.map((item) => ({
    title: cleanText(item.product_name, cleanText(item.product_slug, 'Eigen voorraad product')),
    price: money(item.unit_price),
    quantity: Math.max(1, Number(item.quantity || 1)),
    sku: cleanText(item.variant_sku || item.supplier_sku),
    taxable: true,
    requires_shipping: true,
    custom: true,
    properties: [
      { name: 'ASORTA ordernummer', value: orderNumber },
      { name: 'Product slug', value: cleanText(item.product_slug) },
      { name: 'SKU', value: cleanText(item.variant_sku || item.supplier_sku) },
      { name: 'Fulfillment', value: 'Eigen voorraad' },
    ].filter((property) => property.value),
  }))

  const payload = {
    draft_order: {
      email: cleanText(input.shipping.email),
      phone: cleanText(input.shipping.phone) || undefined,
      note: discountCode
        ? `ASORTA eigen voorraad order ${orderNumber}. Kortingscode ingevuld: ${discountCode}.`
        : `ASORTA eigen voorraad order ${orderNumber}.`,
      tags: 'asorta,eigen-voorraad,site-checkout,paypal',
      use_customer_default_address: false,
      line_items: lineItems,
      shipping_line: shippingTotal > 0 ? {
        title: 'Verzending',
        price: money(shippingTotal),
        custom: true,
      } : undefined,
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        name: cleanText(input.shipping.name),
        phone: cleanText(input.shipping.phone),
        address1: cleanText(input.shipping.address1),
        address2: cleanText(input.shipping.address2),
        city: cleanText(input.shipping.city),
        zip: cleanText(input.shipping.postalCode),
        province: cleanText(input.shipping.province),
        country: cleanText(input.shipping.country, 'Netherlands'),
        country_code: cleanText(input.shipping.countryCode, 'NL'),
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        name: cleanText(input.shipping.name),
        phone: cleanText(input.shipping.phone),
        address1: cleanText(input.shipping.address1),
        address2: cleanText(input.shipping.address2),
        city: cleanText(input.shipping.city),
        zip: cleanText(input.shipping.postalCode),
        province: cleanText(input.shipping.province),
        country: cleanText(input.shipping.country, 'Netherlands'),
        country_code: cleanText(input.shipping.countryCode, 'NL'),
      },
      custom_attributes: [
        { key: 'asorta_order_number', value: orderNumber },
        { key: 'asorta_checkout_type', value: 'manual_inventory' },
        { key: 'payment_options', value: 'PayPal via Shopify invoice checkout' },
      ],
    },
  }

  const response = await shopifyAdminRest<ShopifyDraftOrderResponse>('/draft_orders.json', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const draft = response.draft_order
  if (!draft?.invoice_url) {
    throw new Error('Shopify draft order is aangemaakt, maar gaf geen invoice checkout-link terug.')
  }

  return {
    id: draft.id ? String(draft.id) : '',
    name: draft.name || '',
    invoiceUrl: draft.invoice_url,
    status: draft.status || 'open',
  }
}
