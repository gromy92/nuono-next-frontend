import type { CompetitorRankPoint } from './types'

export const DEFAULT_RANK_SCAN_DEPTH = 100

export function normalizeNoonProductCode(value?: string) {
  return (value || '').trim().toUpperCase()
}

export function formatRankStatus(
  rankPoint?: CompetitorRankPoint,
  fallbackRankNo?: number
) {
  if (rankPoint?.rankStatus === 'ranked' && rankPoint.rankNo) {
    return `第 ${rankPoint.rankNo} 名`
  }
  if (rankPoint && isNotInRankRange(rankPoint.rankStatus)) {
    return formatNotInRankRangeText(rankPoint.scanDepth)
  }
  if (fallbackRankNo) {
    return `第 ${fallbackRankNo} 名`
  }
  return '暂无排名'
}

export function formatNotInRankRangeText(scanDepth = DEFAULT_RANK_SCAN_DEPTH) {
  const depth =
    Number.isFinite(scanDepth) && scanDepth > 0
      ? Math.max(DEFAULT_RANK_SCAN_DEPTH, scanDepth)
      : DEFAULT_RANK_SCAN_DEPTH
  return `未进前${depth}`
}

export function isNotInRankRange(rankStatus: CompetitorRankPoint['rankStatus']) {
  return rankStatus === 'not_in_top_20' || rankStatus === 'not_in_scan_depth'
}
