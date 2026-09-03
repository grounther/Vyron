import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { propertyLabel, type PublicHome } from '@/lib/housing'

async function photoUrls(listingIds: string[]) {
  const admin = createAdminClient()
  if (!admin || !listingIds.length) return new Map<string,string>()
  const { data } = await admin.from('listing_photos').select('listing_id,storage_path,position').in('listing_id',listingIds).eq('moderation_status','approved').order('position')
  const first = new Map<string,string>()
  for (const row of data || []) {
    if (first.has(row.listing_id)) continue
    const { data: signed } = await admin.storage.from('listing-photos').createSignedUrl(row.storage_path,60*30)
    if (signed?.signedUrl) first.set(row.listing_id,signed.signedUrl)
  }
  return first
}

function mapRow(row: any, imageUrl: string | null): PublicHome {
  return {
    id: row.id,
    city: row.city,
    district: row.district,
    province: row.province,
    property_type: propertyLabel(row.property_type),
    rooms: Number(row.rooms),
    bedrooms: row.bedrooms == null ? null : Number(row.bedrooms),
    living_area_m2: row.living_area_m2 == null ? null : Number(row.living_area_m2),
    monthly_rent: Number(row.monthly_rent),
    has_garden: Boolean(row.has_garden),
    has_balcony: Boolean(row.has_balcony),
    has_elevator: Boolean(row.has_elevator),
    ground_floor: Boolean(row.ground_floor),
    accessibility: row.accessibility,
    description: row.description,
    provider_name: row.provider_name,
    image_url: imageUrl,
    available_from: row.available_from,
  }
}

export async function getPublicHomes(): Promise<PublicHome[]> {
  const admin = createAdminClient()
  if (!admin) return []
  const { data, error } = await admin.from('public_listings').select('*').order('created_at',{ascending:false}).limit(60)
  if (error || !data?.length) return []
  const images = await photoUrls(data.map((row:any)=>row.id))
  return data.map((row:any)=>mapRow(row,images.get(row.id)||null))
}

export async function getPublicHome(id: string): Promise<PublicHome | null> {
  const admin = createAdminClient()
  if (!admin) return null
  const { data, error } = await admin.from('public_listings').select('*').eq('id',id).maybeSingle()
  if (error || !data) return null
  const images = await photoUrls([id])
  return mapRow(data,images.get(id)||null)
}
