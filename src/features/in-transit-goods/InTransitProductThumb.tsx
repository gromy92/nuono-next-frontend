import { useState } from 'react'
import { normalizeNoonImageUrl } from '../product-management/utils/common'

type InTransitProductThumbProps = {
  imageUrl?: string | null
  title: string
  loading?: 'lazy' | 'eager'
}

export function InTransitProductThumb({ imageUrl, title, loading = 'lazy' }: InTransitProductThumbProps) {
  const [failed, setFailed] = useState(false)
  const normalizedImageUrl = normalizeNoonImageUrl(imageUrl)
  if (!normalizedImageUrl || failed) {
    return <span className="in-transit-product-thumb in-transit-product-thumb--empty">无图</span>
  }
  return (
    <img
      className="in-transit-product-thumb"
      src={normalizedImageUrl}
      alt={title}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
