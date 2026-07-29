import { extraCompetitorDetails } from './competitor-analysis-extra.fixture';
import { primaryCompetitorDetails } from './competitor-analysis-primary.fixture';
import type { MockDetail } from './competitor-analysis.types';

export function createMockDetails(): Record<number, MockDetail> {
  return structuredClone({
    ...primaryCompetitorDetails,
    ...extraCompetitorDetails
  });
}

export function buildListResponse(details: MockDetail[], searchParams: URLSearchParams) {
  const productSearch = normalize(searchParams.get('productSearch') || '')
  const keywordSearch = normalize(searchParams.get('keywordSearch') || '')
  const competitorSearch = normalize(searchParams.get('competitorSearch') || '')
  const filtered = details.filter((detail) => {
    const productFields = [
      detail.watchProduct.title,
      detail.watchProduct.brand,
      detail.watchProduct.storeCode,
      detail.watchProduct.siteCode,
      detail.watchProduct.partnerSku,
      detail.watchProduct.childSku,
      detail.watchProduct.selfNoonProductCode
    ]
    const keywordFields = detail.keywords.map((keyword) => keyword.keyword)
    const competitorFields = detail.candidates.flatMap((candidate) => [
      candidate.noonProductCode,
      candidate.titleSnapshot,
      candidate.brandSnapshot,
      candidate.canonicalUrl
    ])
    return (
      matches(productFields, productSearch) &&
      matches(keywordFields, keywordSearch) &&
      matches(competitorFields, competitorSearch)
    )
  })
  const sorted = [...filtered].sort((left, right) => {
    const sortBy = searchParams.get('sortBy') || 'candidateCountDesc'
    if (sortBy === 'candidateCountAsc') {
      return pendingCount(left) - pendingCount(right) || confirmedCount(left) - confirmedCount(right)
    }
    if (sortBy === 'monitoredCountDesc') {
      return confirmedCount(right) - confirmedCount(left) || pendingCount(right) - pendingCount(left)
    }
    if (sortBy === 'monitoredCountAsc') {
      return confirmedCount(left) - confirmedCount(right) || pendingCount(left) - pendingCount(right)
    }
    if (sortBy === 'recent7dChangeCountDesc') {
      return (right.recent7dCompetitorChangeCount ?? 0) - (left.recent7dCompetitorChangeCount ?? 0)
    }
    if (sortBy === 'recent7dChangeCountAsc') {
      return (left.recent7dCompetitorChangeCount ?? 0) - (right.recent7dCompetitorChangeCount ?? 0)
    }
    return pendingCount(right) - pendingCount(left) || confirmedCount(right) - confirmedCount(left)
  })
  return {
    items: sorted.map((detail) => ({
      ...detail.watchProduct,
      activeKeywordCount: detail.keywords.filter((keyword) => keyword.status === 'ACTIVE').length,
      activeKeywordStats: activeKeywordStats(detail),
      pendingCandidateCount: pendingCount(detail),
      confirmedCompetitorCount: confirmedCount(detail),
      recent7dChangedCompetitorCount: detail.recent7dChangedCompetitorCount ?? 0,
      recent7dCompetitorChangeCount: detail.recent7dCompetitorChangeCount ?? 0
    })),
    pagination: {
      page: 1,
      pageSize: 50,
      total: filtered.length,
      totalPages: 1
    }
  }
}

function pendingCount(detail: MockDetail) {
  return detail.candidates.filter((candidate) => candidate.reviewStatus === 'PENDING').length
}

function confirmedCount(detail: MockDetail) {
  return detail.candidates.filter((candidate) => candidate.reviewStatus === 'CONFIRMED').length
}

function activeKeywordStats(detail: MockDetail) {
  return detail.keywords
    .filter((keyword) => keyword.status === 'ACTIVE')
    .map((keyword) => ({
      keyword: keyword.keyword,
      monitoredCount: detail.keywordRelations.filter(
        (relation) => relation.keywordId === keyword.id && relation.relationStatus === 'CONFIRMED'
      ).length
    }))
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matches(fields: Array<string | undefined>, query: string) {
  if (!query) {
    return true
  }
  return fields.some((field) => normalize(field || '').includes(query))
}
