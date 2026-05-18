'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsPageView() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const pathname = usePathname()

  useEffect(() => {
    if (!measurementId || typeof window === 'undefined' || typeof window.gtag !== 'function') return

    window.gtag('event', 'page_view', {
      page_path: `${pathname}${window.location.search || ''}`,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [measurementId, pathname])

  return null
}
