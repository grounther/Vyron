import { shopifyAdminRest } from '@/lib/shopify/client'
import type { FulfillmentProvider, SupplierOrderPayload, SupplierOrderResult } from '@/lib/fulfillment/types'

function dsersMode() {
  return process.env.DSERS_MODE || 'pending_bridge'
}

function shouldCreateShopifyBridgeOrder() {
  return process.env.DSERS_CREATE_SHOPIFY_ORDERS === 'true'
}

async function submitViaShopifyOrderBridge(payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
  if (!shouldCreateShopifyBridgeOrder()) {
    return {
      supplier: 'dsers',
      status: 'pending_bridge',
      message: 'DSers Shopify bridge staat klaar, maar DSERS_CREATE_SHOPIFY_ORDERS is niet true. Geen Shopify order aangemaakt.',
      raw: { mode: dsersMode(), orderNumber: payload.orderNumber },
    }
  }

  const address = payload.shippingAddress
  const body = {
    order: {
      email: payload.customerEmail,
      financial_status: 'paid',
      send_receipt: false,
      send_fulfillment_receipt: false,
      note: `Created by Vyron site for DSers fulfillment. Source order: ${payload.orderNumber}`,
      tags: 'vyron-site,dsers-bridge,paid-external-checkout',
      line_items: payload.items.map((item) => ({
        title: item.productName,
        quantity: item.quantity,
        price: item.unitPrice.toFixed(2),
        sku: item.supplierSku || item.platformVariantSku || item.productSlug,
        requires_shipping: true,
        taxable: true,
      })),
      shipping_address: {
        first_name: address.firstName || address.name?.split(' ')[0] || '',
        last_name: address.lastName || address.name?.split(' ').slice(1).join(' ') || '',
        address1: address.address1,
        address2: address.address2 || '',
        phone: address.phone || '',
        city: address.city,
        province: address.province || '',
        country: address.country,
        zip: address.postalCode,
      },
      billing_address: {
        first_name: address.firstName || address.name?.split(' ')[0] || '',
        last_name: address.lastName || address.name?.split(' ').slice(1).join(' ') || '',
        address1: address.address1,
        address2: address.address2 || '',
        phone: address.phone || '',
        city: address.city,
        province: address.province || '',
        country: address.country,
        zip: address.postalCode,
      },
    },
  }

  const response = await shopifyAdminRest<{ order?: { id?: number; name?: string } }>('/orders.json', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return {
    supplier: 'dsers',
    status: 'submitted',
    supplierOrderId: response.order?.name || String(response.order?.id || payload.orderNumber),
    message: `DSers bridge: Shopify order created for DSers processing (${response.order?.name || response.order?.id}).`,
    raw: response,
  }
}

async function submitViaDirectApi(payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
  const baseUrl = process.env.DSERS_API_BASE_URL
  const token = process.env.DSERS_API_KEY || process.env.DSERS_ACCESS_TOKEN

  if (!baseUrl || !token) {
    return {
      supplier: 'dsers',
      status: 'manual_required',
      message: 'DSers direct API is geselecteerd, maar DSERS_API_BASE_URL en DSERS_API_KEY/DSERS_ACCESS_TOKEN ontbreken.',
      raw: { mode: dsersMode(), orderNumber: payload.orderNumber },
    }
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const raw = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      supplier: 'dsers',
      status: 'failed',
      message: `DSers direct API failed: HTTP ${response.status}`,
      raw,
    }
  }

  return {
    supplier: 'dsers',
    status: 'submitted',
    supplierOrderId: String(raw.order_id || raw.id || payload.orderNumber),
    message: 'DSers direct API order submitted.',
    raw,
  }
}

export const dsersFulfillmentProvider: FulfillmentProvider = {
  key: 'dsers',
  async submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
    const mode = dsersMode()
    if (mode === 'direct_api') return submitViaDirectApi(payload)
    if (mode === 'shopify_order_bridge') return submitViaShopifyOrderBridge(payload)

    return {
      supplier: 'dsers',
      status: 'pending_bridge',
      message: 'DSers mapping is saved. Choose DSERS_MODE=shopify_order_bridge or DSERS_MODE=direct_api to activate automation.',
      raw: { mode, orderNumber: payload.orderNumber },
    }
  },
}
