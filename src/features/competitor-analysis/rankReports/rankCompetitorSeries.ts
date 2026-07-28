import { buildNoonProductDetailUrl } from '../competitorNoonLinks'
import {
  isNotInRankRange,
  normalizeNoonProductCode
} from '../competitorRankFormatting'
import type {
  CompetitorCandidate,
  CompetitorKeyword,
  CompetitorWatchProduct
} from '../types'
import type {
  KeywordCompetitorRankSeries,
  SelfRankReportPoint
} from './rankReportTypes'

export function rankedMonitoredCompetitorCount(
  product: CompetitorWatchProduct,
  keywordId: string
) {
  const monitoredCodes = new Set(
    product.candidates
      .filter((candidate) => candidateStatusForKeyword(candidate, keywordId) === 'confirmed')
      .map((candidate) => normalizeNoonProductCode(candidate.noonProductCode))
      .filter(Boolean)
  )
  return new Set(
    product.rankPoints
      .filter(
        (point) =>
          point.keywordId === keywordId &&
          !point.isSelf &&
          point.rankStatus === 'ranked' &&
          Boolean(point.rankNo) &&
          monitoredCodes.has(normalizeNoonProductCode(point.noonProductCode))
      )
      .map((point) => normalizeNoonProductCode(point.noonProductCode))
  ).size
}

export function reportMonitoredCount(product: CompetitorWatchProduct, keywordId: string) {
  return product.candidates.filter(
    (candidate) => candidateStatusForKeyword(candidate, keywordId) === 'confirmed'
  ).length
}

export function buildKeywordCompetitorRankSeries(
  product: CompetitorWatchProduct,
  keyword: CompetitorKeyword,
  points: SelfRankReportPoint[]
): KeywordCompetitorRankSeries[] {
  const dates = points.map((point) => point.date)
  const selfProductCode = normalizeNoonProductCode(product.selfNoonProductCode)
  const confirmedCandidates = product.candidates
    .filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'confirmed')
    .filter(
      (candidate) => normalizeNoonProductCode(candidate.noonProductCode) !== selfProductCode
    )
    .slice()
    .sort((left, right) => {
      const leftRank = candidateVisibleRankNo(product, keyword.id, left) ?? Number.MAX_SAFE_INTEGER
      const rightRank =
        candidateVisibleRankNo(product, keyword.id, right) ?? Number.MAX_SAFE_INTEGER
      if (leftRank !== rightRank) return leftRank - rightRank
      return left.noonProductCode.localeCompare(right.noonProductCode)
    })
    .slice(0, 8)

  return confirmedCandidates.flatMap((candidate) => {
    const organicRankByDate = new Map<string, number>()
    const adRankByDate = new Map<string, number>()
    product.rankPoints
      .filter(
        (point) =>
          point.keywordId === keyword.id &&
          normalizeNoonProductCode(point.noonProductCode) ===
            normalizeNoonProductCode(candidate.noonProductCode) &&
          point.rankStatus === 'ranked' &&
          Boolean(point.rankNo)
      )
      .forEach((point) => {
        if (!point.rankNo) {
          return
        }
        const rankByDate = point.isSponsored ? adRankByDate : organicRankByDate
        const existingRank = rankByDate.get(point.factDate)
        if (!existingRank || point.rankNo < existingRank) {
          rankByDate.set(point.factDate, point.rankNo)
        }
      })

    const realOrganicData = dates.map((date) => organicRankByDate.get(date) ?? null)
    const realAdData = dates.map((date) => adRankByDate.get(date) ?? null)
    if (!hasRankValue(realOrganicData) && !hasRankValue(realAdData)) {
      return []
    }
    return [
      {
        productCode: candidate.noonProductCode,
        productUrl:
          candidate.canonicalUrl ||
          buildNoonProductDetailUrl(candidate.noonProductCode, product.siteCode),
        name:
          normalizeNoonProductCode(candidate.noonProductCode) ||
          candidate.noonProductCode ||
          '-',
        organicData: realOrganicData,
        adData: realAdData
      }
    ]
  })
}

export function candidateStatusForKeyword(
  candidate: CompetitorCandidate,
  keywordId: string
) {
  return candidate.keywordReviewStatus?.[keywordId] ?? 'ignored'
}

function candidateVisibleRankNo(
  product: CompetitorWatchProduct,
  keywordId: string,
  candidate: CompetitorCandidate
) {
  const rankPoint = product.rankPoints
    .filter(
      (point) =>
        point.keywordId === keywordId &&
        normalizeNoonProductCode(point.noonProductCode) ===
          normalizeNoonProductCode(candidate.noonProductCode)
    )
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))[0]
  if (rankPoint?.rankStatus === 'ranked' && rankPoint.rankNo) {
    return rankPoint.rankNo
  }
  if (rankPoint && isNotInRankRange(rankPoint.rankStatus)) {
    return undefined
  }
  return candidate.latestRankNo
}

function hasRankValue(values: Array<number | null>) {
  return values.some((rank) => typeof rank === 'number')
}
