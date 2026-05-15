# ASORTA v6.2.3 Shopify discount checkout hotfix

This patch adds a discount-code field to the ASORTA checkout screen and forwards the code to Shopify checkout via the cart permalink `discount=CODE` query parameter.

Changed files:

- `app/checkout/CheckoutClient.tsx`
- `app/api/checkout/shopify/route.ts`
- `app/api/checkout/route.ts`
- `lib/shopify/checkout.ts`

Behavior:

- Customer can enter a discount code, for example `GRANDOPENING10`.
- The code is normalized, stored in `localStorage` as `asorta_discount_code`, and sent to `/api/checkout/shopify`.
- Shopify checkout URL receives `discount=GRANDOPENING10`.
- Shopify remains the source of truth for whether the code is valid and how much discount is applied.

Important:

The discount code must exist in Shopify Admin > Discounts. This patch does not create discounts in Shopify.
