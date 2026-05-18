import { createAdminClient } from '@/lib/supabase/admin'
import { supabase } from '@/lib/supabase'

export type SiteContentField = {
  key: string
  label: string
  value: string
  type: 'text' | 'textarea'
  group: string
  page: string
  description?: string
}

function f(field: SiteContentField): SiteContentField {
  return field
}

export const siteContentDefaults: SiteContentField[] = [
  f({ key: 'homepage.hero.kicker', label: 'Hero category line', value: 'TACTICAL • AUTOMOTIVE • GAMING • UTILITY', type: 'text', group: 'Hero', page: 'Homepage' }),
  f({ key: 'homepage.hero.text', label: 'Hero body text', value: 'Premium gear voor modern carry, automotive upgrades, gaming setups, desk organization en smart daily utility — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.', type: 'textarea', group: 'Hero', page: 'Homepage' }),
  f({ key: 'homepage.hero.primaryCta', label: 'Hero primary button', value: 'Explore Collection', type: 'text', group: 'Hero', page: 'Homepage' }),
  f({ key: 'homepage.hero.secondaryCta', label: 'Hero secondary button', value: 'Best Sellers', type: 'text', group: 'Hero', page: 'Homepage' }),
  f({ key: 'homepage.categories.kicker', label: 'Categories kicker', value: 'Browse categories', type: 'text', group: 'Categories section', page: 'Homepage' }),
  f({ key: 'homepage.categories.title', label: 'Categories title', value: 'Shop by category', type: 'text', group: 'Categories section', page: 'Homepage' }),
  f({ key: 'homepage.featured.kicker', label: 'Featured kicker', value: 'Best sellers', type: 'text', group: 'Featured section', page: 'Homepage' }),
  f({ key: 'homepage.featured.title', label: 'Featured title', value: 'Launch products', type: 'text', group: 'Featured section', page: 'Homepage' }),
  f({ key: 'homepage.catalog.kicker', label: 'Catalog kicker', value: 'Full Launch Catalog', type: 'text', group: 'Catalog section', page: 'Homepage' }),
  f({ key: 'homepage.catalog.title', label: 'Catalog title', value: 'Just what you need.', type: 'text', group: 'Catalog section', page: 'Homepage' }),
  f({ key: 'homepage.insiders.kicker', label: 'Insiders kicker', value: 'ASORTA Insiders', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.title', label: 'Insiders title', value: 'Exclusive drops, early access.', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.text', label: 'Insiders text', value: 'Schrijf je in voor exclusieve drops, early access en tijdelijke ASORTA kortingen. Geen spam — alleen updates die waarde hebben.', type: 'textarea', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.button', label: 'Insiders button', value: 'Join early access', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.nameLabel', label: 'Newsletter name label', value: 'Naam', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.namePlaceholder', label: 'Newsletter name placeholder', value: 'Oscar', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.emailLabel', label: 'Newsletter email label', value: 'E-mail', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.emailPlaceholder', label: 'Newsletter email placeholder', value: 'info@asorta.nl', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.successButton', label: 'Newsletter success button', value: 'Aangemeld', type: 'text', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.consent', label: 'Newsletter consent text', value: 'Door je in te schrijven ga je akkoord met ASORTA updates. Uitschrijven kan altijd.', type: 'textarea', group: 'Newsletter block', page: 'Homepage' }),
  f({ key: 'homepage.insiders.chips', label: 'Newsletter chips, one per line', value: 'Early access\nDrop alerts\nLaunch discounts', type: 'textarea', group: 'Newsletter block', page: 'Homepage' }),

  f({ key: 'shop.kicker', label: 'Shop kicker', value: 'ASORTA Catalog', type: 'text', group: 'Hero', page: 'Shop page' }),
  f({ key: 'shop.title', label: 'Shop title', value: 'Just what you need.', type: 'text', group: 'Hero', page: 'Shop page' }),
  f({ key: 'shop.text', label: 'Shop body text', value: 'Een curated launch catalog met premium utility producten. Zoek, filter en vind snel wat past bij jouw setup, auto, carry of daily routine.', type: 'textarea', group: 'Hero', page: 'Shop page' }),

  f({ key: 'category.kicker', label: 'Category kicker', value: 'Collection', type: 'text', group: 'Category template', page: 'Category pages' }),
  f({ key: 'category.empty', label: 'Empty category text', value: 'Nog geen producten in deze categorie.', type: 'text', group: 'Category template', page: 'Category pages' }),

  f({ key: 'about.kicker', label: 'About kicker', value: 'ASORTA', type: 'text', group: 'Hero', page: 'About page' }),
  f({ key: 'about.title', label: 'About title', value: 'Over ASORTA', type: 'text', group: 'Hero', page: 'About page' }),
  f({ key: 'about.body', label: 'About body', value: `ASORTA is een Nederlandse webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear.

Onze collectie wordt samengesteld op bruikbaarheid, duidelijke productinformatie en een veilige checkoutflow. We selecteren producten op praktische waarde, uitstraling en geschiktheid voor dagelijks gebruik.

Na je bestelling ontvang je een orderbevestiging per e-mail. Zodra tracking beschikbaar is, ontvang je automatisch een verzendupdate.`, type: 'textarea', group: 'Hero', page: 'About page' }),
  f({ key: 'about.primaryCta', label: 'Primary CTA', value: 'Bekijk collectie', type: 'text', group: 'Hero', page: 'About page' }),
  f({ key: 'about.secondaryCta', label: 'Secondary CTA', value: 'Contact support', type: 'text', group: 'Hero', page: 'About page' }),
  f({ key: 'about.value1.title', label: 'Value card 1 title', value: 'Curated products', type: 'text', group: 'Value cards', page: 'About page' }),
  f({ key: 'about.value1.text', label: 'Value card 1 text', value: 'We selecteren praktische producten op bruikbaarheid, uitstraling en duidelijke informatie.', type: 'textarea', group: 'Value cards', page: 'About page' }),
  f({ key: 'about.value2.title', label: 'Value card 2 title', value: 'Veilige checkout', type: 'text', group: 'Value cards', page: 'About page' }),
  f({ key: 'about.value2.text', label: 'Value card 2 text', value: 'Bestellen verloopt via een beveiligde betaalomgeving.', type: 'textarea', group: 'Value cards', page: 'About page' }),
  f({ key: 'about.value3.title', label: 'Value card 3 title', value: 'Tracking-first', type: 'text', group: 'Value cards', page: 'About page' }),
  f({ key: 'about.value3.text', label: 'Value card 3 text', value: 'Je ontvangt tracking zodra je pakket is aangemeld voor verzending.', type: 'textarea', group: 'Value cards', page: 'About page' }),
  f({ key: 'about.bottom.title', label: 'Bottom block title', value: 'Waarom transparantie belangrijk is', type: 'text', group: 'Bottom block', page: 'About page' }),
  f({ key: 'about.bottom.text', label: 'Bottom block text', value: 'Duidelijke informatie over bestellen, contact, verzending, retouren en voorwaarden helpt klanten begrijpen wat ze kunnen verwachten. Daarom houden we deze pagina’s zichtbaar, actueel en klantgericht.', type: 'textarea', group: 'Bottom block', page: 'About page' }),

  f({ key: 'contact.title', label: 'Contact title', value: 'Contact', type: 'text', group: 'Contact page', page: 'Contact page' }),
  f({ key: 'contact.text', label: 'Contact intro', value: 'Heb je een vraag over je bestelling, verzending, retour of productinformatie? Neem contact op met ASORTA Support. Vermeld bij ordervragen altijd je ordernummer en het e-mailadres waarmee je hebt besteld.', type: 'textarea', group: 'Contact page', page: 'Contact page' }),
  f({ key: 'contact.button', label: 'Contact button', value: 'Send message', type: 'text', group: 'Contact page', page: 'Contact page' }),
  f({ key: 'contact.kicker', label: 'Contact hero kicker', value: 'ASORTA Customer Care', type: 'text', group: 'Contact page', page: 'Contact page' }),
  f({ key: 'contact.chat.kicker', label: 'Chat block kicker', value: 'Live chat', type: 'text', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.chat.title', label: 'Chat block title', value: 'Ga verder met je gesprek', type: 'text', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.chat.text', label: 'Chat block text', value: 'Heb je al een chat gestart via de supportknop? Dan verschijnt die hier automatisch. Nog geen chat? Start hier direct een support gesprek.', type: 'textarea', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.info.kicker', label: 'Info block kicker', value: 'Contact info', type: 'text', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.info.title', label: 'Info block title', value: 'Liever via e-mail?', type: 'text', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.email.label', label: 'Email card label', value: 'E-mail', type: 'text', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.flow.title', label: 'Support flow title', value: 'Support flow', type: 'text', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.flow.text', label: 'Support flow text', value: 'Berichten uit de live chat worden opgeslagen zodat support je vraag kan opvolgen. Als support offline is, blijft je bericht openstaan.', type: 'textarea', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.response.title', label: 'Response title', value: 'Reactietijd', type: 'text', group: 'Contact support blocks', page: 'Contact page' }),
  f({ key: 'contact.response.text', label: 'Response text', value: 'We reageren zo snel mogelijk. Voor ordervragen: vermeld je ordernummer en het e-mailadres waarmee je hebt besteld.', type: 'textarea', group: 'Contact support blocks', page: 'Contact page' }),

  f({ key: 'faq.title', label: 'FAQ title', value: 'Veelgestelde vragen', type: 'text', group: 'FAQ page', page: 'FAQ page' }),
  f({ key: 'faq.items', label: 'FAQ items: vraag | antwoord per regel', value: `Wat is ASORTA? | ASORTA is een webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear.
Hoe werkt betalen? | Je rekent af via een beveiligde betaalomgeving. Beschikbare betaalmethodes kunnen per moment verschillen.
Hoe volg ik mijn bestelling? | Gebruik de pagina Order volgen met je ordernummer en het e-mailadres waarmee je hebt besteld.
Wanneer ontvang ik tracking? | Tracking is beschikbaar zodra je pakket is aangemeld voor verzending. Je ontvangt dan automatisch een verzendupdate per e-mail.
Kan ik retourneren? | Ja, retouraanvragen worden beoordeeld volgens het retourbeleid. Neem contact op met support met je ordernummer en reden van retour.
Waar kan ik terecht met vragen? | Neem contact op met ASORTA Support. Vermeld bij ordervragen altijd je ordernummer en e-mailadres.`, type: 'textarea', group: 'FAQ page', page: 'FAQ page' }),

  f({ key: 'shipping.title', label: 'Shipping title', value: 'Verzending & levering', type: 'text', group: 'Shipping page', page: 'Shipping page' }),
  f({ key: 'shipping.body', label: 'Shipping body', value: `Na betaling ontvang je een orderbevestiging per e-mail. Je bestelling wordt daarna voorbereid en aangemeld voor verzending.

De verwachte levertijd kan per product en bestemming verschillen. Zodra tracking beschikbaar is, ontvang je automatisch een verzendbevestiging met trackinginformatie.

Heb je na je bestelling nog geen tracking ontvangen? Gebruik de pagina Order volgen of neem contact op met ASORTA Support met je ordernummer.`, type: 'textarea', group: 'Shipping page', page: 'Shipping page' }),
  f({ key: 'returns.title', label: 'Returns title', value: 'Retourbeleid', type: 'text', group: 'Returns page', page: 'Returns page' }),
  f({ key: 'returns.body', label: 'Returns body', value: `Wil je een retour aanvragen? Neem contact op met ASORTA Support met je ordernummer, e-mailadres en reden van retour. We beoordelen je aanvraag en geven daarna de vervolgstappen.

Producten moeten ongebruikt, compleet en waar mogelijk in originele verpakking worden geretourneerd. Beschadigde, gebruikte of onvolledige producten kunnen worden geweigerd of gedeeltelijk vergoed.

Voor defecten of verkeerde leveringen vragen we foto's of video's, zodat we het probleem met de vervoerder of fulfillmentpartner kunnen oplossen.`, type: 'textarea', group: 'Returns page', page: 'Returns page' }),
  f({ key: 'privacy.title', label: 'Privacy title', value: 'Privacybeleid', type: 'text', group: 'Privacy page', page: 'Privacy page' }),
  f({ key: 'privacy.body', label: 'Privacy body', value: `ASORTA verwerkt klantgegevens voor bestellingen, klantenservice, analytics, checkout, betaling en verzending. Denk aan naam, e-mailadres, verzendadres, ordergegevens, betaalstatus en supportberichten.

Voor analyse gebruiken we Google Analytics 4. Betaalgegevens worden verwerkt door de betaalprovider en niet als volledige betaalkaartgegevens door ASORTA opgeslagen.

Je kunt contact opnemen met ASORTA Support voor vragen over je gegevens, correctie of verwijdering waar wettelijk mogelijk.`, type: 'textarea', group: 'Privacy page', page: 'Privacy page' }),
  f({ key: 'terms.title', label: 'Terms title', value: 'Algemene voorwaarden', type: 'text', group: 'Terms page', page: 'Terms page' }),
  f({ key: 'terms.body', label: 'Terms body', value: `Door een bestelling te plaatsen bij ASORTA ga je akkoord met deze voorwaarden. Productinformatie, prijzen en beschikbaarheid worden zo zorgvuldig mogelijk bijgehouden. Kennelijke fouten kunnen worden gecorrigeerd.

Betaling verloopt via een beveiligde checkout. Na betaling wordt je bestelling verwerkt. Leveringstijden zijn indicatief en kunnen afwijken door leverancier, vervoerder, douane of drukte.

Voor vragen, klachten, retouren of problemen met je bestelling neem je contact op met ASORTA Support. We zoeken altijd naar een redelijke oplossing binnen de geldende consumentenregels.`, type: 'textarea', group: 'Terms page', page: 'Terms page' }),

  f({ key: 'track.kicker', label: 'Track order kicker', value: 'Order status', type: 'text', group: 'Hero', page: 'Track order page' }),
  f({ key: 'track.title', label: 'Track order title', value: 'Volg je bestelling', type: 'text', group: 'Hero', page: 'Track order page' }),
  f({ key: 'track.text', label: 'Track order intro', value: 'Bekijk de actuele status van je bestelling. Je hebt alleen je ordernummer en het e-mailadres van de bestelling nodig.', type: 'textarea', group: 'Hero', page: 'Track order page' }),
  f({ key: 'track.step1.title', label: 'Step 1 title', value: '1. Order ontvangen', type: 'text', group: 'Timeline cards', page: 'Track order page' }),
  f({ key: 'track.step1.text', label: 'Step 1 text', value: 'Na betaling ontvang je een bevestiging per e-mail.', type: 'textarea', group: 'Timeline cards', page: 'Track order page' }),
  f({ key: 'track.step2.title', label: 'Step 2 title', value: '2. In behandeling', type: 'text', group: 'Timeline cards', page: 'Track order page' }),
  f({ key: 'track.step2.text', label: 'Step 2 text', value: 'Je bestelling wordt voorbereid en aangemeld voor verzending.', type: 'textarea', group: 'Timeline cards', page: 'Track order page' }),
  f({ key: 'track.step3.title', label: 'Step 3 title', value: '3. Tracking', type: 'text', group: 'Timeline cards', page: 'Track order page' }),
  f({ key: 'track.step3.text', label: 'Step 3 text', value: 'Zodra tracking beschikbaar is, ontvang je automatisch een verzendupdate.', type: 'textarea', group: 'Timeline cards', page: 'Track order page' }),
  f({ key: 'track.help.title', label: 'Help title', value: 'Hulp nodig?', type: 'text', group: 'Help block', page: 'Track order page' }),
  f({ key: 'track.help.text', label: 'Help text', value: 'Kun je je bestelling niet vinden of klopt de status niet? Neem contact op met support en vermeld je ordernummer.', type: 'textarea', group: 'Help block', page: 'Track order page' }),
  f({ key: 'track.help.button', label: 'Help button', value: 'Contact support', type: 'text', group: 'Help block', page: 'Track order page' }),

  f({ key: 'checkout.empty.title', label: 'Empty checkout title', value: 'Je checkout is leeg.', type: 'text', group: 'Empty state', page: 'Checkout page' }),
  f({ key: 'checkout.empty.text', label: 'Empty checkout text', value: 'Voeg eerst een product toe aan je winkelwagen.', type: 'text', group: 'Empty state', page: 'Checkout page' }),
  f({ key: 'checkout.empty.button', label: 'Empty checkout button', value: 'Shop producten', type: 'text', group: 'Empty state', page: 'Checkout page' }),
  f({ key: 'checkout.kicker', label: 'Checkout kicker', value: 'Secure checkout', type: 'text', group: 'Main copy', page: 'Checkout page' }),
  f({ key: 'checkout.title', label: 'Checkout title', value: 'Complete your order.', type: 'text', group: 'Main copy', page: 'Checkout page' }),
  f({ key: 'checkout.intro', label: 'Checkout intro', value: 'Vul je e-mailadres in en ga veilig verder naar de betaalomgeving.', type: 'textarea', group: 'Main copy', page: 'Checkout page' }),
  f({ key: 'checkout.email.label', label: 'Email label', value: 'E-mailadres', type: 'text', group: 'Fields', page: 'Checkout page' }),
  f({ key: 'checkout.email.help', label: 'Email help', value: 'We gebruiken dit voor je orderbevestiging en trackingupdates.', type: 'text', group: 'Fields', page: 'Checkout page' }),
  f({ key: 'checkout.discount.label', label: 'Discount label', value: 'Kortingscode', type: 'text', group: 'Fields', page: 'Checkout page' }),
  f({ key: 'checkout.discount.help', label: 'Discount help', value: 'De korting wordt toegepast in de beveiligde checkout als de code geldig is.', type: 'text', group: 'Fields', page: 'Checkout page' }),
  f({ key: 'checkout.apply', label: 'Apply button', value: 'Apply', type: 'text', group: 'Fields', page: 'Checkout page' }),
  f({ key: 'checkout.trust1', label: 'Trust card 1', value: 'Veilige betaalomgeving', type: 'text', group: 'Trust cards', page: 'Checkout page' }),
  f({ key: 'checkout.trust2', label: 'Trust card 2', value: 'Bevestiging per e-mail', type: 'text', group: 'Trust cards', page: 'Checkout page' }),
  f({ key: 'checkout.trust3', label: 'Trust card 3', value: 'Tracking zodra beschikbaar', type: 'text', group: 'Trust cards', page: 'Checkout page' }),
  f({ key: 'checkout.note', label: 'Checkout note', value: 'Na betaling ontvang je een orderbevestiging. Zodra verzending is aangemeld, ontvang je trackinginformatie.', type: 'textarea', group: 'Main copy', page: 'Checkout page' }),
  f({ key: 'checkout.order.kicker', label: 'Summary kicker', value: 'Order', type: 'text', group: 'Summary', page: 'Checkout page' }),
  f({ key: 'checkout.summary.title', label: 'Summary title', value: 'Summary', type: 'text', group: 'Summary', page: 'Checkout page' }),
  f({ key: 'checkout.pay.button', label: 'Pay button', value: 'Pay securely', type: 'text', group: 'Summary', page: 'Checkout page' }),
  f({ key: 'checkout.afterPayment', label: 'After payment helper', value: 'Na betaling verwerken we je bestelling en ontvang je updates per e-mail.', type: 'textarea', group: 'Summary', page: 'Checkout page' }),

  f({ key: 'checkout.success.kicker', label: 'Success kicker', value: 'Order received', type: 'text', group: 'Success page', page: 'Checkout success page' }),
  f({ key: 'checkout.success.title', label: 'Success title', value: 'Thanks for your order.', type: 'text', group: 'Success page', page: 'Checkout success page' }),
  f({ key: 'checkout.success.text', label: 'Success body without order', value: 'We hebben je bestelling ontvangen. Zodra de betaling bevestigd is, wordt je order verwerkt.', type: 'textarea', group: 'Success page', page: 'Checkout success page' }),
  f({ key: 'checkout.success.textWithOrder', label: 'Success body with order', value: 'We hebben order {order} ontvangen. Zodra de betaling bevestigd is, wordt je order verwerkt.', type: 'textarea', group: 'Success page', page: 'Checkout success page' }),
  f({ key: 'checkout.success.button', label: 'Success button', value: 'Verder shoppen', type: 'text', group: 'Success page', page: 'Checkout success page' }),

  f({ key: 'account.kicker', label: 'Account kicker', value: 'Customer portal', type: 'text', group: 'Account page', page: 'Account page' }),
  f({ key: 'account.title', label: 'Account title', value: 'Your ASORTA account', type: 'text', group: 'Account page', page: 'Account page' }),
  f({ key: 'account.intro', label: 'Account intro', value: 'Ingelogd als {email}. Hier beheer je orders, tracking, wishlist en loyalty.', type: 'textarea', group: 'Account page', page: 'Account page' }),
  f({ key: 'account.orders.title', label: 'Order history title', value: 'Order history', type: 'text', group: 'Account page', page: 'Account page' }),
  f({ key: 'account.orders.empty', label: 'No orders text', value: 'Nog geen orders gekoppeld aan dit account.', type: 'text', group: 'Account page', page: 'Account page' }),
  f({ key: 'account.loyalty.title', label: 'Loyalty block title', value: 'Loyalty foundation', type: 'text', group: 'Account page', page: 'Account page' }),
  f({ key: 'account.loyalty.text', label: 'Loyalty block text', value: 'ASORTA loyalty is voorbereid voor punten, tiers, exclusive drops en member-only korting.', type: 'textarea', group: 'Account page', page: 'Account page' }),
  f({ key: 'account.continue', label: 'Continue shopping button', value: 'Continue shopping', type: 'text', group: 'Account page', page: 'Account page' }),

  f({ key: 'footer.brandText', label: 'Footer brand text', value: 'Practical smart utility, automotive and everyday carry products with a clean shopping experience.', type: 'textarea', group: 'Footer', page: 'Footer' }),
  f({ key: 'footer.shopTitle', label: 'Footer shop heading', value: 'Shop', type: 'text', group: 'Footer', page: 'Footer' }),
  f({ key: 'footer.supportTitle', label: 'Footer support heading', value: 'Support', type: 'text', group: 'Footer', page: 'Footer' }),
  f({ key: 'footer.paymentsTitle', label: 'Footer payments heading', value: 'Payments', type: 'text', group: 'Footer', page: 'Footer' }),
  f({ key: 'footer.payments', label: 'Payment labels, one per line', value: 'PayPal\niDEAL | Wero\nCards\nApple Pay / Google Pay', type: 'textarea', group: 'Footer', page: 'Footer' }),
  f({ key: 'footer.copyright', label: 'Footer copyright', value: '© 2026 ASORTA. Premium utility ecommerce.', type: 'text', group: 'Footer', page: 'Footer' }),
  f({ key: 'footer.trust1.title', label: 'Trust card 1 title', value: 'Secure checkout', type: 'text', group: 'Footer trust cards', page: 'Footer' }),
  f({ key: 'footer.trust1.text', label: 'Trust card 1 text', value: 'Safe and encrypted checkout flow.', type: 'text', group: 'Footer trust cards', page: 'Footer' }),
  f({ key: 'footer.trust2.title', label: 'Trust card 2 title', value: 'Curated products', type: 'text', group: 'Footer trust cards', page: 'Footer' }),
  f({ key: 'footer.trust2.text', label: 'Trust card 2 text', value: 'Selected for practical daily use.', type: 'text', group: 'Footer trust cards', page: 'Footer' }),
  f({ key: 'footer.trust3.title', label: 'Trust card 3 title', value: 'Tracked shipping', type: 'text', group: 'Footer trust cards', page: 'Footer' }),
  f({ key: 'footer.trust3.text', label: 'Trust card 3 text', value: 'Tracking updates when available.', type: 'text', group: 'Footer trust cards', page: 'Footer' }),
  f({ key: 'footer.trust4.title', label: 'Trust card 4 title', value: 'Support', type: 'text', group: 'Footer trust cards', page: 'Footer' }),
  f({ key: 'footer.trust4.text', label: 'Trust card 4 text', value: 'Help with orders and product questions.', type: 'text', group: 'Footer trust cards', page: 'Footer' }),

  f({ key: 'site.shipping.message', label: 'Global shipping message', value: 'Estimated delivery: 6–12 business days with tracked shipping.', type: 'text', group: 'Global snippets', page: 'Global' }),
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
  return fields.reduce((pages, field) => {
    if (!pages[field.page]) pages[field.page] = {}
    if (!pages[field.page][field.group]) pages[field.page][field.group] = []
    pages[field.page][field.group].push(field)
    return pages
  }, {} as Record<string, Record<string, SiteContentField[]>>)
}

export function splitParagraphs(value: string) {
  return String(value || '').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
}

export function splitLines(value: string) {
  return String(value || '').split('\n').map((part) => part.trim()).filter(Boolean)
}

export function parseFaqItems(value: string) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...answer] = line.split('|')
      return { question: question.trim(), answer: answer.join('|').trim() }
    })
    .filter((item) => item.question && item.answer)
}
