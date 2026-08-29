import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SupportWidget from '@/components/SupportWidget'

export const metadata: Metadata = {
  title: {
    default: 'ASORTA Tickets | Veilig tickets kopen en verkopen',
    template: '%s | ASORTA',
  },
  description: 'Het Nederlandse platform voor nieuwe tickets en veilige doorverkoop. Transparante kosten en Nederlandse support.',
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
    title: 'ASORTA Tickets | Veilig tickets kopen en verkopen',
    description: 'Nieuwe tickets en veilige doorverkoop op één Nederlands platform.',
    url: 'https://asorta.nl',
    siteName: 'ASORTA',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASORTA Tickets | Veilig tickets kopen en verkopen',
    description: 'Nieuwe tickets en veilige doorverkoop op één Nederlands platform.',
  },
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="nl"><body><Header/>{children}<Footer/><SupportWidget/></body></html>
}
