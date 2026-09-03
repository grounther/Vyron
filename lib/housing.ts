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

export function euro(value: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

export function propertyLabel(value: string) {
  const labels: Record<string, string> = { apartment: 'Appartement', house: 'Eengezinswoning', maisonette: 'Maisonnette', studio: 'Studio', senior: 'Seniorenwoning', other: 'Overig' }
  return labels[value] || value
}
