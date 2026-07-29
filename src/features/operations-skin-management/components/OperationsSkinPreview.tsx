import { Image, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { fetchOperationsSkinAssetPreviewUrl, isOperationsSkinAssetUrl } from '../api'
import type { OperationsSkinGalleryRow } from '../skinGalleryRows'
import { hasConfiguredSkinComponents } from '../skinPreview'
import { HERO_MAIN_COMPONENT_SLOT_GROUP, mergeOperationsSkinComponentSlots } from '../skinDetailSuites'
import type { OperationsSkinComponentView } from '../types'
import { skinCover } from '../skinPageModel'

const { Text } = Typography

export type OperationsSkinImageProps = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

export function OperationsSkinImage({ src, alt, width, height, className }: OperationsSkinImageProps) {
  const [previewSrc, setPreviewSrc] = useState(src)

  useEffect(() => {
    setPreviewSrc(src)
    if (!isOperationsSkinAssetUrl(src)) {
      return undefined
    }

    let activeObjectUrl = ''
    let cancelled = false
    const controller = new AbortController()
    void fetchOperationsSkinAssetPreviewUrl(src, controller.signal)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        activeObjectUrl = objectUrl
        setPreviewSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewSrc(src)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl)
      }
    }
  }, [src])

  return <Image className={className} src={previewSrc} alt={alt} width={width} height={height} />
}

export type OperationsSkinLayerImageProps = {
  src: string
  alt: string
}

export function OperationsSkinLayerImage({ src, alt }: OperationsSkinLayerImageProps) {
  const [previewSrc, setPreviewSrc] = useState(src)

  useEffect(() => {
    setPreviewSrc(src)
    if (!isOperationsSkinAssetUrl(src)) {
      return undefined
    }

    let activeObjectUrl = ''
    let cancelled = false
    const controller = new AbortController()
    void fetchOperationsSkinAssetPreviewUrl(src, controller.signal)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        activeObjectUrl = objectUrl
        setPreviewSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewSrc(src)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl)
      }
    }
  }, [src])

  return <img src={previewSrc} alt={alt} draggable={false} />
}

export type OperationsSkinComponentCompositePreviewProps = {
  components?: OperationsSkinComponentView[] | null
  compact?: boolean
  emptyText?: string
  templateRole?: string
}

export function OperationsSkinComponentCompositePreview({
  components,
  compact,
  emptyText = '未配置组件',
  templateRole = HERO_MAIN_COMPONENT_SLOT_GROUP.templateRole
}: OperationsSkinComponentCompositePreviewProps) {
  const layers = mergeOperationsSkinComponentSlots(components)
    .filter((component) => component.templateRole === templateRole)
    .filter((component) => component.imageUrl?.trim())
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  if (!layers.length) {
    return (
      <div className={`operations-skin-component-preview operations-skin-component-preview--empty${compact ? ' operations-skin-component-preview--compact' : ''}`}>
        <Text type="secondary">{emptyText}</Text>
      </div>
    )
  }

  return (
    <div className={`operations-skin-component-preview${compact ? ' operations-skin-component-preview--compact' : ''}`}>
      <div className="operations-skin-component-canvas">
        {layers.map((component) => {
          const imageUrl = component.imageUrl?.trim()
          if (!imageUrl) return null
          return (
            <div
              className="operations-skin-component-layer"
              key={component.componentKey}
              style={{
                left: `${((component.x ?? 0) / 1247) * 100}%`,
                top: `${((component.y ?? 0) / 1706) * 100}%`,
                width: `${((component.width ?? 0) / 1247) * 100}%`,
                height: `${((component.height ?? 0) / 1706) * 100}%`,
                zIndex: component.zIndex ?? 0
              }}
            >
              <OperationsSkinLayerImage src={imageUrl} alt={component.componentKey} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type OperationsSkinPreviewProps = {
  row: OperationsSkinGalleryRow
}

export function OperationsSkinPreview({ row }: OperationsSkinPreviewProps) {
  if (hasConfiguredSkinComponents(row)) {
    return (
      <div className="operations-skin-card-preview operations-skin-card-preview--image">
        <OperationsSkinComponentCompositePreview components={row.components} compact />
      </div>
    )
  }
  const cover = skinCover(row)
  if (cover) {
    return (
      <div className="operations-skin-card-preview operations-skin-card-preview--image">
        <OperationsSkinImage src={cover} alt={row.skinName} width={220} height={260} />
      </div>
    )
  }

  return (
    <div className={`operations-skin-card-preview operations-skin-card-preview--${row.previewTone}`} aria-hidden="true">
      <div className="operations-skin-preview-device">
        <div className="operations-skin-preview-topbar" />
        <div className="operations-skin-preview-subject" />
        <div className="operations-skin-preview-shelf">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
