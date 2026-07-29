export type SelfRankReportStatus = 'ranked' | 'not_in_scan_depth' | 'missing'

export type SelfRankReportPoint = {
  date: string
  adStatus: SelfRankReportStatus
  adRankNo?: number
  organicStatus: SelfRankReportStatus
  organicRankNo?: number
  scanDepth: number
  runStatus: string
}

export type SelfRankKeywordReport = {
  keywordId: string
  keyword: string
  points: SelfRankReportPoint[]
  competitorSeries: KeywordCompetitorRankSeries[]
}

export type KeywordCompetitorRankSeries = {
  productCode: string
  name: string
  productUrl?: string
  organicData: Array<number | null>
  adData: Array<number | null>
}

export type RankChartProductSeries = {
  productCode: string
  name: string
  productUrl?: string
  organicData: Array<number | null>
  adData: Array<number | null>
}

export type ReportChartLineSeries = {
  id: string
  name: string
  type: 'line'
  smooth: boolean
  symbolSize: number
  connectNulls: boolean
  itemStyle: { color: string }
  lineStyle: { color: string; width: number; type?: 'dashed' }
  data: Array<number | null>
}

export type ReportChartLineMeta = {
  productName: string
  lineKind: '自然' | '广告'
  color: string
}

export type RankHeatmapCell = {
  dateLabel: string
  rankNo?: number
  adRankNo?: number
  scanDepth: number
  band: 'top10' | 'top20' | 'top50' | 'top200' | 'missing'
}

export type RankHeatmapRow = {
  productCode: string
  name: string
  productUrl?: string
  isSelf: boolean
  color: string
  cells: RankHeatmapCell[]
}
