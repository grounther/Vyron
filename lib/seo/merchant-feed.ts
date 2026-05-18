import type { Product } from '@/lib/products'
import { absoluteUrl, DEFAULT_BRAND, DEFAULT_CURRENCY, SITE_NAME, cleanText, clampText, validImageUrl } from './config'

function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function productDescription(product: Product) {
  return clampText(product.description || product.short || product.name, 5000)
}

function productId(product: Product) {
  return cleanText(product.shopifyVariantLegacyId || product.shopifyVariantId || product.shopifyProductId || product.slug)
}

function productImage(product: Product) {
  return validImageUrl(product.hero || product.images?.[0] || '/asorta-icon.png')
}

function productCategory(product: Product) {
  const category = cleanText(product.category).toLowerCase()
  if (category.includes('automotive')) return 'Vehicles & Parts > Vehicle Parts & Accessories'
  if (category.includes('desk')) return 'Home & Garden > Lighting'
  if (category.includes('gaming')) return 'Electronics > Electronics Accessories'
  if (category.includes('outdoor')) return 'Sporting Goods > Outdoor Recreation'
  return 'Electronics > Electronics Accessories'
}

function itemXml(product: Product) {
  const id = productId(product)
  const title = cleanText(product.name).slice(0, 150)
  const description = productDescription(product)
  const link = absoluteUrl(`/product/${product.slug}`)
  const image = productImage(product)
  const price = `${Number(product.price || 0).toFixed(2)} ${DEFAULT_CURRENCY}`
  const availability = product.shopifyVariantLegacyId ? 'in_stock' : 'out_of_stock'
  const brand = DEFAULT_BRAND
  const mpn = cleanText(product.variants?.[0]?.sku || id)
  const condition = 'new'
  const googleCategory = productCategory(product)

  return `
    <item>
      <g:id>${xmlEscape(id)}</g:id>
      <g:title>${xmlEscape(title)}</g:title>
      <g:description>${xmlEscape(description)}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(image)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${xmlEscape(price)}</g:price>
      <g:brand>${xmlEscape(brand)}</g:brand>
      <g:condition>${condition}</g:condition>
      <g:mpn>${xmlEscape(mpn)}</g:mpn>
      <g:google_product_category>${xmlEscape(googleCategory)}</g:google_product_category>
      <g:product_type>${xmlEscape(product.category)}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`
}

export function buildMerchantFeed(products: Product[]) {
  const items = products
    .filter((product) => product.price > 0 && product.shopifyVariantLegacyId)
    .map(itemXml)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(SITE_NAME)}</title>
    <link>${xmlEscape(absoluteUrl('/'))}</link>
    <description>${xmlEscape('ASORTA Shopify-synced product feed for Google Merchant Center.')}</description>
    ${items}
  </channel>
</rss>`
}
