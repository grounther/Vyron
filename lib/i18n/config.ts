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
      boosterPacks: 'Booster packs',
      eliteTrainerBoxes: "ETB\'s",
      collectionBoxes: 'Collection boxes',
      marketDeals: 'Markt deals',
      accessories: 'Accessoires',
      account: 'Account',
      search: 'Zoeken',
      cart: 'Winkelwagen',
      menu: 'Menu',
    },
    cart: {
      title: 'Winkelwagen',
      emptyTitle: 'Je winkelwagen is leeg.',
      emptyText: 'Selecteer eerst een Pokemon product.',
      shopProducts: 'Shop producten',
      subtotal: 'Subtotaal',
      shipping: 'Verzending',
      shippingCalculated: 'Berekend bij checkout',
      total: 'Totaal',
      viewCart: 'Bekijk winkelwagen',
      checkout: 'Afrekenen',
      checkoutNote: 'Je wordt doorgestuurd naar de beveiligde checkout.',
      variant: 'Uitvoering',
    },
    shop: {
      searchPlaceholder: 'Zoek Pokemon producten...',
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
      intro: 'Vul je e-mailadres in en ga veilig verder naar de betaalomgeving.',
      emptyTitle: 'Je cart is leeg.',
      emptyText: 'Voeg eerst producten toe voordat je afrekent.',
      email: 'E-mail voor checkout',
      emailHelp: 'We gebruiken dit voor je orderbevestiging en trackingupdates.',
      discount: 'Kortingscode',
      apply: 'Toepassen',
      discountHelp: 'De korting wordt toegepast in de beveiligde checkout als de code geldig is.',
      discountRemoved: 'Kortingscode verwijderd.',
      discountApplied: 'wordt toegepast in de beveiligde checkout.',
      bridgeNote: 'Na betaling ontvang je een orderbevestiging. Zodra verzending is aangemeld, ontvang je trackinginformatie.',
      order: 'Bestelling',
      summary: 'Overzicht',
      subtotal: 'Subtotaal',
      discountCode: 'Kortingscode',
      shipping: 'Verzending',
      shippingInShopify: 'At checkout',
      total: 'Totaal',
      discountCalculated: 'De korting wordt berekend voordat je betaalt.',
      pay: 'Betaal met PayPal',
      starting: 'Checkout starten...',
      redirecting: 'Doorsturen naar checkout...',
      shopProducts: 'Shop producten',
      error: 'Checkout kon niet worden gestart.',
      noUrl: 'Checkout is aangemaakt, maar er kwam geen betaal-URL terug.',
      afterPayment: 'Na betaling verwerken we je bestelling en ontvang je updates per e-mail.',
    },
    footer: {
      secureCheckout: 'Veilige checkout',
      secureCheckoutText: 'Afrekenen verloopt via een beveiligde betaalomgeving.',
      curatedGear: 'Geselecteerde producten',
      curatedGearText: 'Geselecteerd op praktische waarde en duidelijke productinformatie.',
      trackedShipping: 'Tracking',
      trackedShippingText: 'Je ontvangt tracking zodra deze beschikbaar is.',
      support: 'Support',
      supportText: 'Contact en support blijven via ASORTA lopen.',
      brandText: 'Trading Cards • Collectibles • Events. Pokemon sealed producten, collectibles en eigen voorraad voor online verkoop en markten.',
      payments: 'Betalingen',
    },
    categories: {
      'booster-packs': { name: 'Booster Packs', text: 'Losse Pokemon booster packs uit eigen voorraad.' },
      'elite-trainer-boxes': { name: 'Elite Trainer Boxes', text: "ETB\'s, trainer kits en premium sealed boxen." },
      'collection-boxes': { name: 'Collection Boxes', text: 'Pokemon collection boxes, tins en gift sets.' },
      singles: { name: 'Singles', text: 'Losse kaarten, hits en binderwaardige kaarten.' },
      accessories: { name: 'Accessoires', text: 'Sleeves, binders, toploaders en bescherming voor je collectie.' },
      'market-deals': { name: 'Markt Deals', text: 'Bundles, acties en producten voor markten en braderieen.' },
    },
  },
  en: {
    language: 'Language',
    nav: {
      shop: 'Shop',
      boosterPacks: 'Booster packs',
      eliteTrainerBoxes: 'ETBs',
      collectionBoxes: 'Collection boxes',
      marketDeals: 'Market deals',
      accessories: 'Accessories',
      account: 'Account',
      search: 'Search',
      cart: 'Cart',
      menu: 'Menu',
    },
    cart: {
      title: 'Cart',
      emptyTitle: 'Your cart is empty.',
      emptyText: 'Select a Pokemon product first.',
      shopProducts: 'Shop products',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      shippingCalculated: 'Calculated at checkout',
      total: 'Total',
      viewCart: 'View cart',
      checkout: 'Checkout',
      checkoutNote: 'You will be redirected to secure checkout.',
      variant: 'Variant',
    },
    shop: {
      searchPlaceholder: 'Search Pokemon products...',
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
      intro: 'Enter your email and continue to the secure payment flow.',
      emptyTitle: 'Your cart is empty.',
      emptyText: 'Add products before checking out.',
      email: 'Checkout email',
      emailHelp: 'We use this for order confirmation and tracking updates.',
      discount: 'Discount code',
      apply: 'Apply',
      discountHelp: 'The discount is applied in secure checkout when the code is valid.',
      discountRemoved: 'Discount code removed.',
      discountApplied: 'will be applied in secure checkout.',
      bridgeNote: 'After payment you receive an order confirmation. Once shipping is available, you receive tracking information.',
      order: 'Order',
      summary: 'Summary',
      subtotal: 'Subtotal',
      discountCode: 'Discount code',
      shipping: 'Shipping',
      shippingInShopify: 'At checkout',
      total: 'Total',
      discountCalculated: 'The discount is calculated before you pay.',
      pay: 'Pay with PayPal',
      starting: 'Starting checkout...',
      redirecting: 'Redirecting to checkout...',
      shopProducts: 'Shop products',
      error: 'Checkout could not be started.',
      noUrl: 'Checkout was created, but no payment URL was returned.',
      afterPayment: 'After payment, we process your order and send updates by email.',
    },
    footer: {
      secureCheckout: 'Secure checkout',
      secureCheckoutText: 'Checkout runs through a secure payment flow.',
      curatedGear: 'Curated products',
      curatedGearText: 'Selected for practical value and clear product information.',
      trackedShipping: 'Tracking',
      trackedShippingText: 'You receive tracking as soon as it is available.',
      support: 'Support',
      supportText: 'Contact and support stay on ASORTA.',
      brandText: 'Trading Cards • Collectibles • Events. Pokemon sealed products, collectibles and owned inventory for online sales and markets.',
      payments: 'Payments',
    },
    categories: {
      'booster-packs': { name: 'Booster Packs', text: 'Single Pokemon booster packs from owned inventory.' },
      'elite-trainer-boxes': { name: 'Elite Trainer Boxes', text: 'ETBs, trainer kits and premium sealed boxes.' },
      'collection-boxes': { name: 'Collection Boxes', text: 'Pokemon collection boxes, tins and gift sets.' },
      singles: { name: 'Singles', text: 'Single cards, hits and binder-worthy cards.' },
      accessories: { name: 'Accessories', text: 'Sleeves, binders, toploaders and collection protection.' },
      'market-deals': { name: 'Market Deals', text: 'Bundles, offers and products for markets and events.' },
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
