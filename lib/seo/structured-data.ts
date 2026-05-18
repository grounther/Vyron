import type { Product } from '@/lib/products'
import { absoluteUrl, DEFAULT_BRAND, DEFAULT_CURRENCY, SITE_NAME, SITE_URL, cleanText, clampText, validImageUrl } from './config'

export function productJsonLd(product: Product) {
  const images = Array.from(new Set([product.hero, ...(product.images || [])].map(validImageUrl).filter(Boolean)))
  const sku = product.variants?.[0]?.sku || product.shopifyVariantLegacyId || product.shopifyProductId || product.slug
  const description = clampText(product.description || product.short || product.name, 4000)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: images.length ? images : [absoluteUrl('/asorta-icon.png')],
    brand: {
      '@type': 'Brand',
      name: DEFAULT_BRAND,
    },
    sku,
    mpn: sku,
    category: product.category,
    url: absoluteUrl(`/product/${product.slug}`),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: DEFAULT_CURRENCY,
      price: Number(product.price || 0).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/asorta-icon.png'),
    sameAs: [],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function stringifyJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
