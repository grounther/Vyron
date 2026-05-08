'use client'

import { useState } from 'react'

const fallback = '/products/asorta-product-fallback.svg'

export default function ProductImage({src, alt, className}:{src:string; alt:string; className?:string}){
  const [imageSrc,setImageSrc] = useState(src || fallback)
  return <img
    src={imageSrc}
    alt={alt}
    loading="lazy"
    className={className}
    onError={()=>setImageSrc(fallback)}
  />
}
