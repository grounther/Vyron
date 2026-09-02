export type PublicHome = {
  id: string
  city: string
  district: string | null
  province: string
  property_type: string
  rooms: number
  bedrooms: number | null
  living_area_m2: number | null
  monthly_rent: number
  has_garden: boolean
  has_balcony: boolean
  has_elevator: boolean
  ground_floor: boolean
  accessibility: string | null
  description: string
  provider_name: string | null
  image_url: string | null
  available_from: string | null
}

export const demoHomes: PublicHome[] = [
  {
    id: 'demo-raalte', city: 'Raalte', district: 'De Vloedkampen', province: 'Overijssel', property_type: 'Eengezinswoning', rooms: 4, bedrooms: 3, living_area_m2: 102, monthly_rent: 742, has_garden: true, has_balcony: false, has_elevator: false, ground_floor: false, accessibility: null, provider_name: 'SallandWonen', image_url: '/asorta-home-swap-hero.png', available_from: null,
    description: 'Lichte gezinswoning in een rustige buurt, met drie slaapkamers en een fijne achtertuin.',
  },
  {
    id: 'demo-zwolle', city: 'Zwolle', district: 'Stadshagen', province: 'Overijssel', property_type: 'Appartement', rooms: 3, bedrooms: 2, living_area_m2: 78, monthly_rent: 713, has_garden: false, has_balcony: true, has_elevator: true, ground_floor: false, accessibility: 'Gelijkvloers bereikbaar', provider_name: 'deltaWonen', image_url: '/asorta-home-swap-hero.png', available_from: null,
    description: 'Modern appartement met balkon, lift en winkels op korte afstand.',
  },
  {
    id: 'demo-deventer', city: 'Deventer', district: 'Keizerslanden', province: 'Overijssel', property_type: 'Maisonnette', rooms: 4, bedrooms: 3, living_area_m2: 94, monthly_rent: 766, has_garden: false, has_balcony: true, has_elevator: false, ground_floor: false, accessibility: null, provider_name: 'Woonbedrijf ieder1', image_url: '/asorta-home-swap-hero.png', available_from: null,
    description: 'Ruime maisonnette met drie slaapkamers en een zonnig balkon.',
  },
]

export function euro(value: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

export function propertyLabel(value: string) {
  const labels: Record<string, string> = { apartment: 'Appartement', house: 'Eengezinswoning', maisonette: 'Maisonnette', studio: 'Studio', senior: 'Seniorenwoning', other: 'Overig' }
  return labels[value] || value
}
