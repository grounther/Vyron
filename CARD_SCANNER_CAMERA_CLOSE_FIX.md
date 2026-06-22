# ASORTA kaartscanner camera close fix

Deze update sluit de camera automatisch zodra de scanner een match heeft gevonden.

## Gedrag

- Auto-scan blijft doorlopen zolang er geen match is.
- Zodra `/api/card-scanner` één of meer resultaten teruggeeft, worden alle camera tracks gestopt.
- De video-preview wordt leeg gemaakt.
- Auto-scan wordt uitgezet.
- Status gaat terug naar idle.
- De gevonden matches blijven zichtbaar.

Geen SQL of env vars nodig.
