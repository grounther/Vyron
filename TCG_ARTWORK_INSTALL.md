# ASORTA TCG artwork installatie

Deze update voegt echte artwork-assets toe voor de Perfect Order serie.

## Wat is toegevoegd

- `public/tcg/perfect-order/po-001.png` t/m `po-120.png`
- `public/tcg/perfect-order/manifest.json`
- bron-sheets in `public/tcg/perfect-order/sheets/`
- `components/TcgCardArt.tsx` gebruikt nu automatisch echte artwork voor Perfect Order kaarten.

## Hoe het werkt

De kaart-ID bepaalt automatisch de afbeelding:

- `po-001` -> `/tcg/perfect-order/po-001.png`
- `po-120` -> `/tcg/perfect-order/po-120.png`

Voor Chaos Rising blijft de bestaande procedural ASORTA art actief totdat daar ook artwork voor is toegevoegd.

## Belangrijk

Deze artwork is ASORTA-original en bedoeld als eigen minigame/collection art. Er worden geen officiële Pokemon kaartafbeeldingen gebruikt.
