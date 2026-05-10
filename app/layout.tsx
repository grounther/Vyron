import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'ASORTA | Just what you need.',
  description: 'ASORTA is een premium modern utility shop voor smart daily gear, automotive upgrades, desk setup, gaming, tactical carry en outdoor essentials.',
  metadataBase: new URL('https://asorta.nl'),
  icons: { icon: '/asorta-icon.png', apple: '/asorta-icon.png' },
  openGraph: {
    title: 'ASORTA | Just what you need.',
    description: 'Premium utility products geselecteerd op bruikbaarheid, uitstraling en kwaliteit.',
    url: 'https://asorta.nl',
    siteName: 'ASORTA',
    type: 'website'
  }
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><Header/>{children}<Footer/></body></html>
}
