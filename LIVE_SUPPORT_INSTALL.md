# ASORTA v5.5.9 live support installatie

Deze versie maakt van de supportfunctie een live 1-op-1 chat tussen klant en Atlas Support.

## Wat is toegevoegd

- Klantchat via server-sent events: `/api/support/conversations/[token]/stream`.
- Atlas live inbox via `/atlas/support`.
- Atlas stream endpoint: `/api/atlas/support/stream`.
- Atlas API om te antwoorden, status te wijzigen en gesloten gesprekken te archiveren.
- Supabase migratie: `supabase/v5_14_true_1on1_live_support_schema.sql`.
- Klantgesprekken blijven privé; de browser praat alleen met Next.js API-routes. Directe publieke Supabase table access wordt uitgezet.

## Na deployen

1. Open Supabase.
2. Ga naar SQL Editor.
3. Run één keer:

```text
supabase/v5_14_true_1on1_live_support_schema.sql
```

## Benodigde environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NEWSLETTER_FROM
```

`RESEND_API_KEY` en `NEWSLETTER_FROM` zijn nodig voor e-mailmeldingen en transcriptmails. Zonder Resend blijft de chat werken, maar mail wordt overgeslagen door de bestaande mailhelper.

## Gebruik

- Klant start een chat via de zwevende supportknop of `/contact`.
- Atlas opent `/atlas/support`.
- Nieuwe klantberichten verschijnen automatisch in Atlas.
- Antwoorden uit Atlas verschijnen automatisch bij de klant.
- Zet een gesprek op `closed` en gebruik daarna `Mail kopie & archiveer` om een transcript naar de klant te sturen en de chat uit de actieve inbox te verwijderen.
