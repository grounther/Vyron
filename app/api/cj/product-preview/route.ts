import { NextResponse } from 'next/server'
import { queryCJProduct, resolveCjProductReference, type CJProductDetail, type CJVariant } from '@/lib/cj'
import { requireAtlasAdminApi } from '@/lib/server/atlas-api'

function parseNumberish(input: unknown) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0
  if (typeof input === 'string') {
    const parsed = Number(input.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function stockForVariant(variant: CJVariant) {
  return (variant.inventories || []).reduce((sum, inventory) => {
    const total =
      parseNumberish(inventory.totalInventory) ||
      parseNumberish(inventory.totalInventoryNum) ||
      parseNumberish(inventory.cjInventory) ||
      parseNumberish(inventory.cjInventoryNum) ||
      parseNumberish(inventory.factoryInventory) ||
      parseNumberish(inventory.factoryInventoryNum)
    return sum + total
  }, 0)
}

function productImages(product: CJProductDetail) {
  const variantImages = (product.variants || []).map((variant) => variant.variantImage)
  return unique([product.bigImage, product.productImage, ...(product.productImageSet || []), ...variantImages])
}

export async function GET(request: Request) {
  const auth = await requireAtlasAdminApi()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const productUrl = searchParams.get('url') || ''
  const submittedSku = (searchParams.get('sku') || '').trim().toUpperCase()
  const submittedPid = (searchParams.get('pid') || '').trim()
  const countryCode = (searchParams.get('countryCode') || '').trim().toUpperCase() || undefined

  try {
    const ref = await resolveCjProductReference(productUrl || submittedSku || submittedPid, {
      productSku: submittedSku,
      pid: submittedPid,
    })
    const productSku = submittedSku || ref.productSku
    const pid = submittedPid || ref.pid
    const variantSku = ref.variantSku

    if (!productSku && !pid && !variantSku) {
      return NextResponse.json({ error: 'Geen CJ SPU/productSku, PID of variantSku gevonden. Plak een volledige CJ product URL of vul de SPU handmatig in.' }, { status: 400 })
    }

    const product = await queryCJProduct({ productSku, pid, variantSku, countryCode })
    const images = productImages(product)
    const variants = product.variants || []
    const firstVariant = variants[0]
    const estimatedCostUsd = parseNumberish(firstVariant?.variantSellPrice) || parseNumberish(product.sellPrice) || null
    const warnings: string[] = []

    if (!product.productSku && productSku) warnings.push('CJ gaf geen productSku terug; Atlas gebruikt de ingevoerde SKU als fallback.')
    if (!variants.length) warnings.push('CJ gaf geen varianten terug. Controleer dit product handmatig voordat je publiceert.')
    if (!images.length) warnings.push('CJ gaf geen productafbeeldingen terug.')
    if (firstVariant && stockForVariant(firstVariant) <= 0) warnings.push('Eerste variant lijkt geen voorraad te hebben; controleer inventory per variant.')

    return NextResponse.json({
      ok: true,
      productSku: product.productSku || productSku || '',
      pid: product.pid || pid || '',
      productNameEn: product.productNameEn || product.productName || '',
      slugSuggestion: slugify(product.productNameEn || product.productName || product.productSku || productSku || product.pid || 'cj-product'),
      categoryName: product.categoryName || '',
      image: images[0] || '',
      images,
      variantCount: variants.length,
      estimatedCostUsd,
      suggestedSellPrice: product.suggestSellPrice || '',
      firstVariantSku: firstVariant?.variantSku || '',
      firstVariantId: firstVariant?.vid || '',
      weightGrams: parseNumberish(product.productWeight) || null,
      sourceIdentifier: ref.sourceUrl || productUrl || productSku || pid || variantSku,
      warnings,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'CJ preview kon niet worden opgehaald.' }, { status: 500 })
  }
}
