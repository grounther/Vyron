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
  { key: 'homepage.insiders.text', label: 'Insiders text', value: 'Schrijf je in voor exclusieve drops, early access en tijdelijke ASORTA kortingen. Geen spam — alleen updates die waarde hebben.', type: 'textarea', group: 'Conversion block' },
  { key: 'homepage.insiders.button', label: 'Insiders button', value: 'Join early access', type: 'text', group: 'Conversion block' },
  { key: 'shop.kicker', label: 'Shop kicker', value: 'ASORTA Catalog', type: 'text', group: 'Shop page' },
  { key: 'shop.title', label: 'Shop title', value: 'Just what you need.', type: 'text', group: 'Shop page' },
  { key: 'shop.text', label: 'Shop body text', value: 'Een curated launch catalog met premium utility producten. Zoek, filter en vind snel wat past bij jouw setup, auto, carry of daily routine.', type: 'textarea', group: 'Shop page' },
  { key: 'about.title', label: 'About title', value: 'Over ASORTA', type: 'text', group: 'About page' },
  { key: 'about.body', label: 'About body', value: `ASORTA is een Nederlandse webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear.

Onze collectie wordt samengesteld op bruikbaarheid, duidelijke productinformatie en een veilige checkoutflow. We selecteren producten op praktische waarde, uitstraling en geschiktheid voor dagelijks gebruik.

Na je bestelling ontvang je een orderbevestiging per e-mail. Zodra tracking beschikbaar is, ontvang je automatisch een verzendupdate.`, type: 'textarea', group: 'About page' },
  { key: 'contact.title', label: 'Contact title', value: 'Contact', type: 'text', group: 'Contact page' },
  { key: 'contact.text', label: 'Contact intro', value: 'Heb je een vraag over je bestelling, verzending, retour of productinformatie? Neem contact op met ASORTA Support. Vermeld bij ordervragen altijd je ordernummer en het e-mailadres waarmee je hebt besteld.', type: 'textarea', group: 'Contact page' },
  { key: 'contact.button', label: 'Contact button', value: 'Send message', type: 'text', group: 'Contact page' },
  { key: 'faq.title', label: 'FAQ title', value: 'Veelgestelde vragen', type: 'text', group: 'FAQ page' },
  { key: 'faq.items', label: 'FAQ items: vraag | antwoord per regel', value: `Wat is ASORTA? | ASORTA is een webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear.
Hoe werkt betalen? | Je rekent af via een beveiligde betaalomgeving. Beschikbare betaalmethodes kunnen per moment verschillen.
Hoe volg ik mijn bestelling? | Gebruik de pagina Order volgen met je ordernummer en het e-mailadres waarmee je hebt besteld.
Wanneer ontvang ik tracking? | Tracking is beschikbaar zodra je pakket is aangemeld voor verzending. Je ontvangt dan automatisch een verzendupdate per e-mail.
Kan ik retourneren? | Ja, retouraanvragen worden beoordeeld volgens het retourbeleid. Neem contact op met support met je ordernummer en reden van retour.
Waar kan ik terecht met vragen? | Neem contact op met ASORTA Support. Vermeld bij ordervragen altijd je ordernummer en e-mailadres.`, type: 'textarea', group: 'FAQ page' },
  { key: 'shipping.title', label: 'Shipping title', value: 'Verzending & levering', type: 'text', group: 'Shipping page' },
  { key: 'shipping.body', label: 'Shipping body', value: `Na betaling ontvang je een orderbevestiging per e-mail. Je bestelling wordt daarna voorbereid en aangemeld voor verzending.

De verwachte levertijd kan per product en bestemming verschillen. Zodra tracking beschikbaar is, ontvang je automatisch een verzendbevestiging met trackinginformatie.

Heb je na je bestelling nog geen tracking ontvangen? Gebruik de pagina Order volgen of neem contact op met ASORTA Support met je ordernummer.`, type: 'textarea', group: 'Shipping page' },
  { key: 'returns.title', label: 'Returns title', value: 'Retourbeleid', type: 'text', group: 'Returns page' },
  { key: 'returns.body', label: 'Returns body', value: `Wil je een retour aanvragen? Neem contact op met ASORTA Support met je ordernummer, e-mailadres en reden van retour. We beoordelen je aanvraag en geven daarna de vervolgstappen.

Producten moeten ongebruikt, compleet en waar mogelijk in originele verpakking worden geretourneerd. Beschadigde, gebruikte of onvolledige producten kunnen worden geweigerd of gedeeltelijk vergoed.

Voor defecten of verkeerde leveringen vragen we foto's of video's, zodat we het probleem met de vervoerder of fulfillmentpartner kunnen oplossen.`, type: 'textarea', group: 'Returns page' },
  { key: 'privacy.title', label: 'Privacy title', value: 'Privacybeleid', type: 'text', group: 'Privacy page' },
  { key: 'privacy.body', label: 'Privacy body', value: `ASORTA verwerkt klantgegevens voor bestellingen, klantenservice, analytics, checkout, betaling en verzending. Denk aan naam, e-mailadres, verzendadres, ordergegevens, betaalstatus en supportberichten.

Voor analyse gebruiken we Google Analytics 4. Betaalgegevens worden verwerkt door de betaalprovider en niet als volledige betaalkaartgegevens door ASORTA opgeslagen.

Je kunt contact opnemen met ASORTA Support voor vragen over je gegevens, correctie of verwijdering waar wettelijk mogelijk.`, type: 'textarea', group: 'Privacy page' },
  { key: 'terms.title', label: 'Terms title', value: 'Algemene voorwaarden', type: 'text', group: 'Terms page' },
  { key: 'terms.body', label: 'Terms body', value: `Door een bestelling te plaatsen bij ASORTA ga je akkoord met deze voorwaarden. Productinformatie, prijzen en beschikbaarheid worden zo zorgvuldig mogelijk bijgehouden. Kennelijke fouten kunnen worden gecorrigeerd.

Betaling verloopt via een beveiligde checkout. Na betaling wordt je bestelling verwerkt. Leveringstijden zijn indicatief en kunnen afwijken door leverancier, vervoerder, douane of drukte.

Voor vragen, klachten, retouren of problemen met je bestelling neem je contact op met ASORTA Support. We zoeken altijd naar een redelijke oplossing binnen de geldende consumentenregels.`, type: 'textarea', group: 'Terms page' },
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
