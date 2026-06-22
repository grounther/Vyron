# ASORTA kaartscanner - Pokemonkaart.nl waardebron

Deze update maakt de kaartscanner sterker:

- automatische camera-scan blijft actief;
- `/api/card-scanner` zoekt eerst in ASORTA producten/pricing;
- daarna zoekt hij op `pokemonkaart.nl` naar kaartpagina's;
- kaartpagina's worden gecachet via Next fetch revalidate, zodat scans niet elke keer opnieuw de bron belasten;
- TCGdex blijft fallback wanneer Pokemonkaart.nl geen match geeft;
- geen API keys, tokens of nieuwe environment variables nodig.

## Bronvolgorde

1. ASORTA eigen product- en prijsdata
2. Pokemonkaart.nl dagelijkse marktprijs
3. TCGdex fallback

## Belangrijk

Pokemonkaart.nl is een externe website. De scanner gebruikt publieke pagina's en cachet resultaten. Als de HTML-structuur van die website verandert, kan de parser later aangepast moeten worden.

## Testen

Na deploy:

1. Ga naar `/card-scanner`.
2. Start camera.
3. Houd kaartnaam + kaartnummer scherp in beeld.
4. Controleer of resultaten met bron `Pokemonkaart.nl dagelijkse marktprijs` verschijnen.

Geen SQL nodig.
