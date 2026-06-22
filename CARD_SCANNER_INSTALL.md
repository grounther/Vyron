# ASORTA kaartscanner - automatische herkenning

Deze versie maakt `/card-scanner` automatisch:

- camera starten is genoeg; de scanner loopt daarna zelf iedere paar seconden;
- geen verplichte scan-knop meer;
- gebruikt browser-native `TextDetector`/`BarcodeDetector` wanneer beschikbaar;
- handmatig zoeken en foto-upload blijven fallback;
- zoekt eerst in ASORTA producten/pricing;
- vergelijkt daarnaast met TCGdex Cardmarket-prijsdata zonder API-key;
- toont Cardmarket-trend/avg prijsindicatie wanneer beschikbaar;
- toont een Cardmarket zoeklink om variant, taal en conditie te controleren.

## Belangrijke technische beperking

Cardmarket geeft officieel geen nieuwe API-toegang uit. Direct live Cardmarket ophalen zonder token/limiet is daarom niet betrouwbaar en kan door Cardmarket worden geblokkeerd. Daarom gebruikt ASORTA:

1. eigen product/pricing database als betrouwbare fallback;
2. TCGdex publieke Pokémon TCG API als no-key bron voor kaartcatalogus en Cardmarket prijsindicatie.

## Beste scanresultaat

Voor beste herkenning:

- houd de bovenkant van de kaart scherp in beeld;
- zorg dat kaartnaam en kaartnummer zichtbaar zijn;
- scan bij daglicht of onder felle lamp;
- controleer altijd exacte variant, taal en conditie via de Cardmarket-link.

Geen SQL of env vars nodig.
