import type { CompetitorWatchProduct, RankSummary } from './types'

export function summarizeRanks(product: CompetitorWatchProduct): RankSummary {
  const relevantPoints = product.rankPoints.filter((point) => point.isSelf || point.isConfirmedCompetitor)
  const rankedPoints = relevantPoints.filter((point) => point.rankStatus === 'ranked' && typeof point.rankNo === 'number')
  const bestRank = rankedPoints.length ? Math.min(...rankedPoints.map((point) => point.rankNo || 999)) : undefined
  const sponsoredCount = relevantPoints.filter((point) => point.isSponsored).length
  const notInScanDepthCount = relevantPoints.filter((point) => point.rankStatus === 'not_in_scan_depth').length
  return {
    bestRank,
    sponsoredCount,
    notInScanDepthCount,
    label: bestRank ? `最佳第 ${bestRank} 名` : '暂无排名'
  }
}
