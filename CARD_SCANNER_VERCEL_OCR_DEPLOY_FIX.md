# ASORTA kaartscanner - Vercel OCR deploy fix

Deze buildfix verwijdert `tesseract.js` uit `package.json` en `package-lock.json`.

Waarom:

- Vercel faalde tijdens `npm install` op de extra OCR dependency-chain van `tesseract.js`, o.a. `zlibjs`.
- De scanner gebruikt nu lazy browser-OCR via CDN wanneer native `TextDetector` niet beschikbaar is.
- Daardoor hoeft Vercel geen OCR packages meer te installeren.

Scanner-gedrag blijft hetzelfde:

- camera start;
- kaart in frame wordt automatisch geanalyseerd;
- bovenkant wordt gebruikt voor kaartnaam;
- onderkant wordt gebruikt voor collector/setnummer;
- ASORTA + Pokemonkaart.nl + TCGdex matching blijft actief.

Geen SQL nodig.
Geen nieuwe env vars nodig.
