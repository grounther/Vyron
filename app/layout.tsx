import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SupportWidget from '@/components/SupportWidget'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import AnalyticsPageView from '@/components/AnalyticsPageView'
import { organizationJsonLd, stringifyJsonLd, websiteJsonLd } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: {
    default: 'ASORTA | Pokemon TCG, Collectibles & Events',
    template: '%s | ASORTA',
  },
  description: 'ASORTA is een Pokemon TCG shop voor trading cards, collectibles, sealed producten, eigen voorraad en markt/events verkoop.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://asorta.nl'),
  icons: { icon: '/asorta-icon.png', apple: '/asorta-icon.png' },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  openGraph: {
    title: 'ASORTA | Pokemon TCG, Collectibles & Events',
    description: 'Pokemon TCG, sealed producten, collectibles en marktdeals uit eigen voorraad.',
    url: 'https://asorta.nl',
    siteName: 'ASORTA',
    type: 'website',
    locale: 'nl_NL',
    images: [{ url: '/asorta-tcg-hero.jpeg', width: 1536, height: 768, alt: 'ASORTA Trading Cards Collectibles Events' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASORTA | Pokemon TCG, Collectibles & Events',
    description: 'Pokemon TCG, sealed producten, collectibles en marktdeals uit eigen voorraad.',
    images: ['/asorta-tcg-hero.jpeg'],
  },
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="nl"><body><GoogleAnalytics/><AnalyticsPageView/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: stringifyJsonLd(organizationJsonLd())}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: stringifyJsonLd(websiteJsonLd())}}/><Header/>{children}<Footer/><SupportWidget/></body></html>
}
