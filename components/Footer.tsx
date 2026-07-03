import { categories } from '@/lib/products'
import { categoryName } from '@/lib/i18n/config'
import { getServerLocale } from '@/lib/i18n/server'
import { getSiteContent, splitLines } from '@/lib/site-content'
import FooterClient from './FooterClient'

export default async function Footer() {
  const [locale, content] = await Promise.all([getServerLocale(), getSiteContent()])
  const trust = [
    { icon: 'Lock' as const, title: content['footer.trust1.title'], text: content['footer.trust1.text'] },
    { icon: 'BadgeCheck' as const, title: content['footer.trust2.title'], text: content['footer.trust2.text'] },
    { icon: 'Truck' as const, title: content['footer.trust3.title'], text: content['footer.trust3.text'] },
    { icon: 'Headphones' as const, title: content['footer.trust4.title'], text: content['footer.trust4.text'] },
  ]
  const payments = splitLines(content['footer.payments'])
  const tcgLinks = categories.slice(0, 3).map((category) => ({
    href: `/category/${category.slug}`,
    label: categoryName(locale, category.slug, category.name),
  }))

  return (
    <FooterClient
      trust={trust}
      payments={payments}
      supportTitle={content['footer.supportTitle']}
      paymentsTitle={content['footer.paymentsTitle']}
      copyright={content['footer.copyright']}
      tcgLinks={tcgLinks}
    />
  )
}
