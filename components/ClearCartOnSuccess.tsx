'use client'

import { useEffect } from 'react'

export default function ClearCartOnSuccess() {
  useEffect(() => {
    localStorage.removeItem('asorta_cart')
  }, [])

  return null
}
