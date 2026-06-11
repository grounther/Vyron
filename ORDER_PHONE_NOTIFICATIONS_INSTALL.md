# ASORTA ordermeldingen op telefoon

Deze update stuurt automatisch een interne melding zodra een order echt betaald en verwerkt is via de bestaande checkout finalization. Pending, geannuleerde of mislukte Mollie-betalingen sturen geen ordermelding.

## Supabase

Draai één keer:

```sql
supabase/v5_43_order_phone_notifications.sql
```

Deze migratie maakt `order_notification_events` aan voor idempotente logging, zodat dezelfde betaalde order niet steeds opnieuw een telefoonmelding stuurt.

## Vercel Environment Variables

Kies minimaal één kanaal.

### Optie 1: Telegram

Zet in Vercel:

```env
ORDER_NOTIFY_TELEGRAM_BOT_TOKEN=123456:abc...
ORDER_NOTIFY_TELEGRAM_CHAT_ID=123456789
```

Meerdere chat-id's kunnen ook:

```env
ORDER_NOTIFY_TELEGRAM_CHAT_IDS=123456789,987654321
```

### Optie 2: Pushover

Zet in Vercel:

```env
ORDER_NOTIFY_PUSHOVER_APP_TOKEN=app_token
ORDER_NOTIFY_PUSHOVER_USER_KEY=user_key
```

Meerdere user keys kunnen ook:

```env
ORDER_NOTIFY_PUSHOVER_USER_KEYS=user_key_1,user_key_2
```

### Optie 3: interne e-mail als extra fallback

Als `RESEND_API_KEY` al actief is:

```env
ORDER_NOTIFY_EMAIL=o.kelder.raalte@gmail.com
```

Meerdere ontvangers:

```env
ORDER_NOTIFY_EMAILS=o.kelder.raalte@gmail.com,klantenservice@asorta.nl
```

## Wanneer wordt een melding gestuurd?

Alleen bij `payment_status = paid`, nadat deze bestaande verwerking klaar is:

- voorraad aftrekken;
- TCG pack credit toekennen;
- fulfillment naar verwerking;
- boekhoudregel synchroniseren;
- orderlog vastleggen.

De melding bevat ordernummer, totaalbedrag, klant, e-mail, betaalmethode, adres, producten en een Atlas-link.
