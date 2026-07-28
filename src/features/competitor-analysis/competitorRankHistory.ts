import { fetchCompetitorRankHistory } from './api'
import type {
  CompetitorRankPoint,
  CompetitorWatchProduct
} from './types'

export async function loadReportRankHistory(
  product: CompetitorWatchProduct,
  rangeDays = 15,
  loadRankHistory = fetchCompetitorRankHistory
) {
  const activeKeywords = product.keywords.filter((keyword) => keyword.status === 'active' && keyword.id)
  if (!product.id || !activeKeywords.length) {
    return { product, failedCount: 0 }
  }

  const results = await Promise.allSettled(
    activeKeywords.map((keyword) =>
      loadRankHistory(product.id, {
        keywordId: keyword.id,
        rangeDays
      })
    )
  )
  const rankPoints = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  const failedCount = results.filter((result) => result.status === 'rejected').length
  return {
    product: rankPoints.length ? mergeReportRankPoints(product, rankPoints) : product,
    failedCount
  }
}

function mergeReportRankPoints(
  product: CompetitorWatchProduct,
  rankPoints: CompetitorRankPoint[]
) {
  const pointByKey = new Map<string, CompetitorRankPoint>()
  ;[...product.rankPoints, ...rankPoints].forEach((point) => {
    pointByKey.set(reportRankPointKey(point), point)
  })
  return {
    ...product,
    rankPoints: Array.from(pointByKey.values()).sort((left, right) => {
      const dateCompare = left.factDate.localeCompare(right.factDate)
      if (dateCompare !== 0) return dateCompare
      const keywordCompare = left.keywordId.localeCompare(right.keywordId)
      if (keywordCompare !== 0) return keywordCompare
      return left.noonProductCode.localeCompare(right.noonProductCode)
    })
  }
}

function reportRankPointKey(point: CompetitorRankPoint) {
  return [
    point.keywordId,
    normalizeNoonProductCode(point.noonProductCode),
    point.factDate,
    point.rankChannel || 'organic',
    point.isSponsored ? 'ad' : 'natural',
    point.isSelf ? 'self' : 'competitor'
  ].join(':')
}

function normalizeNoonProductCode(value?: string) {
  return (value || '').trim().toUpperCase()
}
