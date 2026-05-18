export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://asorta.nl').replace(/\/$/, '')
export const SITE_NAME = 'ASORTA'
export const DEFAULT_LOCALE = 'nl_NL'
export const DEFAULT_CURRENCY = 'EUR'
export const DEFAULT_BRAND = 'ASORTA'

export function absoluteUrl(path = '/') {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function cleanText(value: unknown, fallback = '') {
  return String(value || fallback)
    .replace(/\s+/g, ' ')
    .trim()
}

export function clampText(value: unknown, max = 5000) {
  return cleanText(value).slice(0, max)
}

export function validImageUrl(src: unknown) {
  const value = cleanText(src)
  if (!value) return ''
  return absoluteUrl(value)
}
