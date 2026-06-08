import type { CompetitorWatchProduct, RankSummary } from './types'

export function summarizeRanks(product: CompetitorWatchProduct): RankSummary {
  const relevantPoints = product.rankPoints.filter((point) => point.isSelf || point.isConfirmedCompetitor)
  const rankedPoints = relevantPoints.filter((point) => point.rankStatus === 'ranked' && typeof point.rankNo === 'number')
  const bestRank = rankedPoints.length ? Math.min(...rankedPoints.map((point) => point.rankNo || 999)) : undefined
  const sponsoredCount = relevantPoints.filter((point) => point.isSponsored).length
  const notInTop20Count = relevantPoints.filter((point) => point.rankStatus !== 'ranked').length
  return {
    bestRank,
    sponsoredCount,
    notInTop20Count,
    label: bestRank ? `最好排名第 ${bestRank} 名` : '暂无排名'
  }
}
