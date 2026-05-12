import { createAdminClient } from '@/lib/supabase/admin'
import { supabase } from '@/lib/supabase'

export type SiteContentKey =
  | 'homepage.hero.kicker'
  | 'homepage.hero.text'
  | 'homepage.hero.primaryCta'
  | 'homepage.hero.secondaryCta'
  | 'homepage.categories.kicker'
  | 'homepage.categories.title'
  | 'homepage.featured.kicker'
  | 'homepage.featured.title'
  | 'homepage.catalog.kicker'
  | 'homepage.catalog.title'
  | 'homepage.insiders.kicker'
  | 'homepage.insiders.title'
  | 'homepage.insiders.text'
  | 'homepage.insiders.button'
  | 'site.shipping.message'

export type SiteContentField = {
  key: SiteContentKey
  label: string
  value: string
  type: 'text' | 'textarea'
  group: string
}

export const siteContentDefaults: SiteContentField[] = [
  {
    key: 'homepage.hero.kicker',
    label: 'Hero category line',
    value: 'TACTICAL • AUTOMOTIVE • GAMING • UTILITY',
    type: 'text',
    group: 'Homepage hero',
  },
  {
    key: 'homepage.hero.text',
    label: 'Hero body text',
    value:
      'Premium gear voor modern carry, automotive upgrades, gaming setups, desk organization en smart daily utility — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.',
    type: 'textarea',
    group: 'Homepage hero',
  },
  {
    key: 'homepage.hero.primaryCta',
    label: 'Hero primary button',
    value: 'Explore Collection',
    type: 'text',
    group: 'Homepage hero',
  },
  {
    key: 'homepage.hero.secondaryCta',
    label: 'Hero secondary button',
    value: 'Best Sellers',
    type: 'text',
    group: 'Homepage hero',
  },
  {
    key: 'homepage.categories.kicker',
    label: 'Categories kicker',
    value: 'Browse categories',
    type: 'text',
    group: 'Homepage sections',
  },
  {
    key: 'homepage.categories.title',
    label: 'Categories title',
    value: 'Shop by category',
    type: 'text',
    group: 'Homepage sections',
  },
  {
    key: 'homepage.featured.kicker',
    label: 'Featured kicker',
    value: 'Best sellers',
    type: 'text',
    group: 'Homepage sections',
  },
  {
    key: 'homepage.featured.title',
    label: 'Featured title',
    value: 'Launch products',
    type: 'text',
    group: 'Homepage sections',
  },
  {
    key: 'homepage.catalog.kicker',
    label: 'Catalog kicker',
    value: 'Full Launch Catalog',
    type: 'text',
    group: 'Homepage sections',
  },
  {
    key: 'homepage.catalog.title',
    label: 'Catalog title',
    value: 'Just what you need.',
    type: 'text',
    group: 'Homepage sections',
  },
  {
    key: 'homepage.insiders.kicker',
    label: 'Insiders kicker',
    value: 'ASORTA Insiders',
    type: 'text',
    group: 'Conversion block',
  },
  {
    key: 'homepage.insiders.title',
    label: 'Insiders title',
    value: 'Exclusive drops, early access.',
    type: 'text',
    group: 'Conversion block',
  },
  {
    key: 'homepage.insiders.text',
    label: 'Insiders text',
    value:
      'Later koppelen we dit aan e-mail automation. Nu staat de premium sectie klaar voor conversie.',
    type: 'textarea',
    group: 'Conversion block',
  },
  {
    key: 'homepage.insiders.button',
    label: 'Insiders button',
    value: 'Start shopping',
    type: 'text',
    group: 'Conversion block',
  },
  {
    key: 'site.shipping.message',
    label: 'Shipping message',
    value: 'Estimated delivery: 6–12 business days with tracked shipping.',
    type: 'text',
    group: 'Global snippets',
  },
]

export type SiteContentMap = Record<SiteContentKey, string>

export function defaultSiteContentMap(): SiteContentMap {
  return siteContentDefaults.reduce((acc, field) => {
    acc[field.key] = field.value
    return acc
  }, {} as SiteContentMap)
}

export async function getSiteContent(): Promise<SiteContentMap> {
  const defaults = defaultSiteContentMap()
  const client = createAdminClient() || supabase

  if (!client) return defaults

  const { data, error } = await client
    .from('site_content')
    .select('key,value')
    .in(
      'key',
      siteContentDefaults.map((field) => field.key)
    )

  if (error || !data) return defaults

  for (const row of data) {
    const key = row.key as SiteContentKey
    if (key in defaults && typeof row.value === 'string' && row.value.trim()) {
      defaults[key] = row.value
    }
  }

  return defaults
}

export function groupSiteContentFields(fields = siteContentDefaults) {
  return fields.reduce((groups, field) => {
    if (!groups[field.group]) groups[field.group] = []
    groups[field.group].push(field)
    return groups
  }, {} as Record<string, SiteContentField[]>)
}
