import { useState } from 'react'
import { normalizeNoonImageUrl } from '../product-management/utils/common'

export function InTransitProductThumb({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
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
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
