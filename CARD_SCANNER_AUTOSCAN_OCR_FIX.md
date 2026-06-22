# ASORTA kaartscanner autoscan/OCR fix

Deze update maakt de kaartscanner echt automatisch:

- Zodra de camera loopt, analyseert de scanner automatisch cameraframes.
- Er wordt apart gekeken naar:
  - bovenkant van de kaart voor de kaartnaam;
  - onderkant van de kaart voor collector number / setnummer.
- De scanner gebruikt browser-native herkenning wanneer beschikbaar.
- Als de browser geen `TextDetector` ondersteunt, laadt hij client-side OCR via `tesseract.js`.
- Dit gebruikt geen API-token en geen betaalde OCR-limiet; de herkenning draait op het apparaat van de bezoeker.
- De herkende naam + nummer worden automatisch als zoekquery gebruikt richting ASORTA/Pokemonkaart.nl/TCGdex.

## Geen SQL nodig

Er zijn geen database-wijzigingen nodig.

## Nieuwe dependency

```bash
npm install
```

De dependency `tesseract.js` staat in `package.json` en wordt door Vercel automatisch geïnstalleerd.

## Praktische scantips

Voor beste resultaat:

- kaart recht in beeld;
- goede verlichting;
- naam bovenaan scherp;
- setnummer/kaartnummer onderaan scherp;
- liever geen hoesje met veel reflectie.
