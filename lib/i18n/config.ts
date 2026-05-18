export const locales = ['nl', 'en'] as const
export type Locale = (typeof locales)[number]

export function isLocale(value: unknown): value is Locale {
  return value === 'nl' || value === 'en'
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : 'nl'
}

export type Dictionary = typeof dictionaries.nl

export const dictionaries = {
  nl: {
    language: 'Taal',
    nav: {
      shop: 'Shop',
      tactical: 'Tactical',
      automotive: 'Automotive',
      desk: 'Desk Setup',
      gaming: 'Gaming',
      smartUtility: 'Smart Utility',
      account: 'Account',
      search: 'Zoeken',
      cart: 'Winkelwagen',
      menu: 'Menu',
    },
    cart: {
      title: 'Winkelwagen',
      emptyTitle: 'Je winkelwagen is leeg.',
      emptyText: 'Selecteer eerst een premium utility product.',
      shopProducts: 'Shop producten',
      subtotal: 'Subtotaal',
      shipping: 'Verzending',
      shippingCalculated: 'Berekend bij checkout',
      total: 'Totaal',
      viewCart: 'Bekijk winkelwagen',
      checkout: 'Afrekenen',
      checkoutNote: 'Veilig afrekenen via onze betaalomgeving.',
      variant: 'Uitvoering',
    },
    shop: {
      searchPlaceholder: 'Zoek ASORTA producten...',
      allCategories: 'Alle categorieën',
      featured: 'Uitgelicht',
      priceLow: 'Prijs laag-hoog',
      priceHigh: 'Prijs hoog-laag',
      margin: 'Margepotentie',
      allPrices: 'Alle prijzen',
      under: 'Onder €',
      productsFound: 'producten gevonden',
      noProductsTitle: 'Geen producten gevonden.',
      noProductsText: 'Probeer een andere categorie, zoekterm of prijsfilter.',
      viewAll: 'Bekijk alles',
    },
    checkout: {
      secure: 'Veilige checkout',
      title: 'Secure checkout',
      intro: 'Controleer je bestelling en ga veilig verder naar betalen. Na betaling ontvang je automatisch een orderbevestiging per e-mail.',
      emptyTitle: 'Je cart is leeg.',
      emptyText: 'Voeg eerst producten toe voordat je afrekent.',
      email: 'E-mail voor checkout',
      emailHelp: 'We gebruiken dit e-mailadres voor je orderbevestiging en verzendupdates.',
      discount: 'Kortingscode',
      apply: 'Toepassen',
      discountHelp: 'De code wordt toegepast tijdens het afrekenen als de actie geldig is.',
      discountRemoved: 'Kortingscode verwijderd.',
      discountApplied: 'wordt toegepast tijdens het afrekenen.',
      bridgeNote: 'Na betaling wordt je bestelling verwerkt en ontvang je automatisch een bevestiging. Tracking volgt zodra je pakket is aangemeld voor verzending.',
      order: 'Bestelling',
      summary: 'Overzicht',
      subtotal: 'Subtotaal',
      discountCode: 'Kortingscode',
      shipping: 'Verzending',
      shippingInShopify: 'Calculated at checkout',
      total: 'Totaal',
      discountCalculated: 'De korting wordt definitief berekend tijdens het afrekenen.',
      pay: 'Betaal met PayPal',
      starting: 'Checkout starten...',
      redirecting: 'Doorsturen naar betalen...',
      shopProducts: 'Shop producten',
      error: 'Checkout kon niet worden gestart.',
      noUrl: 'Checkout is aangemaakt, maar er kwam geen betaal-link terug.',
      afterPayment: 'Je bestelling wordt verwerkt nadat je betaling is afgerond.',
    },
    footer: {
      secureCheckout: 'Veilige checkout',
      secureCheckoutText: 'Je betaling verloopt via een beveiligde checkoutomgeving.',
      curatedGear: 'Geselecteerde producten',
      curatedGearText: 'Onze collectie bestaat uit zorgvuldig geselecteerde praktische producten.',
      trackedShipping: 'Tracking',
      trackedShippingText: 'Je ontvangt tracking zodra je pakket is aangemeld voor verzending.',
      support: 'Support',
      supportText: 'Contact en support blijven via ASORTA lopen.',
      brandText: 'Just what you need. Premium modern utility producten voor dagelijks gebruik, setup upgrades, automotive comfort en smart essentials.',
      payments: 'Betalingen',
    },
    categories: {
      'smart-utility': { name: 'Smart Utility', text: 'Slimme tools en praktische everyday tech upgrades.' },
      automotive: { name: 'Automotive', text: 'Car accessories en praktische upgrades voor onderweg.' },
      'desk-setup': { name: 'Desk Setup', text: 'Productiviteit, verlichting en clean workspace essentials.' },
      tactical: { name: 'Tactical', text: 'Utility gear en praktische carry accessoires.' },
      outdoor: { name: 'Outdoor', text: 'Draagbare gear voor reizen en outdoor gebruik.' },
      gaming: { name: 'Gaming', text: 'Gaming en creator setup accessoires.' },
    },
  },
  en: {
    language: 'Language',
    nav: {
      shop: 'Shop',
      tactical: 'Tactical',
      automotive: 'Automotive',
      desk: 'Desk Setup',
      gaming: 'Gaming',
      smartUtility: 'Smart Utility',
      account: 'Account',
      search: 'Search',
      cart: 'Cart',
      menu: 'Menu',
    },
    cart: {
      title: 'Cart',
      emptyTitle: 'Your cart is empty.',
      emptyText: 'Select a premium utility product first.',
      shopProducts: 'Shop products',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      shippingCalculated: 'Calculated at checkout',
      total: 'Total',
      viewCart: 'View cart',
      checkout: 'Checkout',
      checkoutNote: 'Secure checkout for your order.',
      variant: 'Variant',
    },
    shop: {
      searchPlaceholder: 'Search ASORTA products...',
      allCategories: 'All categories',
      featured: 'Featured',
      priceLow: 'Price low-high',
      priceHigh: 'Price high-low',
      margin: 'Margin potential',
      allPrices: 'All prices',
      under: 'Under €',
      productsFound: 'products found',
      noProductsTitle: 'No products found.',
      noProductsText: 'Try another category, keyword or price filter.',
      viewAll: 'View all',
    },
    checkout: {
      secure: 'Secure checkout',
      title: 'Secure checkout',
      intro: 'Review your order and continue safely to payment. After payment, you will automatically receive an order confirmation by email.',
      emptyTitle: 'Your cart is empty.',
      emptyText: 'Add products before checking out.',
      email: 'Checkout email',
      emailHelp: 'We use this email address for your order confirmation and shipping updates.',
      discount: 'Discount code',
      apply: 'Apply',
      discountHelp: 'The code is applied during checkout when the promotion is valid.',
      discountRemoved: 'Discount code removed.',
      discountApplied: 'will be applied during checkout.',
      bridgeNote: 'After payment, your order is processed and you automatically receive a confirmation. Tracking follows as soon as your parcel is registered for shipping.',
      order: 'Order',
      summary: 'Summary',
      subtotal: 'Subtotal',
      discountCode: 'Discount code',
      shipping: 'Shipping',
      shippingInShopify: 'Calculated at checkout',
      total: 'Total',
      discountCalculated: 'The discount is calculated during checkout.',
      pay: 'Pay with PayPal',
      starting: 'Starting checkout...',
      redirecting: 'Redirecting to payment...',
      shopProducts: 'Shop products',
      error: 'Checkout could not be started.',
      noUrl: 'Checkout was created, but no payment link was returned.',
      afterPayment: 'Your order is processed after payment is completed.',
    },
    footer: {
      secureCheckout: 'Secure checkout',
      secureCheckoutText: 'Your payment runs through a secure checkout environment.',
      curatedGear: 'Curated products',
      curatedGearText: 'Our collection contains carefully selected practical products.',
      trackedShipping: 'Tracking',
      trackedShippingText: 'You receive tracking as soon as your parcel is registered for shipping.',
      support: 'Support',
      supportText: 'Contact and support stay on ASORTA.',
      brandText: 'Just what you need. Premium modern utility products for daily use, setup upgrades, automotive comfort and smart essentials.',
      payments: 'Payments',
    },
    categories: {
      'smart-utility': { name: 'Smart Utility', text: 'Smart tools and practical everyday tech upgrades.' },
      automotive: { name: 'Automotive', text: 'Car accessories and practical upgrades for the road.' },
      'desk-setup': { name: 'Desk Setup', text: 'Productivity, lighting and clean workspace essentials.' },
      tactical: { name: 'Tactical', text: 'Utility gear and practical carry accessories.' },
      outdoor: { name: 'Outdoor', text: 'Portable gear for travel and outdoor use.' },
      gaming: { name: 'Gaming', text: 'Gaming and creator setup accessories.' },
    },
  },
} as const

export function getDictionary(locale: Locale) {
  return dictionaries[normalizeLocale(locale)]
}

export function categoryText(locale: Locale, slug: string, fallback?: string) {
  const entry = getDictionary(locale).categories[slug as keyof typeof dictionaries.nl.categories]
  return entry?.text || fallback || ''
}

export function categoryName(locale: Locale, slug: string, fallback?: string) {
  const entry = getDictionary(locale).categories[slug as keyof typeof dictionaries.nl.categories]
  return entry?.name || fallback || slug
}
