import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { useState } from 'react'
import { normalizeProductImageUrl } from './productImageUrl'

export type ProductImageThumbProps = {
  src?: string | null
  alt: string
  imageCount?: number
  width?: CSSProperties['width']
  fit?: CSSProperties['objectFit']
  fallback?: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

export function ProductImageThumb({
  src,
  alt,
  imageCount = 0,
  width = 96,
  fit = 'cover',
  fallback = '无图',
  onClick,
  disabled
}: ProductImageThumbProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const normalizedSrc = normalizeProductImageUrl(src)
  const visibleSrc = normalizedSrc && failedSrc !== normalizedSrc ? normalizedSrc : undefined
  const visibleImageCount = Math.max(visibleSrc ? 1 : 0, imageCount)
  const clickable = Boolean(onClick && visibleSrc && !disabled)
  const content = visibleSrc ? (
    <span style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}>
      <img
        src={visibleSrc}
        alt={alt}
        onError={() => setFailedSrc(visibleSrc)}
        style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', display: 'block' }}
      />
      {visibleImageCount > 0 ? (
        <span
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            zIndex: 1,
            padding: '1px 5px',
            borderRadius: 4,
            color: '#ffffff',
            background: 'rgba(15, 23, 42, 0.72)',
            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.22)',
            fontSize: 11,
            lineHeight: '16px'
          }}
        >
          {visibleImageCount}
        </span>
      ) : null}
    </span>
  ) : (
    <span
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: 11,
        background: '#f8fafc'
      }}
    >
      {fallback}
    </span>
  )

  const frameStyle = {
    width,
    aspectRatio: '0.73',
    flex: '0 0 auto',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    background: '#ffffff'
  } satisfies CSSProperties

  if (!onClick) {
    return <span style={{ ...frameStyle, display: 'inline-flex' }}>{content}</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-label={visibleImageCount > 0 ? `查看商品图片，共 ${visibleImageCount} 张` : '查看商品图片'}
      style={{
        ...frameStyle,
        padding: 0,
        cursor: clickable ? 'pointer' : 'default'
      }}
    >
      {content}
    </button>
  )
}
