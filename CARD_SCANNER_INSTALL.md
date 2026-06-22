# ASORTA kaartscanner

Deze update voegt een kaartwaarde-scanner toe zonder externe AI/API tokens.

## Nieuwe publieke route

- `/card-scanner`

De scanner gebruikt:

- camera-preview in de browser;
- browser-native `TextDetector` en `BarcodeDetector` als de browser/device dit ondersteunt;
- handmatige zoekfallback die altijd blijft werken;
- ASORTA's eigen `products`/pricing velden als bron voor waarde.

## Nieuwe API route

- `/api/card-scanner?q=...`

Deze route zoekt server-side in Supabase `products` met de service role en geeft alleen publieke/pricing scanner velden terug.

## Geen externe limieten

Er wordt geen Cardmarket/TCGplayer/OCR/AI API aangeroepen. De getoonde waarde komt uit je eigen database:

- `market_value`
- `suggested_price`
- `price`
- `market_source`
- `condition_label`
- `sealed_status`
- voorraadvelden
- `cardmarket_url`

## Belangrijk voor waardes

Voor beste resultaten: voeg losse kaarten als product toe in Atlas en vul de Cardmarket paste-helper of handmatige marktwaarde in bij Prijsbeheer.

## Geen SQL nodig

Deze update gebruikt bestaande product/pricing velden. Er hoeft geen nieuwe SQL gedraaid te worden.
