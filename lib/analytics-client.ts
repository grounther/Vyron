'use client'

export type GtagItem = {
  item_id?: string
  item_name?: string
  item_category?: string
  item_variant?: string
  price?: number
  quantity?: number
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function hasAnalytics() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!hasAnalytics()) return
  window.gtag?.('event', name, params)
}

export function trackViewItem(item: GtagItem, currency = 'EUR') {
  trackEvent('view_item', {
    currency,
    value: Number(item.price || 0),
    items: [item],
  })
}

export function trackSelectItem(item: GtagItem, listName = 'product_grid') {
  trackEvent('select_item', {
    item_list_name: listName,
    items: [item],
  })
}

export function trackAddToCart(item: GtagItem, currency = 'EUR') {
  const quantity = Number(item.quantity || 1)
  trackEvent('add_to_cart', {
    currency,
    value: Number(item.price || 0) * quantity,
    items: [{ ...item, quantity }],
  })
}

export function trackBeginCheckout(items: GtagItem[], value: number, currency = 'EUR', coupon?: string) {
  trackEvent('begin_checkout', {
    currency,
    value,
    coupon: coupon || undefined,
    items,
  })
}

export function trackShopifyCheckoutRedirect(items: GtagItem[], value: number, currency = 'EUR', coupon?: string) {
  trackEvent('asorta_shopify_checkout_redirect', {
    currency,
    value,
    coupon: coupon || undefined,
    items,
  })
}
