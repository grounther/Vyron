import { createAdminClient } from '@/lib/supabase/admin'

type ProductRow = Record<string, any>
type OrderItemRow = Record<string, any>
type OrderRow = Record<string, any> & { order_items?: OrderItemRow[] }

export type AtlasOrderLine = {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  unitCost: number
  revenue: number
  cost: number
  profit: number
  margin: number
  sku: string
  supplier: string
  shopifyVariantId: string
}

export type AtlasOrderOverview = {
  id: string
  orderNumber: string
  shopifyOrderName: string
  customerEmail: string
  paymentStatus: string
  fulfillmentStatus: string
  total: number
  subtotal: number
  shippingTotal: number
  vatTotal: number
  itemRevenue: number
  estimatedCost: number
  estimatedProfit: number
  margin: number
  trackingNumber: string
  trackingUrl: string
  shopifyOrderStatusUrl: string
  createdAt: string
  itemsSummary: string
  lines: AtlasOrderLine[]
}

export type AtlasStatusBreakdown = {
  label: string
  count: number
  revenue: number
}

export type AtlasProductHealth = {
  activeShopifyProducts: number
  missingCost: number
  missingVariantId: number
  averageCatalogMargin: number
}

export type AtlasMetrics = {
  productHealth: AtlasProductHealth
  orders: AtlasOrderOverview[]
  recentPaidOrders: AtlasOrderOverview[]
  topProfitOrders: AtlasOrderOverview[]
  totals: {
    paidRevenue: number
    itemRevenue: number
    estimatedCost: number
    estimatedProfit: number
    averageMargin: number
    paidOrders: number
    allOrders: number
    pendingOrders: number
    fulfilledOrders: number
  }
  paymentBreakdown: AtlasStatusBreakdown[]
  fulfillmentBreakdown: AtlasStatusBreakdown[]
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function legacyId(value: unknown) {
  const raw = text(value)
  if (!raw) return ''
  const match = raw.match(/(\d+)(?:\?.*)?$/)
  return match?.[1] || raw
}

function isPaidStatus(status: unknown) {
  const value = text(status).toLowerCase()
  return ['paid', 'authorized', 'partially_paid'].includes(value)
}

function normalizeStatus(status: unknown, fallback = 'unknown') {
  return text(status, fallback).toLowerCase().replace(/_/g, ' ')
}

function margin(profit: number, revenue: number) {
  return revenue > 0 ? Math.round((profit / revenue) * 100) : 0
}

function buildProductMaps(products: ProductRow[]) {
  const byVariant = new Map<string, ProductRow>()
  const byProduct = new Map<string, ProductRow>()
  const bySlug = new Map<string, ProductRow>()
  const byName = new Map<string, ProductRow>()

  for (const product of products) {
    const keys = [
      product.shopify_variant_legacy_id,
      product.shopify_variant_id,
      legacyId(product.shopify_variant_id),
    ].map((value) => text(value)).filter(Boolean)
    for (const key of keys) byVariant.set(key, product)

    const productKeys = [
      product.shopify_product_legacy_id,
      product.shopify_product_id,
      legacyId(product.shopify_product_id),
    ].map((value) => text(value)).filter(Boolean)
    for (const key of productKeys) byProduct.set(key, product)

    const slug = text(product.slug)
    if (slug) bySlug.set(slug, product)

    const name = text(product.name).toLowerCase()
    if (name) byName.set(name, product)
  }

  return { byVariant, byProduct, bySlug, byName }
}

function findProductForItem(item: OrderItemRow, maps: ReturnType<typeof buildProductMaps>) {
  const variantKey = text(item.shopify_variant_id) || text(item.supplier_variant_id)
  const productKey = text(item.shopify_product_id) || text(item.supplier_product_id)
  const slug = text(item.product_slug)
  const name = text(item.product_name).toLowerCase()

  return (
    maps.byVariant.get(variantKey) ||
    maps.byVariant.get(legacyId(variantKey)) ||
    maps.byProduct.get(productKey) ||
    maps.byProduct.get(legacyId(productKey)) ||
    maps.bySlug.get(slug) ||
    maps.byName.get(name) ||
    null
  )
}

function buildBreakdown(orders: AtlasOrderOverview[], key: 'paymentStatus' | 'fulfillmentStatus') {
  const map = new Map<string, AtlasStatusBreakdown>()
  for (const order of orders) {
    const label = normalizeStatus(order[key])
    const current = map.get(label) || { label, count: 0, revenue: 0 }
    current.count += 1
    current.revenue += order.total
    map.set(label, current)
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

function productHealth(products: ProductRow[]): AtlasProductHealth {
  const active = products.filter((product) => {
    const status = text(product.status).toLowerCase()
    return ['active', 'launch'].includes(status) && Boolean(product.shopify_product_id)
  })

  const margins = active
    .map((product) => {
      const price = number(product.price)
      const cost = number(product.estimated_cost)
      return price > 0 && cost > 0 ? ((price - cost) / price) * 100 : null
    })
    .filter((value): value is number => typeof value === 'number')

  return {
    activeShopifyProducts: active.length,
    missingCost: active.filter((product) => number(product.estimated_cost) <= 0).length,
    missingVariantId: active.filter((product) => !text(product.shopify_variant_legacy_id)).length,
    averageCatalogMargin: margins.length ? Math.round(margins.reduce((sum, value) => sum + value, 0) / margins.length) : 0,
  }
}

export async function getAtlasMetrics(): Promise<AtlasMetrics> {
  const admin = createAdminClient()
  const empty: AtlasMetrics = {
    productHealth: { activeShopifyProducts: 0, missingCost: 0, missingVariantId: 0, averageCatalogMargin: 0 },
    orders: [],
    recentPaidOrders: [],
    topProfitOrders: [],
    totals: {
      paidRevenue: 0,
      itemRevenue: 0,
      estimatedCost: 0,
      estimatedProfit: 0,
      averageMargin: 0,
      paidOrders: 0,
      allOrders: 0,
      pendingOrders: 0,
      fulfilledOrders: 0,
    },
    paymentBreakdown: [],
    fulfillmentBreakdown: [],
  }

  if (!admin) return empty

  const [{ data: productData }, { data: orderData }] = await Promise.all([
    admin.from('products').select('*').order('updated_at', { ascending: false }).limit(2000),
    admin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const products = (productData || []) as ProductRow[]
  const maps = buildProductMaps(products)
  const rows = (orderData || []) as OrderRow[]

  const orders: AtlasOrderOverview[] = rows.map((order) => {
    const lineRows = Array.isArray(order.order_items) ? order.order_items : []
    const lines = lineRows.map((item): AtlasOrderLine => {
      const quantity = number(item.quantity, 1)
      const unitPrice = number(item.unit_price)
      const product = findProductForItem(item, maps)
      const estimatedUnitCost = number(item.estimated_unit_cost) > 0
        ? number(item.estimated_unit_cost)
        : number(product?.estimated_cost)
      const revenue = unitPrice * quantity
      const cost = estimatedUnitCost * quantity
      const profit = revenue - cost

      return {
        id: text(item.id, text(item.shopify_line_item_id, `${text(item.product_name, 'item')}-${quantity}`)),
        productName: text(item.product_name, text(product?.name, 'Shopify item')),
        quantity,
        unitPrice,
        unitCost: estimatedUnitCost,
        revenue,
        cost,
        profit,
        margin: margin(profit, revenue),
        sku: text(item.variant_sku, text(item.supplier_sku)),
        supplier: text(item.supplier, 'dsers'),
        shopifyVariantId: text(item.shopify_variant_id, text(item.supplier_variant_id)),
      }
    })

    const itemRevenue = lines.reduce((sum, line) => sum + line.revenue, 0)
    const estimatedCost = number(order.estimated_cost) > 0 ? number(order.estimated_cost) : lines.reduce((sum, line) => sum + line.cost, 0)
    const total = number(order.total, itemRevenue)
    const estimatedProfit = number(order.estimated_profit) !== 0
      ? number(order.estimated_profit)
      : total - estimatedCost
    const paymentStatus = text(order.shopify_financial_status, text(order.payment_status, 'pending'))
    const fulfillmentStatus = text(order.shopify_fulfillment_status, text(order.fulfillment_status, 'pending'))
    const itemsSummary = lines.length
      ? lines.map((line) => `${line.quantity}× ${line.productName}`).join(', ')
      : 'Geen orderregels opgeslagen'

    return {
      id: text(order.id),
      orderNumber: text(order.order_number, text(order.shopify_order_name, 'Order')),
      shopifyOrderName: text(order.shopify_order_name),
      customerEmail: text(order.customer_email, 'guest checkout'),
      paymentStatus,
      fulfillmentStatus,
      total,
      subtotal: number(order.subtotal, itemRevenue),
      shippingTotal: number(order.shipping_total),
      vatTotal: number(order.vat_total),
      itemRevenue,
      estimatedCost,
      estimatedProfit,
      margin: margin(estimatedProfit, total),
      trackingNumber: text(order.tracking_number),
      trackingUrl: text(order.tracking_url),
      shopifyOrderStatusUrl: text(order.shopify_order_status_url),
      createdAt: text(order.created_at),
      itemsSummary,
      lines,
    }
  })

  const paidOrders = orders.filter((order) => isPaidStatus(order.paymentStatus))
  const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0)
  const itemRevenue = paidOrders.reduce((sum, order) => sum + order.itemRevenue, 0)
  const estimatedCost = paidOrders.reduce((sum, order) => sum + order.estimatedCost, 0)
  const estimatedProfit = paidRevenue - estimatedCost

  return {
    productHealth: productHealth(products),
    orders,
    recentPaidOrders: paidOrders.slice(0, 8),
    topProfitOrders: [...paidOrders].sort((a, b) => b.estimatedProfit - a.estimatedProfit).slice(0, 8),
    totals: {
      paidRevenue,
      itemRevenue,
      estimatedCost,
      estimatedProfit,
      averageMargin: margin(estimatedProfit, paidRevenue),
      paidOrders: paidOrders.length,
      allOrders: orders.length,
      pendingOrders: orders.filter((order) => normalizeStatus(order.paymentStatus) === 'pending').length,
      fulfilledOrders: orders.filter((order) => ['fulfilled', 'partially fulfilled'].includes(normalizeStatus(order.fulfillmentStatus))).length,
    },
    paymentBreakdown: buildBreakdown(orders, 'paymentStatus'),
    fulfillmentBreakdown: buildBreakdown(orders, 'fulfillmentStatus'),
  }
}
