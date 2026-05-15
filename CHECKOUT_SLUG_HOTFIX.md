# ASORTA v6.2.1 Checkout Slug Hotfix

Fix voor Shopify/PayPal checkout waarbij oudere cart-items een variantstuk in de slug hadden, bijvoorbeeld:

```txt
product-slug__14:771#Style 1
```

De checkout normaliseert nu de cart-slug naar de basis productslug en gebruikt de Shopify variant ID direct wanneer die al in het cart-item zit. Daardoor hoeft de checkout niet meer exact de volledige cart-key als Supabase slug te vinden.

Aangepast bestand:

```txt
lib/shopify/checkout.ts
```

Na installatie:

```powershell
npm run dev
```

Daarna opnieuw checkout proberen. Je hoeft de cart meestal niet meer te legen, maar als je nog oude data ziet kun je in de browserconsole dit doen:

```js
localStorage.removeItem('asorta_cart')
location.href = '/shop'
```
