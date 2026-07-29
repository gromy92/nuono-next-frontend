export function listingEditorText(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

export function listingEditorStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => listingEditorText(item).trim()).filter(Boolean)
  }
  return []
}

export function listingEditorMultilineList(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function listingEditorImageRoleAssignmentList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }
      const record = item as Record<string, unknown>
      const imageUrl = listingEditorText(record.imageUrl).trim()
      const imageRole = listingEditorText(record.imageRole).trim()
      const sortOrderValue = Number(record.sortOrder)
      if (!imageUrl || !['MAIN', 'SIZE', 'DETAIL', 'SCENE', 'PACKAGE'].includes(imageRole)) {
        return null
      }
      return {
        imageUrl,
        imageRole: imageRole as 'MAIN' | 'SIZE' | 'DETAIL' | 'SCENE' | 'PACKAGE',
        sortOrder: Number.isFinite(sortOrderValue) ? Math.trunc(sortOrderValue) : undefined
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

export function listingEditorImageAssetMetadataList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }
      const record = item as Record<string, unknown>
      const imageUrl = listingEditorText(record.imageUrl).trim()
      const width = positiveNumber(record.width)
      const height = positiveNumber(record.height)
      if (!imageUrl || !width || !height) {
        return null
      }
      return {
        imageUrl,
        width,
        height,
        aspectRatio: positiveNumber(record.aspectRatio),
        noonReady: Boolean(record.noonReady),
        sourceWidth: positiveNumber(record.sourceWidth),
        sourceHeight: positiveNumber(record.sourceHeight),
        adapted: Boolean(record.adapted),
        adaptationTargetWidth: positiveNumber(record.adaptationTargetWidth),
        adaptationTargetHeight: positiveNumber(record.adaptationTargetHeight),
        sourceTooSmall: Boolean(record.sourceTooSmall)
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function positiveNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}
