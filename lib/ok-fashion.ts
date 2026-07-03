export type OkFashionColor = {
  name: string
  hex: string
  text?: string
}

export type OkFashionProduct = {
  slug: string
  name: string
  set: string
  category: string
  material: string
  fit: string
  priceRange: string
  status: string
  short: string
  description: string
  colors: OkFashionColor[]
  features: string[]
  specs: string[]
  pairsWith: string[]
  garment: 'tee' | 'shirt' | 'trouser' | 'short' | 'overshirt' | 'silk'
  heroTone: string
  accent: string
}

export const okFashionColorLibrary: Record<string, OkFashionColor> = {
  White: { name: 'White', hex: '#f7f2e9' },
  Cream: { name: 'Cream', hex: '#efe3cf' },
  Stone: { name: 'Stone', hex: '#d8d0c1' },
  Beige: { name: 'Beige', hex: '#cbb79c' },
  Camel: { name: 'Camel', hex: '#b58b61' },
  Navy: { name: 'Navy', hex: '#16233a' },
  Olive: { name: 'Olive', hex: '#667255' },
  Chocolate: { name: 'Chocolate', hex: '#3c271c' },
  Black: { name: 'Black', hex: '#090909' },
  Charcoal: { name: 'Charcoal', hex: '#4b4b4b' },
  Grey: { name: 'Grey', hex: '#76736d' },
  Pearl: { name: 'Pearl', hex: '#f1e9dd' },
  Taupe: { name: 'Taupe', hex: '#9b8370' },
}

const c = (...names: string[]) => names.map((name) => okFashionColorLibrary[name])

