export const NOON_IMAGE_MIN_WIDTH = 660
export const NOON_IMAGE_TARGET_ASPECT_RATIO = 0.73
export const NOON_IMAGE_ASPECT_RATIO_TOLERANCE = 0.02

export type NoonImageDimensions = {
  width?: number
  height?: number
}

export type NoonImageAssetMetadata = NoonImageDimensions & {
  imageUrl: string
  sourceWidth?: number
  sourceHeight?: number
  aspectRatio?: number
  noonReady?: boolean
  adapted?: boolean
  adaptationTargetWidth?: number
  adaptationTargetHeight?: number
  sourceTooSmall?: boolean
}

export type NoonImageAdaptTarget = {
  width: number
  height: number
  sourceTooSmall: boolean
}

export type NoonImageEvaluation = {
  status: 'ready' | 'blocked' | 'unknown'
  code?: 'dimension_missing' | 'width_too_small' | 'aspect_ratio_mismatch'
  message: string
  aspectRatio?: number
}

export function selectNoonImageAdaptTarget(dimensions: NoonImageDimensions): NoonImageAdaptTarget {
  const width = positiveNumber(dimensions.width) ?? 0
  if (width >= 900) {
    return { width: 1247, height: 1706, sourceTooSmall: false }
  }
  return { width: 660, height: 904, sourceTooSmall: width > 0 && width < NOON_IMAGE_MIN_WIDTH }
}

export function evaluateNoonImageDimensions(dimensions: NoonImageDimensions): NoonImageEvaluation {
  const width = positiveNumber(dimensions.width)
  const height = positiveNumber(dimensions.height)
  if (!width || !height) {
    return {
      status: 'unknown',
      code: 'dimension_missing',
      message: '未读取图片尺寸'
    }
  }

  const aspectRatio = roundAspectRatio(width / height)
  if (width < NOON_IMAGE_MIN_WIDTH) {
    return {
      status: 'blocked',
      code: 'width_too_small',
      message: `宽度 ${width}px，低于 Noon 最低 ${NOON_IMAGE_MIN_WIDTH}px`,
      aspectRatio
    }
  }
  if (Math.abs(width / height - NOON_IMAGE_TARGET_ASPECT_RATIO) > NOON_IMAGE_ASPECT_RATIO_TOLERANCE) {
    return {
      status: 'blocked',
      code: 'aspect_ratio_mismatch',
      message: `比例 ${aspectRatio}，不符合 Noon 0.73`,
      aspectRatio
    }
  }
  return {
    status: 'ready',
    message: `符合 Noon 图片要求 ${width}x${height}`,
    aspectRatio
  }
}

export function normalizeNoonImageAssetMetadata(
  imageUrls: unknown,
  metadata: unknown
): NoonImageAssetMetadata[] {
  const activeImages = normalizeStringList(imageUrls)
  const byUrl = new Map<string, NoonImageAssetMetadata>()
  if (Array.isArray(metadata)) {
    metadata.forEach((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return
      }
      const record = item as Record<string, unknown>
      const imageUrl = text(record.imageUrl)
      if (!imageUrl) {
        return
      }
      const width = positiveNumber(record.width)
      const height = positiveNumber(record.height)
      if (!width || !height) {
        return
      }
      const evaluation = evaluateNoonImageDimensions({ width, height })
      byUrl.set(imageUrl, compactImageAssetMetadata({
        imageUrl,
        width,
        height,
        sourceWidth: positiveNumber(record.sourceWidth),
        sourceHeight: positiveNumber(record.sourceHeight),
        aspectRatio: evaluation.aspectRatio,
        noonReady: evaluation.status === 'ready',
        adapted: Boolean(record.adapted),
        adaptationTargetWidth: positiveNumber(record.adaptationTargetWidth),
        adaptationTargetHeight: positiveNumber(record.adaptationTargetHeight),
        sourceTooSmall: Boolean(record.sourceTooSmall) || Boolean(positiveNumber(record.sourceWidth) && Number(record.sourceWidth) < NOON_IMAGE_MIN_WIDTH)
      }))
    })
  }
  return activeImages
    .map((imageUrl) => byUrl.get(imageUrl))
    .filter((item): item is NoonImageAssetMetadata => Boolean(item))
}

export function noonImageMetadataFromDimensions(
  imageUrl: string,
  dimensions: NoonImageDimensions,
  options: Partial<NoonImageAssetMetadata> = {}
): NoonImageAssetMetadata | undefined {
  const width = positiveNumber(dimensions.width)
  const height = positiveNumber(dimensions.height)
  if (!imageUrl || !width || !height) {
    return undefined
  }
  const evaluation = evaluateNoonImageDimensions({ width, height })
  return compactImageAssetMetadata({
    imageUrl,
    width,
    height,
    sourceWidth: positiveNumber(options.sourceWidth),
    sourceHeight: positiveNumber(options.sourceHeight),
    aspectRatio: evaluation.aspectRatio,
    noonReady: evaluation.status === 'ready',
    adapted: Boolean(options.adapted),
    adaptationTargetWidth: positiveNumber(options.adaptationTargetWidth),
    adaptationTargetHeight: positiveNumber(options.adaptationTargetHeight),
    sourceTooSmall: Boolean(options.sourceTooSmall) || Boolean(positiveNumber(options.sourceWidth) && Number(options.sourceWidth) < NOON_IMAGE_MIN_WIDTH)
  })
}

function compactImageAssetMetadata(metadata: NoonImageAssetMetadata): NoonImageAssetMetadata {
  return {
    imageUrl: metadata.imageUrl,
    width: metadata.width,
    height: metadata.height,
    ...(metadata.sourceWidth ? { sourceWidth: metadata.sourceWidth } : {}),
    ...(metadata.sourceHeight ? { sourceHeight: metadata.sourceHeight } : {}),
    ...(metadata.aspectRatio ? { aspectRatio: metadata.aspectRatio } : {}),
    noonReady: Boolean(metadata.noonReady),
    ...(metadata.adapted ? { adapted: true } : {}),
    ...(metadata.adaptationTargetWidth ? { adaptationTargetWidth: metadata.adaptationTargetWidth } : {}),
    ...(metadata.adaptationTargetHeight ? { adaptationTargetHeight: metadata.adaptationTargetHeight } : {}),
    sourceTooSmall: Boolean(metadata.sourceTooSmall)
  }
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  const seen = new Set<string>()
  return value
    .map((item) => text(item))
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false
      }
      seen.add(item)
      return true
    })
}

function positiveNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }
  return Math.round(parsed)
}

function roundAspectRatio(value: number) {
  return Number(value.toFixed(2))
}

function text(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}
