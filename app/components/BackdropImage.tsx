'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface BackdropImageProps {
  urls: string[]
  alt: string
}

export default function BackdropImage({ urls, alt }: BackdropImageProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (urls.length <= 1) return
    const id = setInterval(() => {
      setIndex(i => (i + 1) % urls.length)
    }, 6000)
    return () => clearInterval(id)
  }, [urls.length])

  if (!urls[0]) return null

  return (
    <Image
      key={urls[index]}
      src={urls[index]}
      alt={alt}
      fill
      className="object-cover transition-opacity duration-1000"
      sizes="100vw"
      priority={index === 0}
    />
  )
}
