import { createAdminClient } from '@/lib/supabase/admin'
import { supabase } from '@/lib/supabase'

export type SiteContentField = {
  key: string
  label: string
  value: string
  type: 'text' | 'textarea'
  group: string
}

export const siteContentDefaults: SiteContentField[] = [
  { key: 'homepage.hero.kicker', label: 'Hero category line', value: 'TACTICAL • AUTOMOTIVE • GAMING • UTILITY', type: 'text', group: 'Homepage hero' },
  { key: 'homepage.hero.text', label: 'Hero body text', value: 'Premium gear voor modern carry, automotive upgrades, gaming setups, desk organization en smart daily utility — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.', type: 'textarea', group: 'Homepage hero' },
  { key: 'homepage.hero.primaryCta', label: 'Hero primary button', value: 'Explore Collection', type: 'text', group: 'Homepage hero' },
  { key: 'homepage.hero.secondaryCta', label: 'Hero secondary button', value: 'Best Sellers', type: 'text', group: 'Homepage hero' },
  { key: 'homepage.categories.kicker', label: 'Categories kicker', value: 'Browse categories', type: 'text', group: 'Homepage sections' },
  { key: 'homepage.categories.title', label: 'Categories title', value: 'Shop by category', type: 'text', group: 'Homepage sections' },
  { key: 'homepage.featured.kicker', label: 'Featured kicker', value: 'Best sellers', type: 'text', group: 'Homepage sections' },
  { key: 'homepage.featured.title', label: 'Featured title', value: 'Launch products', type: 'text', group: 'Homepage sections' },
  { key: 'homepage.catalog.kicker', label: 'Catalog kicker', value: 'Full Launch Catalog', type: 'text', group: 'Homepage sections' },
  { key: 'homepage.catalog.title', label: 'Catalog title', value: 'Just what you need.', type: 'text', group: 'Homepage sections' },
  { key: 'homepage.insiders.kicker', label: 'Insiders kicker', value: 'ASORTA Insiders', type: 'text', group: 'Conversion block' },
  { key: 'homepage.insiders.title', label: 'Insiders title', value: 'Exclusive drops, early access.', type: 'text', group: 'Conversion block' },
  { key: 'homepage.insiders.text', label: 'Insiders text', value: 'Later koppelen we dit aan e-mail automation. Nu staat de premium sectie klaar voor conversie.', type: 'textarea', group: 'Conversion block' },
  { key: 'homepage.insiders.button', label: 'Insiders button', value: 'Start shopping', type: 'text', group: 'Conversion block' },
  { key: 'shop.kicker', label: 'Shop kicker', value: 'ASORTA Catalog', type: 'text', group: 'Shop page' },
  { key: 'shop.title', label: 'Shop title', value: 'Just what you need.', type: 'text', group: 'Shop page' },
  { key: 'shop.text', label: 'Shop body text', value: 'Een curated launch catalog met premium utility producten. Zoek, filter en vind snel wat past bij jouw setup, auto, carry of daily routine.', type: 'textarea', group: 'Shop page' },
  { key: 'contact.title', label: 'Contact title', value: 'Contact', type: 'text', group: 'Contact page' },
  { key: 'contact.text', label: 'Contact intro', value: 'Supportformulier koppelen we later aan Supabase of e-mail automation.', type: 'textarea', group: 'Contact page' },
  { key: 'contact.button', label: 'Contact button', value: 'Send soon', type: 'text', group: 'Contact page' },
  { key: 'faq.title', label: 'FAQ title', value: 'FAQ', type: 'text', group: 'FAQ page' },
  { key: 'faq.items', label: 'FAQ items: vraag | antwoord per regel', value: 'Wat is ASORTA? | Een premium modern utility brand met tactical, automotive, gaming, desk setup en smart utility producten.\nWanneer kan ik betalen? | De betaalfase komt hierna. We koppelen Mollie voor iDEAL, Wero, PayPal, kaarten, Apple Pay en Google Pay.\nZijn de producten voorraad of dropship? | ASORTA start supplier-based, maar met streng supplier filter. Later kunnen we private label en voorraad toevoegen.', type: 'textarea', group: 'FAQ page' },
  { key: 'shipping.title', label: 'Shipping title', value: 'Shipping', type: 'text', group: 'Shipping page' },
  { key: 'shipping.body', label: 'Shipping body', value: 'ASORTA werkt met geselecteerde suppliers met tracking en betrouwbare fulfillment.\n\nVerzendtijden worden per product duidelijk vermeld zodra de betaalfase en supplier-koppeling actief zijn.\n\nLaunch target: NL/EU snelle levering waar mogelijk, internationale opties later.', type: 'textarea', group: 'Shipping page' },
  { key: 'returns.title', label: 'Returns title', value: 'Returns', type: 'text', group: 'Returns page' },
  { key: 'returns.body', label: 'Returns body', value: 'Ons doel is lage refund-kans door eerlijke productpagina’s, duidelijke specs en kwalitatieve leveranciers.\n\nRetourvoorwaarden worden definitief gemaakt vóór livegang, afgestemd op NL/EU consumentenrecht.', type: 'textarea', group: 'Returns page' },
  { key: 'privacy.title', label: 'Privacy title', value: 'Privacy Policy', type: 'text', group: 'Privacy page' },
  { key: 'privacy.body', label: 'Privacy body', value: 'Conceptpagina. Voor livegang vullen we deze juridisch correct aan met cookies, analytics, betaalverwerking en klantgegevens.', type: 'textarea', group: 'Privacy page' },
  { key: 'terms.title', label: 'Terms title', value: 'Terms', type: 'text', group: 'Terms page' },
  { key: 'terms.body', label: 'Terms body', value: 'Conceptpagina. Voor livegang maken we algemene voorwaarden passend voor NL/EU ecommerce.', type: 'textarea', group: 'Terms page' },
  { key: 'site.shipping.message', label: 'Global shipping message', value: 'Estimated delivery: 6–12 business days with tracked shipping.', type: 'text', group: 'Global snippets' },
]

export type SiteContentMap = Record<string, string>

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
    .in('key', siteContentDefaults.map((field) => field.key))

  if (error || !data) return defaults

  for (const row of data) {
    if (typeof row.key === 'string' && row.key in defaults && typeof row.value === 'string' && row.value.trim()) {
      defaults[row.key] = row.value
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

export function splitParagraphs(value: string) {
  return value.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
}

export function parseFaqItems(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...answer] = line.split('|')
      return { question: question.trim(), answer: answer.join('|').trim() }
    })
    .filter((item) => item.question && item.answer)
}
