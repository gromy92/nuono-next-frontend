import {
  isNotInRankRange,
  normalizeNoonProductCode
} from '../competitorRankFormatting'
import type {
  CompetitorCandidate,
  CompetitorKeyword,
  CompetitorRankPoint,
  CompetitorWatchProduct
} from '../types'

export function getCandidatesForKeyword(
  product: CompetitorWatchProduct,
  keyword: CompetitorKeyword
) {
  return product.candidates.filter(
    (candidate) => candidateStatusForKeyword(candidate, keyword.id) !== 'ignored'
  )
}

export function isLatestFetchResultCandidate(
  product: CompetitorWatchProduct,
  keywordId: string,
  candidate: CompetitorCandidate,
  hasKeywordRunEvidence: boolean
) {
  if (candidateStatusForKeyword(candidate, keywordId) === 'ignored') {
    return false
  }
  const relationRunId = candidate.keywordLastSeenRunIds?.[keywordId]
  if (!hasKeywordRunEvidence) {
    return true
  }
  if (product.latestRunId) {
    return relationRunId === product.latestRunId
  }
  return Boolean(relationRunId)
}

export function candidateStatusForKeyword(
  candidate: CompetitorCandidate,
  keywordId: string
) {
  return candidate.keywordReviewStatus?.[keywordId] ?? 'ignored'
}

export function sortCandidatesByRank(
  product: CompetitorWatchProduct,
  keywordId: string,
  candidates: CompetitorCandidate[]
) {
  return candidates.slice().sort((left, right) => {
    const leftRank = candidateVisibleRankNo(product, keywordId, left)
    const rightRank = candidateVisibleRankNo(product, keywordId, right)
    const leftSortRank = leftRank ?? Number.MAX_SAFE_INTEGER
    const rightSortRank = rightRank ?? Number.MAX_SAFE_INTEGER
    if (leftSortRank !== rightSortRank) {
      return leftSortRank - rightSortRank
    }
    return left.noonProductCode.localeCompare(right.noonProductCode)
  })
}

export function getLatestRankPoint(
  product: CompetitorWatchProduct,
  keywordId: string,
  noonProductCode: string
) {
  const normalizedCode = normalizeNoonProductCode(noonProductCode)
  return product.rankPoints
    .filter(
      (point) =>
        point.keywordId === keywordId &&
        normalizeNoonProductCode(point.noonProductCode) === normalizedCode
    )
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))[0]
}

export function isOwnStoreCandidate(
  product: CompetitorWatchProduct,
  candidate: CompetitorCandidate,
  rankPoint?: CompetitorRankPoint,
  ownedNoonProductCodes?: ReadonlySet<string>
) {
  if (candidate.ownedByCurrentStore || rankPoint?.isSelf) {
    return true
  }
  const candidateCode = normalizeNoonProductCode(candidate.noonProductCode)
  if (candidateCode && ownedNoonProductCodes?.has(candidateCode)) {
    return true
  }
  const selfCode = normalizeNoonProductCode(product.selfNoonProductCode)
  return Boolean(selfCode && candidateCode && selfCode === candidateCode)
}

export function candidateVisibleRankNo(
  product: CompetitorWatchProduct,
  keywordId: string,
  candidate: CompetitorCandidate
) {
  const rankPoint = getLatestRankPoint(product, keywordId, candidate.noonProductCode)
  if (rankPoint?.rankStatus === 'ranked' && rankPoint.rankNo) {
    return rankPoint.rankNo
  }
  if (rankPoint && isNotInRankRange(rankPoint.rankStatus)) {
    return undefined
  }
  return candidate.latestRankNo
}
