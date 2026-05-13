# V5.6.2 CJ URL Auto Import

Deze update maakt de CJ productimport in Atlas generieker en bruikbaarder.

## Wat is nieuw

- In `/atlas/products` kun je nu een CJ product-URL plakken.
- Het SPU/productSku veld mag leeg blijven.
- Atlas probeert automatisch de SPU/productSku of PID uit de URL/CJ-pagina te halen.
- Er is nu een server-side preview endpoint: `/api/cj/product-preview`.
- Dashcam-specifieke standaardtags, content ideas en supplier notes zijn verwijderd uit de generieke importer.
- De TypeScript fallback-productlijst is getypt met CJ velden.

## Gebruik

1. Open `/atlas/products`.
2. Plak een CJ product URL in `CJ product URL`.
3. Laat `CJ SPU / SKU` leeg, tenzij je bewust wilt overrulen.
4. Klik `Haal CJ-info op`.
5. Controleer de preview.
6. Klik `Importeren vanuit CJ`.
7. Controleer prijs, marge, afbeeldingen, claims, compliance, varianten en status voordat je live zet.

## Environment

Minimaal nodig:

```text
CJ_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Gebruik geen `NEXT_PUBLIC_CJ_API_KEY`. CJ keys blijven server-side.

## SQL

Geen nieuwe SQL voor V5.6.2. De eerdere migratie moet wel uitgevoerd zijn:

```text
supabase/v5_16_cj_product_importer_schema.sql
```
