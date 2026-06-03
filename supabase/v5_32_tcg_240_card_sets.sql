-- ASORTA v5.32 - 240-card ASORTA TCG catalog update
-- Run after deploying the code if customers already opened packs on the older 36-card-per-set version.
-- No new tables are required. The card catalog lives in code; this only normalizes old /036 collection numbers to /120.

update public.customer_card_collection
set
  card_number = regexp_replace(card_number, '/036$', '/120'),
  updated_at = now()
where card_number ~ '/036$'
  and (card_id like 'po-%' or card_id like 'cr-%');

-- Historical pack opening JSON is intentionally not rewritten.
-- Those rows are an audit trail of what the customer actually opened at that time.
