import type {
  CompetitorKeyword,
  CompetitorRankPoint,
  CompetitorWatchProduct
} from '../types'

export type RankHistoryRow = CompetitorRankPoint & {
  keyword: string
  title: string
}

export function buildRankRows(product: CompetitorWatchProduct): RankHistoryRow[] {
  return buildHistoryRankRows(product, product.rankPoints)
}

export function buildHistoryRankRows(
  product: CompetitorWatchProduct,
  rankPoints: CompetitorRankPoint[],
  selectedKeyword?: CompetitorKeyword
): RankHistoryRow[] {
  return rankPoints
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))
    .map((point) => ({
      ...point,
      keyword:
        selectedKeyword?.id === point.keywordId
          ? selectedKeyword.keyword
          : product.keywords.find((keyword) => keyword.id === point.keywordId)?.keyword || '-',
      title: point.isSelf
        ? product.title
        : product.candidates.find(
            (candidate) => candidate.noonProductCode === point.noonProductCode
          )?.title || point.noonProductCode
    }))
}
