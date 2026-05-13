# ASORTA V5.6.1 - CJ Product Importer

Deze update voegt een CJ Dropshipping importer toe aan:

```text
/atlas/products
```

Gebruik deze importer in plaats van CJ's losse `Connect` knop wanneer je een custom Next.js/Supabase shop gebruikt.

## Wat is toegevoegd

- CJ product import via product URL, SPU/productSku of PID.
- Vooringevulde quick import voor de dashcam:

```text
https://cjdropshipping.com/product/front-and-rear-dual-recording-dashcam-p-2604160248311602900.html
CJYD2836955
```

- Automatisch aanmaken van product in de Supabase `products` tabel.
- Automatisch opslaan van CJ productdata, SPU, PID, varianten, variant IDs, variant SKU's, afbeeldingen en voorraadindicatie.
- Nieuwe mappingtabel: `cj_product_mappings`.
- Optionele poging om het product toe te voegen aan CJ `My Products`.
- Optionele officiële CJ product connection, alleen als je later een CJ API shop/store hebt.

## Waarom de CJ Connect knop niet nodig is

De CJ `Connect` flow is vooral bedoeld voor platformstores of voor een CJ API shop die in je CJ account staat. ASORTA is een custom storefront. Daarom bewaren we zelf de mapping:

```text
ASORTA product / variant -> CJ product / variant
```

Voor fulfilment kan de backend later direct CJ orders aanmaken met de CJ `vid` of `sku` uit deze mapping.

## Supabase migratie

Run deze SQL in Supabase SQL Editor:

```text
supabase/v5_16_cj_product_import_schema.sql
```

Run deze na de eerdere support/customer portal migraties.

## Environment variables

Zet minimaal een van deze server-side environment variables in Vercel/hosting:

```text
CJ_API_KEY
```

of:

```text
CJ_ACCESS_TOKEN
```

Aanbevolen is `CJ_API_KEY`, omdat Atlas dan zelf een access token kan ophalen.

Optioneel voor officiële CJ product connections:

```text
CJ_SHOP_ID
CJ_ENABLE_PRODUCT_CONNECTIONS=true
```

Gebruik geen `NEXT_PUBLIC_CJ_...` variabelen. CJ secrets horen nooit in de browser.

## Gebruik

1. Open Atlas:

```text
/atlas/products
```

2. Ga naar `CJ Dropshipping import`.
3. Plak CJ product URL of vul SPU/productSku in.
4. Controleer prijs, categorie, status en shipping.
5. Klik `Import from CJ`.
6. Controleer het aangemaakte product in dezelfde Atlas productpagina.
7. Publiceer pas naar `active` nadat je tekst, claims, prijs, afbeeldingen, shipping en compliance hebt gecontroleerd.

## Dashcam product

De importer is vooringevuld met:

```text
Product: Front And Rear Dual Recording Dashcam
SPU/productSku: CJYD2836955
URL: https://cjdropshipping.com/product/front-and-rear-dual-recording-dashcam-p-2604160248311602900.html
Voorstel shopnaam: ASORTA DualView DashCam
Slug: asorta-dualview-dashcam
Categorie: Automotive
Status: draft
```

## Volgende stap

Deze update legt de productmapping klaar. De volgende release kan de fulfilment bridge toevoegen:

```text
Betaalde order -> CJ create order -> CJ confirm/pay -> tracking webhook -> klantmail + klantportaal
```
