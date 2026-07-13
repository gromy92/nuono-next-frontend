export const PRODUCT_PROFILE_ROW_HEIGHT = 70
export const PRODUCT_PROFILE_ROW_OVERSCAN = 8

export type ProductProfileVirtualWindow = {
  bottomPadding: number
  endIndex: number
  startIndex: number
  topPadding: number
}

export function productProfileVirtualWindow(
  totalItems: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight = PRODUCT_PROFILE_ROW_HEIGHT,
  overscan = PRODUCT_PROFILE_ROW_OVERSCAN
): ProductProfileVirtualWindow {
  const total = Math.max(0, Math.floor(totalItems))
  const height = Math.max(1, rowHeight)
  if (total === 0) {
    return {
      bottomPadding: 0,
      endIndex: 0,
      startIndex: 0,
      topPadding: 0
    }
  }

  const viewport = Math.max(height, viewportHeight || height)
  const visibleRows = Math.ceil(viewport / height)
  const capacity = Math.min(total, visibleRows + overscan * 2)
  const rawStart = Math.floor(Math.max(0, scrollTop) / height) - overscan
  const maxStart = Math.max(0, total - capacity)
  const startIndex = Math.min(Math.max(0, rawStart), maxStart)
  const rawEnd = Math.ceil((Math.max(0, scrollTop) + viewport) / height) + overscan
  const endIndex = Math.min(total, Math.max(startIndex + capacity, rawEnd))

  return {
    bottomPadding: Math.max(0, total - endIndex) * height,
    endIndex,
    startIndex,
    topPadding: startIndex * height
  }
}