export const okFashionProducts: OkFashionProduct[] = [
  {
    slug: 'premium-cotton-t-shirt',
    name: 'Premium Cotton T-shirt',
    set: 'The Cotton Essential Set',
    category: 'Cotton Essentials',
    material: 'Compact cotton / pima cotton, 220-260 gsm',
    fit: 'Regular relaxed fit',
    priceRange: '€69-€119',
    status: 'Samplefase',
    short: 'Het dagelijkse basisitem waarmee OK Fashion kwaliteit direct voelbaar maakt.',
    description:
      'Een stevig maar zacht premium T-shirt met nette valling, een rustige halslijn en een klein sierlijk OK-logo op de linker mouwnaad. Ontworpen als basis voor bijna elke set binnen The First Edit.',
    colors: c('White', 'Stone', 'Navy', 'Black', 'Cream'),
    features: ['Niet doorschijnend katoen', 'Stevige crewneck rib', 'Ton-sur-ton OK-borduring op linker mouw', 'Voorgekrompen stof'],
    specs: ['220-260 gsm katoen', 'Regular relaxed fit', 'Dubbele stiknaden bij zoom en mouwen', 'Subtiel OK-monogram circa 1,6 cm'],
    pairsWith: ['Relaxed Cotton Trouser', 'Overshirt', 'Linen Short'],
    garment: 'tee',
    heroTone: '#f1e4d1',
    accent: '#d1b188',
  },
  {
    slug: 'relaxed-cotton-trouser',
    name: 'Relaxed Cotton Trouser',
    set: 'The Cotton Essential Set',
    category: 'Cotton Essentials',
    material: 'Zware katoen twill / cotton stretch blend, 240-320 gsm',
    fit: 'Relaxed straight leg',
    priceRange: '€149-€229',
    status: 'Samplefase',
    short: 'Comfortabel als casualwear, maar met een verzorgde premium uitstraling.',
    description:
      'Een moderne relaxed trouser met clean front, subtiele taille-oplossing en een rechte valling. De broek is ontworpen om met T-shirts, linen shirts en overshirts complete OK Fashion looks te maken.',
    colors: c('Beige', 'Stone', 'Navy', 'Charcoal'),
    features: ['Clean tailored voorkant', 'Comfortabele rechte pijp', 'Verborgen comfortdetail in taille', 'Subtiel OK-detail bij zijnaad of achterzak'],
    specs: ['240-320 gsm katoen twill', 'Relaxed straight fit', 'Steekzakken en paspelzakken', 'Geen opvallend buitenlogo'],
    pairsWith: ['Premium Cotton T-shirt', 'Overshirt', 'Linen Shirt'],
    garment: 'trouser',
    heroTone: '#d1bda0',
    accent: '#8d7152',
  },
  {
    slug: 'linen-shirt',
    name: 'Linen Shirt',
    set: 'The Linen Resort Set',
    category: 'Linen Resort',
    material: '100% linnen of linnen/katoen blend, 140-180 gsm',
    fit: 'Relaxed tailored fit',
    priceRange: '€129-€199',
    status: 'Samplefase',
    short: 'Een luchtig, volwassen linnen shirt met natuurlijke luxe.',
    description:
      'Het OK Linen Shirt is bedoeld voor warme dagen, city summer en resort-achtige outfits. De stof mag natuurlijk bewegen, maar de pasvorm blijft verzorgd en stijlvol.',
    colors: c('Cream', 'White', 'Olive', 'Beige', 'Navy'),
    features: ['Ademend linnen', 'Relaxed maar nette schouderlijn', 'Parelmoer-look knopen', 'OK-logo op linker mouw'],
    specs: ['140-180 gsm linnen', 'Klassieke kraag of resort collar', 'Ton-sur-ton borduring circa 1,7 cm', 'Clean front zonder drukke details'],
    pairsWith: ['Linen Trouser', 'Linen Short', 'Relaxed Cotton Trouser'],
    garment: 'shirt',
    heroTone: '#eee1cb',
    accent: '#cab28f',
  },
  {
    slug: 'linen-trouser',
    name: 'Linen Trouser',
    set: 'The Linen Resort Set',
    category: 'Linen Resort',
    material: 'Linnen/katoen of linnen/viscose blend, 180-240 gsm',
    fit: 'Relaxed resort trouser',
    priceRange: '€149-€229',
    status: 'Samplefase',
    short: 'Een luchtige broek die resort comfort combineert met premium styling.',
    description:
      'De Linen Trouser maakt van het linen shirt een volledige set. De broek heeft een rustige taille, nette zakken en een rechte valling zonder sportieve details.',
    colors: c('Cream', 'Beige', 'Navy'),
    features: ['Natuurlijke valling', 'Nette tailleband', 'Luchtig maar niet strandachtig', 'Bijpassend bij linen shirts'],
    specs: ['180-240 gsm linen blend', 'Relaxed straight leg', 'Steekzakken', 'Subtiel intern OK-label'],
    pairsWith: ['Linen Shirt', 'Premium Cotton T-shirt', 'Silk-Blend Shirt'],
    garment: 'trouser',
    heroTone: '#e4d6c0',
    accent: '#b99d78',
  },
  {
    slug: 'linen-short',
    name: 'Linen Short',
    set: 'The Linen Resort Set',
    category: 'Linen Resort',
    material: 'Linnen/katoen of linnen/viscose blend',
    fit: 'Relaxed tailored short',
    priceRange: '€99-€159',
    status: 'Samplefase',
    short: 'Een premium short voor warme dagen, met genoeg rust om stijlvol te blijven.',
    description:
      'De Linen Short is ontworpen als luxe zomerse set met het Linen Shirt. De lengte blijft modern en volwassen, met een nette tailleband en zonder opvallende sportdetails.',
    colors: c('Cream', 'Olive', 'Beige'),
    features: ['Moderne lengte', 'Clean tailleband', 'Geen zichtbaar trekkoord', 'Resort luxury uitstraling'],
    specs: ['Binnenbeen circa 15-18 cm', 'Relaxed tailored fit', 'Steekzakken', 'Subtiel OK-detail intern of bij zijnaad'],
    pairsWith: ['Linen Shirt', 'Premium Cotton T-shirt', 'Overshirt'],
    garment: 'short',
    heroTone: '#e7dac6',
    accent: '#9d896c',
  },
  {
    slug: 'overshirt',
    name: 'Overshirt',
    set: 'The Overshirt Uniform Set',
    category: 'Overshirts',
    material: 'Katoen twill / linnen-katoen blend / brushed cotton, 280-420 gsm',
    fit: 'Relaxed structured fit',
    priceRange: '€179-€299',
    status: 'Samplefase',
    short: 'Het herkenbare layering item van OK Fashion.',
    description:
      'Het Overshirt is het item dat de collectie kracht geeft. Het draagt als een lichte jas over een T-shirt of shirt, met een rustige structuur en subtiele OK-borduring op de linker mouw.',
    colors: c('Olive', 'Chocolate', 'Navy', 'Camel', 'Charcoal'),
    features: ['Stevige maar comfortabele stof', 'Layering piece tussen shirt en jas', 'Premium knopen', 'OK-logo op linker mouwnaad'],
    specs: ['280-420 gsm stofgewicht', 'Relaxed structured fit', 'Manchetten met knoopsluiting', 'Borstzakken of clean front afhankelijk van sample'],
    pairsWith: ['Premium Cotton T-shirt', 'Relaxed Cotton Trouser', 'Linen Short'],
    garment: 'overshirt',
    heroTone: '#d6d2bb',
    accent: '#6b7054',
  },
  {
    slug: 'silk-blend-shirt',
    name: 'Silk-Blend Shirt',
    set: 'The Silk Evening Set',
    category: 'Silk Evening',
    material: 'Zijde/katoen, zijde/viscose of zijde/linnen blend',
    fit: 'Relaxed elegant fit',
    priceRange: '€179-€299',
    status: 'Samplefase',
    short: 'Het meest verfijnde shirt uit The First Edit.',
    description:
      'Een elegant shirt met zachte glans en soepele valling. Bedoeld voor diner, avond, resort en momenten waar comfort en luxe samen moeten komen.',
    colors: c('Black', 'Chocolate', 'Pearl', 'Taupe', 'Beige'),
    features: ['Zachte glans', 'Soepele premium valling', 'Lichte borduring zodat de stof niet trekt', 'Geen overbodige details'],
    specs: ['Zijdeblend', 'Relaxed elegant fit', 'Subtiel OK-logo circa 1,5-1,7 cm', 'Zachte kraag en fijne stiknaden'],
    pairsWith: ['Fluid Trouser', 'Linen Trouser', 'Relaxed Cotton Trouser'],
    garment: 'silk',
    heroTone: '#dfd2c1',
    accent: '#8e715f',
  },
  {
    slug: 'fluid-trouser',
    name: 'Fluid Trouser',
    set: 'The Silk Evening Set',
    category: 'Relaxed Tailoring',
    material: 'Viscose blend / zijde-linnen blend / premium cotton sateen',
    fit: 'Relaxed fluid fit',
    priceRange: '€169-€249',
    status: 'Samplefase',
    short: 'Een elegante broek met soepele valling voor de meest luxe OK Fashion looks.',
    description:
      'De Fluid Trouser hoort bij de Silk Evening Set. De broek moet soepel bewegen, luxe vallen en toch comfortabel genoeg blijven voor lange avonden of resort wear.',
    colors: c('Charcoal', 'Beige', 'Chocolate', 'Black'),
    features: ['Soepele valling', 'Avondwaardige uitstraling', 'Clean front', 'Subtiel intern OK-detail'],
    specs: ['Premium fluid blend', 'Relaxed fit', 'Nette tailleband', 'Geen sportieve details'],
    pairsWith: ['Silk-Blend Shirt', 'Premium Cotton T-shirt', 'Overshirt'],
    garment: 'trouser',
    heroTone: '#cec1b0',
    accent: '#4b4b4b',
  },
]

