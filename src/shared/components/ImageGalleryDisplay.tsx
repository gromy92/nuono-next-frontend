import { Image } from 'antd'
import type { CSSProperties, KeyboardEvent } from 'react'
import { useState } from 'react'

type ImageGalleryVariant = 'grid' | 'compact'
type ImageGalleryLabelPlacement = 'overlay' | 'below'

type ImageGalleryDisplayProps = {
  images: string[]
  altPrefix: string
  fallback?: string
  getLabel?: (index: number) => string
  imageHeight?: number
  imageWidth?: number
  labelPlacement?: ImageGalleryLabelPlacement
  labelTestId?: string
  minCardWidth?: number
  onOpenImage?: (index: number) => void
  preview?: boolean
  testId?: string
  variant?: ImageGalleryVariant
  visibleCount?: number
}

const CARD_STYLE: CSSProperties = {
  background: 'var(--nuono-image-gallery-bg, var(--pm-subtle-bg, #f8fafc))',
  border: '1px solid var(--nuono-image-gallery-border, var(--pm-subtle-border, #edf0f4))',
  borderRadius: 8,
  overflow: 'hidden',
  padding: 0,
  position: 'relative',
  textAlign: 'left'
}

const OVERLAY_STYLE: CSSProperties = {
  background: 'rgba(15, 23, 42, 0.62)',
  color: '#ffffff',
  fontSize: 12,
  inset: 'auto 0 0 0',
  lineHeight: '18px',
  overflow: 'hidden',
  padding: '6px 8px',
  position: 'absolute',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}

const BELOW_LABEL_STYLE: CSSProperties = {
  borderTop: '1px solid var(--nuono-image-gallery-border, var(--pm-subtle-border, #edf0f4))',
  color: 'var(--nuono-image-gallery-label, var(--pm-text-muted, #4b5563))',
  fontSize: 12,
  lineHeight: '18px',
  overflow: 'hidden',
  padding: '4px 6px',
  textAlign: 'center',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}

export function ImageGalleryDisplay(props: ImageGalleryDisplayProps) {
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const {
    altPrefix,
    fallback,
    getLabel,
    imageHeight,
    imageWidth,
    labelPlacement = 'overlay',
    labelTestId,
    minCardWidth = 180,
    onOpenImage,
    preview = !onOpenImage,
    testId,
    variant = 'grid',
    visibleCount
  } = props
  const images = props.images.filter(Boolean)
  const visibleImages = typeof visibleCount === 'number' ? images.slice(0, visibleCount) : images
  const height = imageHeight ?? (variant === 'compact' ? 92 : 220)
  const cardWidth = imageWidth ?? (variant === 'compact' ? height : undefined)
  const canOpenInternalPreview = preview && !onOpenImage
  const canOpenImage = Boolean(onOpenImage || canOpenInternalPreview)
  const containerStyle: CSSProperties =
    variant === 'compact'
      ? { display: 'inline-grid', gap: 8, width: cardWidth }
      : { display: 'grid', gap: 12, gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }

  const renderCard = (url: string, index: number) => {
    const label = getLabel?.(index)
    const cardStyle: CSSProperties = {
      ...CARD_STYLE,
      cursor: canOpenImage ? 'pointer' : undefined,
      width: cardWidth
    }
    const openImage = () => {
      if (onOpenImage) {
        onOpenImage(index)
        return
      }
      if (canOpenInternalPreview) {
        setPreviewIndex(index)
        setPreviewVisible(true)
      }
    }
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!canOpenImage) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openImage()
      }
    }

    return (
      <div
        key={`${url}-${index}`}
        data-testid={testId}
        role={canOpenImage ? 'button' : undefined}
        tabIndex={canOpenImage ? 0 : undefined}
        onClick={canOpenImage ? openImage : undefined}
        onKeyDown={handleKeyDown}
        style={cardStyle}
      >
        <div style={{ background: 'var(--nuono-image-gallery-bg, var(--pm-subtle-bg, #f8fafc))', minHeight: height, position: 'relative' }}>
          <img
            alt={`${altPrefix} ${index + 1}`}
            src={url || fallback}
            style={{ display: 'block', height, objectFit: 'cover', width: '100%' }}
          />
          {label && labelPlacement === 'overlay' ? <div data-testid={labelTestId} style={OVERLAY_STYLE}>{label}</div> : null}
        </div>
        {label && labelPlacement === 'below' ? <div data-testid={labelTestId} style={BELOW_LABEL_STYLE}>{label}</div> : null}
      </div>
    )
  }

  if (!images.length) {
    return null
  }

  const body = <div style={containerStyle}>{visibleImages.map(renderCard)}</div>
  if (!canOpenInternalPreview) {
    return body
  }

  return (
    <>
      {body}
      <Image.PreviewGroup
        items={images}
        preview={{
          current: previewIndex,
          visible: previewVisible,
          onVisibleChange: (visible) => setPreviewVisible(visible)
        }}
      >
        <Image src={images[previewIndex] || fallback} style={{ display: 'none' }} />
      </Image.PreviewGroup>
    </>
  )
}
