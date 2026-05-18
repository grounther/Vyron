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
      checkoutNote: 'PayPal loopt tijdelijk via Shopify checkout.',
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
      title: 'PayPal checkout via Shopify',
      intro: 'Je blijft de ASORTA frontend gebruiken. Voor deze tijdelijke live-flow sturen we je cart veilig door naar Shopify checkout, zodat je met PayPal kunt betalen en DSers de Shopify order kan verwerken.',
      emptyTitle: 'Je cart is leeg.',
      emptyText: 'Voeg eerst producten toe voordat je afrekent.',
      email: 'E-mail voor checkout',
      emailHelp: 'Shopify vraagt straks je bezorgadres, shipping en PayPal-login. Je order komt daarna automatisch in Shopify terecht voor DSers.',
      discount: 'Kortingscode',
      apply: 'Toepassen',
      discountHelp: 'De code wordt meegestuurd naar Shopify en daar op je PayPal-checkout toegepast.',
      discountRemoved: 'Kortingscode verwijderd.',
      discountApplied: 'wordt toegepast in de beveiligde Shopify checkout.',
      bridgeNote: 'Later, zodra Mollie/iDEAL/Wero rond is, kan deze stap worden vervangen door de eigen ASORTA checkout. Nu is Shopify checkout bewust de PayPal + DSers bridge.',
      order: 'Bestelling',
      summary: 'Overzicht',
      subtotal: 'Subtotaal',
      discountCode: 'Kortingscode',
      shipping: 'Verzending',
      shippingInShopify: 'In Shopify',
      total: 'Totaal',
      discountCalculated: 'De korting wordt door Shopify berekend voordat je via PayPal betaalt.',
      pay: 'Betaal met PayPal',
      starting: 'Shopify checkout starten...',
      redirecting: 'Doorsturen naar Shopify...',
      shopProducts: 'Shop producten',
      error: 'Shopify checkout kon niet worden gestart.',
      noUrl: 'Checkout is aangemaakt, maar Shopify gaf geen checkout URL terug.',
      afterPayment: 'Orders worden door Shopify/DSers verwerkt nadat PayPal-betaling is afgerond.',
    },
    footer: {
      secureCheckout: 'Veilige checkout',
      secureCheckoutText: 'PayPal checkout loopt beveiligd via Shopify zolang Mollie/iDEAL nog niet actief is.',
      curatedGear: 'Geselecteerde producten',
      curatedGearText: 'Alle producten komen uit Shopify en worden gemapt naar ASORTA.',
      trackedShipping: 'Tracking',
      trackedShippingText: 'DSers/Shopify verwerkt order- en trackingupdates.',
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
      checkoutNote: 'PayPal temporarily runs through Shopify checkout.',
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
      title: 'PayPal checkout via Shopify',
      intro: 'You keep using the ASORTA frontend. For this temporary live flow, we securely send your cart to Shopify checkout so you can pay with PayPal and DSers can process the Shopify order.',
      emptyTitle: 'Your cart is empty.',
      emptyText: 'Add products before checking out.',
      email: 'Checkout email',
      emailHelp: 'Shopify will ask for your delivery address, shipping and PayPal login. Your order will then appear in Shopify for DSers.',
      discount: 'Discount code',
      apply: 'Apply',
      discountHelp: 'The code is sent to Shopify and applied in the PayPal checkout there.',
      discountRemoved: 'Discount code removed.',
      discountApplied: 'will be applied in the secure Shopify checkout.',
      bridgeNote: 'Later, when Mollie/iDEAL/Wero is ready, this step can be replaced by the own ASORTA checkout. For now, Shopify checkout is the PayPal + DSers bridge.',
      order: 'Order',
      summary: 'Summary',
      subtotal: 'Subtotal',
      discountCode: 'Discount code',
      shipping: 'Shipping',
      shippingInShopify: 'In Shopify',
      total: 'Total',
      discountCalculated: 'The discount is calculated by Shopify before you pay with PayPal.',
      pay: 'Pay with PayPal',
      starting: 'Starting Shopify checkout...',
      redirecting: 'Redirecting to Shopify...',
      shopProducts: 'Shop products',
      error: 'Shopify checkout could not be started.',
      noUrl: 'Checkout was created, but Shopify did not return a checkout URL.',
      afterPayment: 'Orders are processed by Shopify/DSers after PayPal payment is completed.',
    },
    footer: {
      secureCheckout: 'Secure checkout',
      secureCheckoutText: 'PayPal checkout securely runs through Shopify while Mollie/iDEAL is not active yet.',
      curatedGear: 'Curated products',
      curatedGearText: 'All products come from Shopify and are mapped to ASORTA.',
      trackedShipping: 'Tracking',
      trackedShippingText: 'DSers/Shopify handles order and tracking updates.',
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
