import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
export const metadata: Metadata = { title: 'VYRON | Engineered for Modern Utility', description: 'Premium tactical, automotive, gaming, desk setup and smart utility gear.' }
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/>{children}<Footer/></body></html>}
