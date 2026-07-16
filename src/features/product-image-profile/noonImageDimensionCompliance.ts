export type NoonImageDimensionCompliance = {
  status: 'PASS' | 'FAIL' | 'UNKNOWN'
  detail: string
}

const NOON_MIN_WIDTH_PX = 660
const NOON_MIN_ASPECT_RATIO = 0.5

export function noonImageDimensionCompliance(
  widthPx?: number,
  heightPx?: number
): NoonImageDimensionCompliance {
  if (!widthPx || !heightPx || widthPx <= 0 || heightPx <= 0) {
    return {
      status: 'UNKNOWN',
      detail: '图片尺寸待读取。'
    }
  }

  const ratio = widthPx / heightPx
  const failures: string[] = []
  if (widthPx < NOON_MIN_WIDTH_PX) {
    failures.push(`宽度 ${widthPx}px，低于 660px`)
  }
  if (ratio < NOON_MIN_ASPECT_RATIO) {
    failures.push(`宽高比 ${ratio.toFixed(3)}，低于 0.5`)
  }
  if (failures.length) {
    return {
      status: 'FAIL',
      detail: `${failures.join('；')}。`
    }
  }
  return {
    status: 'PASS',
    detail: `尺寸 ${widthPx} × ${heightPx}px，宽度和宽高比符合 Noon 最低要求；格式、PPI、文件大小和色彩空间仍以技术校验结果为准。`
  }
}
