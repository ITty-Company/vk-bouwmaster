'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { resolveUploadUrlForClient, shouldUnoptimizeUploadImage } from '@/lib/upload-public-url'

const FALLBACK = '/vk-bouwmaster-logo.svg'

type Props = Omit<ImageProps, 'src' | 'onError'> & {
  src: string | undefined | null
}

/** Работы и загрузки: корректный URL на проде + запасной кадр, если файла нет на диске. */
export function UploadFallbackImage({ src, alt, unoptimized, ...props }: Props) {
  const [failed, setFailed] = useState(false)
  const resolved = resolveUploadUrlForClient(src)
  const finalSrc = failed || !resolved ? FALLBACK : resolved

  return (
    <Image
      {...props}
      src={finalSrc}
      alt={alt}
      unoptimized={unoptimized ?? shouldUnoptimizeUploadImage(finalSrc)}
      onError={() => setFailed(true)}
    />
  )
}
