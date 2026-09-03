import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { propertyLabel, type PublicHome } from '@/lib/housing'

export type FeaturedHome = {
  home: PublicHome
  kind: 'match' | 'own' | 'available'
  matchId?: string
}

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

function randomItem<T>(items: T[]): T | null {
  if (!items.length) return null
  return items[Math.floor(Math.random() * items.length)] || null
}

export async function getFeaturedHome(userId?: string | null): Promise<FeaturedHome | null> {
  const admin = createAdminClient()
  if (!admin) return null

  if (userId) {
    const { data: matches = [] } = await admin
      .from('matches')
      .select('id,listing_a_id,listing_b_id,user_a_id,user_b_id,status')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .in('status',['active','swap_in_progress'])
      .order('updated_at',{ascending:false})
      .limit(50)

    const targetListingIds = [...new Set((matches || []).map((match:any) => match.user_a_id === userId ? match.listing_b_id : match.listing_a_id))]
    if (targetListingIds.length) {
      const { data: matchingHomes = [] } = await admin.from('public_listings').select('*').in('id',targetListingIds)
      const selectedRow = randomItem(matchingHomes || []) as any
      if (selectedRow) {
        const match = (matches || []).find((item:any) => item.listing_a_id === selectedRow.id || item.listing_b_id === selectedRow.id)
        const images = await photoUrls([selectedRow.id])
        return { home: mapRow(selectedRow,images.get(selectedRow.id)||null), kind:'match', matchId:match?.id }
      }
    }

    const { data: ownListing } = await admin.from('listings').select('id').eq('user_id',userId).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle()
    if (ownListing?.id) {
      const { data: ownHome } = await admin.from('public_listings').select('*').eq('id',ownListing.id).maybeSingle()
      if (ownHome) {
        const images = await photoUrls([ownHome.id])
        return { home: mapRow(ownHome,images.get(ownHome.id)||null), kind:'own' }
      }
    }
  }

  const { data: availableHomes = [] } = await admin.from('public_listings').select('*').order('created_at',{ascending:false}).limit(60)
  const selectedRow = randomItem(availableHomes || []) as any
  if (!selectedRow) return null
  const images = await photoUrls([selectedRow.id])
  return { home: mapRow(selectedRow,images.get(selectedRow.id)||null), kind:'available' }
}
