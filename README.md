# ASORTA Woningruil

Nederlands platform voor huurders die veilig en gericht van woning willen ruilen.

## Stack

- Next.js 16
- TypeScript en Tailwind CSS
- Supabase voor accounts, woningen, matches, chat en live support
- Mollie voor iDEAL en andere Nederlandse betaalmethoden
- Vercel deployment

## Lokaal starten

```bash
npm install
npm run dev
```

Voer de SQL-bestanden in `supabase/` op versienummer uit. Voor woningruil voer je eerst `v8_0_housing_swap_foundation.sql` uit, daarna `v8_1_admin_operations.sql`, `v8_2_housing_staff_permissions.sql`, `v8_3_search_profile_and_users.sql`, `v8_4_national_housing_providers.sql`, `v8_5_cash_search_passes.sql`, `v8_6_cash_listing_activation.sql` en vervolgens `v8_8_free_trial.sql`. De bestaande ticket-tabellen blijven voorlopig alleen als archief bestaan.

Versie 8.1 voegt Atlas-beheer toe voor fotomoderatie, rapportages, blokkades, Mollie-refunds, privacyverzoeken, corporatievoorstellen en auditlogging. Nieuwe woningfoto's zijn pas openbaar nadat een bevoegde beheerder ze heeft goedgekeurd.

Versie 8.2 vervangt de oude webshop- en ticketrechten door acht taakgerichte woningruilrechten. Oude Atlas-beheerpagina's worden niet meer aangeboden en bestaande medewerkers worden door de migratie veilig overgezet.

Versie 8.3 repareert het opslaan van optionele zoekwensen, slaat het volledige zoekprofiel atomair op en gebruikt PDOK voor plaatsnaamsuggesties. Atlas krijgt daarnaast apart gebruikersbeheer met profielwijzigingen, zoekprofielstatus, blokkades en auditlogging.

Versie 8.4 vult de verhuurderkeuze met alle unieke actuele corporatienamen uit het landelijke ILT-register. Het plaatsingsformulier heeft een doorzoekbare keuzelijst, bevat De Woningzoeker als herkenbaar woonruimteplatform en houdt “Andere verhuurder” beschikbaar zodat een ontbrekende naam niemand blokkeert.

Versie 8.5 laat bevoegde Atlas-beheerders een zoekpas na ontvangst van €5 contant activeren of met 365 dagen verlengen. De contante transactie verschijnt in Betalingen, de gebruiker krijgt een melding en de beheeractie wordt vastgelegd in het auditlog.

Versie 8.6 voegt in dezelfde gebruikerskaart de contante €2-activering voor een woningplaatsing toe. Na bevestiging wordt de betaling geregistreerd, gaat de woning direct live en start de gebruikelijke herbevestigingstermijn van 90 dagen.

Versie 8.7 maakt het grote beeld op de homepage volledig datagestuurd. Een ingelogde gebruiker ziet bij voorkeur een willekeurige woning uit diens wederzijdse matches, daarna de eigen actieve woning en anders een willekeurige beschikbare woning. Zonder echte woningen toont de site een lege toestand in plaats van voorbeelddata. De oude webshop-, Pokémon-, ticket-, evenementen- en organisatorbroncode is uit de actieve applicatie verwijderd. Bekende oude URL's worden permanent doorgestuurd naar de relevante woningruilpagina; gepensioneerde API-routes antwoorden met HTTP 410.

Versie 8.8 geeft nieuwe én bij introductie bestaande gebruikers 30 dagen gratis zoek- en matchtoegang. Tijdens die proefperiode kunnen zij zoekprofielen gebruiken, wederzijdse matches ontvangen en woningdetails bekijken. Reageren, privéchatten en een ruilproces starten blijven technisch vergrendeld tot de zoekpas van €5 is betaald. Een betaalde pas blijft 365 dagen geldig en wordt niet automatisch verlengd.

Versie 8.9 legt op de tarievenpagina transparant uit dat registreren gratis is, waarom de plaatsingsbijdrage van €2 helpt om het woningaanbod serieus en actueel te houden en welke techniek, beveiliging en ondersteuning met de zoekpas van €5 worden onderhouden.

## Vercel-variabelen

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://asorta.nl
MOLLIE_API_KEY=test_...
RESEND_API_KEY=
NEWSLETTER_FROM=ASORTA <info@asorta.nl>
CRON_SECRET=
```

Begin altijd met een Mollie test-key. Zet pas na een volledige proefbestelling een live-key in productie.

`CRON_SECRET` beschermt de dagelijkse controle van verlopen zoekpassen en woningen die opnieuw bevestigd moeten worden.