export const okFashionSets = [
  {
    name: 'The Cotton Essential Set',
    products: ['Premium Cotton T-shirt', 'Relaxed Cotton Trouser'],
    colors: ['White + Beige', 'Stone + Navy', 'Black + Charcoal'],
    text: 'Clean everyday luxury.',
  },
  {
    name: 'The Linen Resort Set',
    products: ['Linen Shirt', 'Linen Trouser', 'Linen Short'],
    colors: ['Cream', 'Olive + Cream', 'White + Beige'],
    text: 'Zomers, luchtig en stijlvol.',
  },
  {
    name: 'The Overshirt Uniform Set',
    products: ['Overshirt', 'Relaxed Cotton Trouser', 'Premium Cotton T-shirt'],
    colors: ['Olive + Cream', 'Chocolate + Beige', 'Navy + Stone'],
    text: 'De herkenbare OK Fashion look.',
  },
  {
    name: 'The Silk Evening Set',
    products: ['Silk-Blend Shirt', 'Fluid Trouser'],
    colors: ['Black + Charcoal', 'Chocolate + Beige', 'Pearl + Stone'],
    text: 'Elegant, rustig en avondwaardig.',
  },
]

export function getOkFashionProduct(slug: string) {
  return okFashionProducts.find((product) => product.slug === slug)
}
