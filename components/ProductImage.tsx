'use client'

import { useEffect, useState } from 'react'

const fallback = '/products/asorta-product-fallback.svg'

export default function ProductImage({src, alt, className}:{src:string; alt:string; className?:string}){
  const safeSrc = src || fallback
  const [imageSrc,setImageSrc] = useState(safeSrc)

  useEffect(()=>{
    setImageSrc(safeSrc)
  },[safeSrc])

  return <img
    src={imageSrc}
    alt={alt}
    loading="lazy"
    className={className}
    onError={()=>setImageSrc(fallback)}
  />
}
