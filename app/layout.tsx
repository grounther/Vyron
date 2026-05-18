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
    default: 'ASORTA | Smart utility products',
    template: '%s | ASORTA',
  },
  description: 'ASORTA is een premium modern utility shop voor slimme dagelijkse producten, automotive upgrades, desk setup, gaming, tactical carry en outdoor essentials.',
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
    title: 'ASORTA | Smart utility products',
    description: 'Premium utility products geselecteerd op bruikbaarheid, uitstraling en kwaliteit.',
    url: 'https://asorta.nl',
    siteName: 'ASORTA',
    type: 'website',
    locale: 'nl_NL',
    images: [{ url: '/asorta-icon.png', width: 512, height: 512, alt: 'ASORTA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASORTA | Smart utility products',
    description: 'Premium utility products geselecteerd op bruikbaarheid, uitstraling en kwaliteit.',
    images: ['/asorta-icon.png'],
  },
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="nl"><body><GoogleAnalytics/><AnalyticsPageView/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: stringifyJsonLd(organizationJsonLd())}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: stringifyJsonLd(websiteJsonLd())}}/><Header/>{children}<Footer/><SupportWidget/></body></html>
}
