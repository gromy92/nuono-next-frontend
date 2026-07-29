import {
  DEFAULT_RANK_SCAN_DEPTH,
  normalizeNoonProductCode
} from '../competitorRankFormatting'
import type { CompetitorWatchProduct } from '../types'
import {
  buildKeywordCompetitorRankSeries,
  candidateStatusForKeyword
} from './rankCompetitorSeries'
import type {
  RankChartProductSeries,
  RankHeatmapCell,
  RankHeatmapRow,
  SelfRankKeywordReport,
  SelfRankReportPoint,
  SelfRankReportStatus
} from './rankReportTypes'

export function buildSelfRankReport(product: CompetitorWatchProduct): SelfRankKeywordReport[] {
  const activeKeywords = product.keywords
    .filter((keyword) => keyword.status === 'active' && keyword.keyword.trim())
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)

  return activeKeywords.map((keyword) => {
    const confirmedCandidateCodes = new Set(
      product.candidates
        .filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'confirmed')
        .map((candidate) => normalizeNoonProductCode(candidate.noonProductCode))
        .filter(Boolean)
    )
    const relevantRankPoints = product.rankPoints.filter((point) => {
      if (point.keywordId !== keyword.id) {
        return false
      }
      const pointCode = normalizeNoonProductCode(point.noonProductCode)
      return (
        point.isSelf ||
        pointCode === normalizeNoonProductCode(product.selfNoonProductCode) ||
        confirmedCandidateCodes.has(pointCode)
      )
    })
    const pointsByDate = new Map(
      Array.from(new Set(relevantRankPoints.map((point) => point.factDate)))
        .sort((left, right) => left.localeCompare(right))
        .map((date) => [
          date,
          buildEmptySelfRankReportPoint(
            date,
            relevantRankPoints.filter((point) => point.factDate === date)
          )
        ] as const)
    )
    relevantRankPoints
      .filter(
        (point) =>
          point.isSelf ||
          normalizeNoonProductCode(point.noonProductCode) ===
            normalizeNoonProductCode(product.selfNoonProductCode)
      )
      .forEach((point) => {
        const date = point.factDate
        const existing = pointsByDate.get(date) ?? buildEmptySelfRankReportPoint(date)
        const status: SelfRankReportStatus =
          point.rankStatus === 'ranked' ? 'ranked' : 'not_in_scan_depth'
        existing.scanDepth = Math.max(existing.scanDepth, reportScanDepth([point]))
        if (point.isSponsored) {
          existing.adStatus = status
          existing.adRankNo = point.rankNo
        } else {
          existing.organicStatus = status
          existing.organicRankNo = point.rankNo
        }
        existing.runStatus = '真实抓取'
        pointsByDate.set(date, existing)
      })

    const sortedPoints = Array.from(pointsByDate.values()).sort((left, right) =>
      left.date.localeCompare(right.date)
    )
    return {
      keywordId: keyword.id,
      keyword: keyword.keyword,
      points: sortedPoints,
      competitorSeries: buildKeywordCompetitorRankSeries(product, keyword, sortedPoints)
    }
  })
}

export function hasRenderableRankData(report: SelfRankKeywordReport) {
  return buildRankChartProductSeries(report).some(
    (series) => hasRankValue(series.organicData) || hasRankValue(series.adData)
  )
}

export function buildEmptySelfRankReportPoint(
  date: string,
  points: Array<{ scanDepth?: number }> = []
): SelfRankReportPoint {
  return {
    date,
    adStatus: 'missing',
    organicStatus: 'missing',
    scanDepth: reportScanDepth(points),
    runStatus: '真实抓取'
  }
}

export function buildRankHeatmapRows(report: SelfRankKeywordReport): RankHeatmapRow[] {
  return buildRankChartProductSeries(report).map((series, productIndex) => ({
    productCode: series.productCode,
    productUrl: series.productUrl,
    name: series.name,
    color: colorByProduct(productIndex),
    isSelf: productIndex === 0,
    cells: report.points.map((point, dateIndex) => {
      const organicRankNo = series.organicData[dateIndex] ?? undefined
      const adRankNo = series.adData[dateIndex] ?? undefined
      const rankNo = bestRankValue(organicRankNo, adRankNo)
      return {
        dateLabel: point.date.slice(5),
        rankNo,
        adRankNo,
        scanDepth: point.scanDepth,
        band: rankBand(rankNo)
      }
    })
  }))
}

export function buildRankChartProductSeries(
  report: SelfRankKeywordReport
): RankChartProductSeries[] {
  return [
    {
      productCode: 'self',
      productUrl: undefined,
      name: '本品',
      organicData: report.points.map((point) =>
        point.organicStatus === 'ranked' ? point.organicRankNo ?? null : null
      ),
      adData: report.points.map((point) =>
        point.adStatus === 'ranked' ? point.adRankNo ?? null : null
      )
    },
    ...report.competitorSeries
  ]
}

export function colorByProduct(productIndex: number) {
  return REPORT_PRODUCT_COLORS[productIndex % REPORT_PRODUCT_COLORS.length]
}

export function formatSelfRankReportText(
  status: SelfRankReportStatus,
  rankNo?: number
) {
  if (status === 'ranked' && rankNo) {
    return `第 ${rankNo} 名`
  }
  if (status === 'not_in_scan_depth') {
    return '无排名数据'
  }
  return '-'
}

function hasRankValue(values: Array<number | null>) {
  return values.some((rank) => typeof rank === 'number')
}

function reportScanDepth(points: Array<{ scanDepth?: number }>) {
  const depths = points
    .map((point) => point.scanDepth)
    .filter((depth): depth is number => typeof depth === 'number' && depth > 0)
  return depths.length ? Math.max(...depths) : DEFAULT_RANK_SCAN_DEPTH
}

const REPORT_PRODUCT_COLORS = [
  '#1677ff',
  '#13a8a8',
  '#fa8c16',
  '#52c41a',
  '#eb2f96',
  '#2f54eb',
  '#a0d911',
  '#fa541c',
  '#08979c'
]

function bestRankValue(...values: Array<number | undefined>) {
  const rankedValues = values.filter((value): value is number => typeof value === 'number')
  return rankedValues.length ? Math.min(...rankedValues) : undefined
}

function rankBand(rankNo?: number): RankHeatmapCell['band'] {
  if (!rankNo) return 'missing'
  if (rankNo <= 10) return 'top10'
  if (rankNo <= 20) return 'top20'
  if (rankNo <= 50) return 'top50'
  return 'top200'
}
