import { PictureOutlined } from '@ant-design/icons'
import { useEffect, useState, type ReactNode } from 'react'
import { normalizeNoonImageUrl } from '../product-management/utils'
import { fetchProductImageAssetMetadata, fetchProductImageAssetPreviewUrl } from './api'
import { isCompleteImageMetadata, isManagedAssetUrl } from './productImageAssetModel'
import { optionalNumber, optionalText } from './productImageProfileConstants'
import type { ProfileAsset } from './productImageProfileTypes'

export function useSystemImagePreviewUrl(imageUrl?: string) {
  const [previewUrl, setPreviewUrl] = useState(imageUrl)

  useEffect(() => {
    if (!imageUrl) {
      setPreviewUrl(undefined)
      return undefined
    }
    if (!imageUrl.startsWith('/api/product-images/assets/')) {
      setPreviewUrl(normalizeNoonImageUrl(imageUrl))
      return undefined
    }

    let objectUrl: string | undefined
    const controller = new AbortController()
    setPreviewUrl(undefined)
    fetchProductImageAssetPreviewUrl(imageUrl, controller.signal)
      .then((nextUrl) => {
        objectUrl = nextUrl
        setPreviewUrl(nextUrl)
      })
      .catch(() => {
        setPreviewUrl(imageUrl)
      })

    return () => {
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [imageUrl])

  return previewUrl
}

export function SystemImage({
  src,
  alt,
  fallback,
  fetchPriority = 'auto',
  onNaturalSize
}: {
  alt: string
  fallback?: ReactNode
  fetchPriority?: 'auto' | 'high' | 'low'
  onNaturalSize?: (widthPx: number, heightPx: number) => void
  src?: string
}) {
  const previewUrl = useSystemImagePreviewUrl(src)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [previewUrl])

  const fallbackNode = fallback ?? <PictureOutlined />
  if (!previewUrl || failed) {
    return fallbackNode
  }
  return (
    <>
      {loaded ? null : fallbackNode}
      <img
        src={previewUrl}
        alt={alt}
        decoding="async"
        fetchPriority={fetchPriority}
        loading="lazy"
        style={{ visibility: loaded ? undefined : 'hidden' }}
        onLoad={(event) => {
          setLoaded(true)
          const { naturalHeight, naturalWidth } = event.currentTarget
          if (naturalWidth > 0 && naturalHeight > 0) {
            onNaturalSize?.(naturalWidth, naturalHeight)
          }
        }}
        onError={() => setFailed(true)}
      />
    </>
  )
}

export function useNearViewportEnabled(rootMargin = '280px') {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (enabled || !node) {
      return undefined
    }
    if (typeof IntersectionObserver === 'undefined') {
      setEnabled(true)
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
        setEnabled(true)
        observer.disconnect()
      }
    }, { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, node, rootMargin])

  return { enabled, ref: setNode }
}

export type AssetMetadataContext = {
  ownerUserId: number
  productMasterId?: number
  storeCode: string
}

export function useAssetPreviewDetail(asset: ProfileAsset | null, metadataContext: AssetMetadataContext) {
  const [detail, setDetail] = useState<{
    contentType?: string
    error?: string
    height?: number
    loading: boolean
    previewUrl?: string
    sizeBytes?: number
    width?: number
  }>({ loading: false })

  useEffect(() => {
    if (!asset?.imageUrl) {
      setDetail({ loading: false })
      return undefined
    }

    let cancelled = false
    let objectUrl: string | undefined
    const controller = new AbortController()
    const storedDetail = {
      contentType: asset.contentType,
      height: asset.heightPx,
      sizeBytes: asset.sizeBytes,
      width: asset.widthPx
    }

    if (isManagedAssetUrl(asset.imageUrl)) {
      setDetail({ ...storedDetail, loading: false })
      fetchProductImageAssetPreviewUrl(asset.imageUrl, controller.signal)
        .then((previewUrl) => {
          if (cancelled) return
          objectUrl = previewUrl
          setDetail({
            ...storedDetail,
            loading: false,
            previewUrl
          })
        })
        .catch((error) => {
          if (cancelled || controller.signal.aborted) return
          setDetail({
            ...storedDetail,
            error: error instanceof Error ? error.message : '图片信息读取失败',
            loading: false
          })
        })
    } else {
      const originalImageUrl = asset.imageUrl
      const productMasterId = metadataContext.productMasterId
      if (isCompleteImageMetadata(storedDetail) || !productMasterId) {
        setDetail({
          ...storedDetail,
          loading: false,
          previewUrl: originalImageUrl
        })
        return () => {
          cancelled = true
          controller.abort()
        }
      }
      setDetail({
        ...storedDetail,
        loading: true,
        previewUrl: originalImageUrl
      })
      fetchProductImageAssetMetadata({
        imageUrl: originalImageUrl,
        ownerUserId: metadataContext.ownerUserId,
        productMasterId,
        storeCode: metadataContext.storeCode
      })
        .then((metadata) => {
          if (cancelled) return
          setDetail({
            contentType: optionalText(metadata.contentType) || storedDetail.contentType,
            height: optionalNumber(metadata.heightPx) || storedDetail.height,
            loading: false,
            previewUrl: originalImageUrl,
            sizeBytes: optionalNumber(metadata.sizeBytes) ?? storedDetail.sizeBytes,
            width: optionalNumber(metadata.widthPx) || storedDetail.width
          })
        })
        .catch((error) => {
          if (cancelled || controller.signal.aborted) return
          setDetail({
            ...storedDetail,
            error: error instanceof Error ? error.message : '图片信息读取失败',
            loading: false,
            previewUrl: originalImageUrl
          })
        })
    }

    return () => {
      cancelled = true
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [
    asset?.contentType,
    asset?.heightPx,
    asset?.id,
    asset?.imageUrl,
    asset?.sizeBytes,
    asset?.widthPx,
    metadataContext.ownerUserId,
    metadataContext.productMasterId,
    metadataContext.storeCode
  ])

  return detail
}
