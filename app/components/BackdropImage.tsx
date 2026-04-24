'use client'

import { useMemo } from 'react'
import Image from 'next/image'

interface BackdropImageProps {
  urls: string[]
  alt: string
}

export default function BackdropImage({ urls, alt }: BackdropImageProps) {
  const src = useMemo(
    () => urls[Math.floor(Math.random() * urls.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  if (!src) return null

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="100vw"
      priority
    />
  )
}
