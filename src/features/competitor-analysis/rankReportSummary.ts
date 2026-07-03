export type RankReportPointStatus = 'ranked' | 'not_in_scan_depth' | 'missing'

export type RankReportSummaryPoint = {
  date: string
  organicStatus: RankReportPointStatus
  organicRankNo?: number
  adStatus: RankReportPointStatus
  adRankNo?: number
  scanDepth?: number
}

export type RankReportSummarySeries = {
  name: string
  organicData: Array<number | null>
  adData: Array<number | null>
}

export type RankReportSummary = {
  latestOrganicRank?: number
  latestOrganicText: string
  scanDepth: number
  organicChangeText: string
  adDaysText: string
  bestCompetitorText: string
}

type RankState =
  | { status: 'ranked'; rankNo: number }
  | { status: 'not_in_scan_depth' }
  | { status: 'missing' }

const DEFAULT_RANK_SCAN_DEPTH = 100

export function buildRankReportSummary(report: {
  points: RankReportSummaryPoint[]
  productSeries: RankReportSummarySeries[]
}): RankReportSummary {
  const selfSeries = report.productSeries[0]
  const latestPoint = report.points[report.points.length - 1]
  const latestIndex = latestPoint ? report.points.length - 1 : -1
  const scanDepth = reportScanDepth(report.points)
  const latestOrganicRank = rankedValue(latestPoint?.organicStatus, latestPoint?.organicRankNo)
  const adDays = selfSeries?.adData.filter((rank) => typeof rank === 'number').length ?? 0
  const bestCompetitor = report.productSeries
    .slice(1)
    .map((series) => ({
      name: series.name,
      rankNo: bestRankValue(rankAt(series.organicData, latestIndex), rankAt(series.adData, latestIndex))
    }))
    .filter((item): item is { name: string; rankNo: number } => typeof item.rankNo === 'number')
    .sort((left, right) => left.rankNo - right.rankNo)[0]

  return {
    latestOrganicRank,
    latestOrganicText: formatLatestRankText(latestPoint, scanDepth),
    scanDepth,
    organicChangeText: formatRankChangeText(report.points[0], latestPoint, scanDepth),
    adDaysText: `${adDays}/${report.points.length} 天`,
    bestCompetitorText: bestCompetitor ? `${bestCompetitor.name} 第 ${bestCompetitor.rankNo} 名` : '暂无竞品排名'
  }
}

function rankedValue(status?: RankReportPointStatus, rankNo?: number) {
  return status === 'ranked' && rankNo ? rankNo : undefined
}

function rankAt(values: Array<number | null>, index: number) {
  if (index < 0) {
    return undefined
  }
  const value = values[index]
  return typeof value === 'number' ? value : undefined
}

function reportScanDepth(points: Array<{ scanDepth?: number }>) {
  const depths = points
    .map((point) => point.scanDepth)
    .filter((depth): depth is number => typeof depth === 'number' && depth > 0)
  return depths.length ? Math.max(...depths) : DEFAULT_RANK_SCAN_DEPTH
}

function formatRankChangeText(
  firstPoint: RankReportSummaryPoint | undefined,
  latestPoint: RankReportSummaryPoint | undefined,
  scanDepth: number
) {
  const firstRank = rankState(firstPoint)
  const latestRank = rankState(latestPoint)
  if (firstRank.status === 'missing' || latestRank.status === 'missing') {
    return '暂无趋势'
  }
  if (firstRank.status === 'ranked' && latestRank.status === 'ranked') {
    const change = firstRank.rankNo - latestRank.rankNo
    if (change > 0) {
      return `上升 ${change} 名`
    }
    if (change < 0) {
      return `下降 ${Math.abs(change)} 名`
    }
    return '持平'
  }
  if (firstRank.status === 'ranked' && latestRank.status === 'not_in_scan_depth') {
    return '最近无排名数据'
  }
  if (firstRank.status === 'not_in_scan_depth' && latestRank.status === 'ranked') {
    return '进榜'
  }
  return formatNoRankDataText(scanDepth)
}

function formatLatestRankText(point: RankReportSummaryPoint | undefined, scanDepth: number) {
  const state = rankState(point)
  if (state.status === 'ranked') {
    return `第 ${state.rankNo} 名`
  }
  if (state.status === 'not_in_scan_depth') {
    return formatNoRankDataText(scanDepth)
  }
  return '暂无排名数据'
}

function rankState(point: RankReportSummaryPoint | undefined): RankState {
  if (!point) {
    return { status: 'missing' }
  }
  const rankNo = rankedValue(point.organicStatus, point.organicRankNo)
  if (rankNo) {
    return { status: 'ranked', rankNo }
  }
  if (point.organicStatus === 'not_in_scan_depth') {
    return { status: 'not_in_scan_depth' }
  }
  return { status: 'missing' }
}

function bestRankValue(...values: Array<number | undefined>) {
  const rankedValues = values.filter((value): value is number => typeof value === 'number')
  return rankedValues.length ? Math.min(...rankedValues) : undefined
}

function formatNoRankDataText(scanDepth = DEFAULT_RANK_SCAN_DEPTH) {
  const depth =
    Number.isFinite(scanDepth) && scanDepth > 0
      ? Math.max(DEFAULT_RANK_SCAN_DEPTH, scanDepth)
      : DEFAULT_RANK_SCAN_DEPTH
  return depth > 0 ? '最近无排名数据' : '最近无排名数据'
}
