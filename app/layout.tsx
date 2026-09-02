import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SupportWidget from '@/components/SupportWidget'

export const metadata: Metadata = {
  title: {
    default: 'ASORTA Woningruil | Plaatsen, matchen, ruilen',
    template: '%s | ASORTA',
  },
  description: 'Vind automatisch huurders die jouw woning zoeken en een woning aanbieden die bij jou past.',
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
    title: 'ASORTA Woningruil | Plaatsen, matchen, ruilen',
    description: 'Slimme wederzijdse matches voor huurders in Nederland.',
    url: 'https://asorta.nl',
    siteName: 'ASORTA',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASORTA Woningruil | Plaatsen, matchen, ruilen',
    description: 'Slimme wederzijdse matches voor huurders in Nederland.',
  },
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="nl"><body><Header/>{children}<Footer/><SupportWidget/></body></html>
}
