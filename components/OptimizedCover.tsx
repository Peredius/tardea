'use client'

import Image from 'next/image'
import { useState } from 'react'

type OptimizedCoverProps = {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}

function canUseNextImage(src: string) {
  if (src.startsWith('/')) return true

  try {
    const hostname = new URL(src).hostname
    return (
      hostname === 'vligprkqsuscppgnawon.supabase.co' ||
      hostname === 'images.unsplash.com'
    )
  } catch {
    return false
  }
}

export function OptimizedCover({
  src,
  alt,
  sizes,
  className = '',
  priority = false,
}: OptimizedCoverProps) {
  const [loaded, setLoaded] = useState(false)
  const imageClassName = `h-full w-full object-cover object-center transition duration-500 ${
    loaded ? 'opacity-100' : 'opacity-0'
  } ${className}`

  if (!canUseNextImage(src)) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={imageClassName}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={68}
      priority={priority}
      onLoad={() => setLoaded(true)}
      className={imageClassName}
    />
  )
}
