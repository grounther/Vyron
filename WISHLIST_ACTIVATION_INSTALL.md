# ASORTA Wishlist Activation v6.4.6

This patch activates customer wishlist behavior.

## Added

- `/api/account/wishlist` API route.
- Product page wishlist button.
- Account page wishlist list.
- Wishlist remove action.
- Supabase migration `supabase/v5_25_customer_wishlist.sql`.

## Install

Run the migration in Supabase SQL Editor:

```sql
supabase/v5_25_customer_wishlist.sql
```

Then deploy the code.

## Test

1. Log in as a customer.
2. Open a product page.
3. Click **Add to wishlist**.
4. Open `/account`.
5. Confirm the product is visible under Wishlist.
6. Remove it and confirm the count updates after refresh.
