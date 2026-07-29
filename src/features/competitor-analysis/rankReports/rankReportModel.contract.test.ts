import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { buildSelfRankChartOption } from './rankReportChart'
import {
  rankedMonitoredCompetitorCount,
  reportMonitoredCount
} from './rankCompetitorSeries'
import {
  buildRankHeatmapRows,
  buildSelfRankReport,
  hasRenderableRankData
} from './rankReportModel'
import type { CompetitorWatchProduct } from '../types'

const product = {
  id: 'watch-1',
  siteCode: 'SA',
  selfNoonProductCode: 'ZSELF001',
  keywords: [
    {
      id: 'keyword-1',
      keyword: 'phone case',
      status: 'active',
      displayOrder: 1
    }
  ],
  candidates: [
    {
      id: 'candidate-1',
      noonProductCode: 'ZCOMP001',
      canonicalUrl: '',
      latestRankNo: 18,
      keywordReviewStatus: { 'keyword-1': 'confirmed' }
    },
    {
      id: 'candidate-ignored',
      noonProductCode: 'ZIGNORE',
      canonicalUrl: '',
      latestRankNo: 2,
      keywordReviewStatus: { 'keyword-1': 'ignored' }
    }
  ],
  rankPoints: [
    {
      id: 'self-1',
      keywordId: 'keyword-1',
      noonProductCode: 'ZSELF001',
      factDate: '2026-07-26',
      rankStatus: 'ranked',
      rankNo: 12,
      scanDepth: 100,
      isSelf: true,
      isSponsored: false
    },
    {
      id: 'self-2',
      keywordId: 'keyword-1',
      noonProductCode: 'ZSELF001',
      factDate: '2026-07-27',
      rankStatus: 'not_in_scan_depth',
      scanDepth: 80,
      isSelf: true,
      isSponsored: false
    },
    {
      id: 'self-ad',
      keywordId: 'keyword-1',
      noonProductCode: 'ZSELF001',
      factDate: '2026-07-27',
      rankStatus: 'ranked',
      rankNo: 5,
      scanDepth: 80,
      isSelf: true,
      isSponsored: true
    },
    {
      id: 'competitor-1',
      keywordId: 'keyword-1',
      noonProductCode: 'ZCOMP001',
      factDate: '2026-07-26',
      rankStatus: 'ranked',
      rankNo: 24,
      scanDepth: 100,
      isSelf: false,
      isSponsored: false
    }
  ]
} as unknown as CompetitorWatchProduct

const reports = buildSelfRankReport(product)
assert.equal(reports.length, 1)
assert.deepEqual(
  reports[0].points.map((point) => ({
    date: point.date,
    organicStatus: point.organicStatus,
    organicRankNo: point.organicRankNo,
    adStatus: point.adStatus,
    adRankNo: point.adRankNo,
    scanDepth: point.scanDepth
  })),
  [
    {
      date: '2026-07-26',
      organicStatus: 'ranked',
      organicRankNo: 12,
      adStatus: 'missing',
      adRankNo: undefined,
      scanDepth: 100
    },
    {
      date: '2026-07-27',
      organicStatus: 'not_in_scan_depth',
      organicRankNo: undefined,
      adStatus: 'ranked',
      adRankNo: 5,
      scanDepth: 80
    }
  ]
)
assert.deepEqual(reports[0].competitorSeries[0].organicData, [24, null])
assert.equal(hasRenderableRankData(reports[0]), true)
assert.equal(rankedMonitoredCompetitorCount(product, 'keyword-1'), 1)
assert.equal(reportMonitoredCount(product, 'keyword-1'), 1)

const heatmapRows = buildRankHeatmapRows(reports[0])
assert.equal(heatmapRows[0].isSelf, true)
assert.deepEqual(
  heatmapRows[0].cells.map((cell) => [cell.rankNo, cell.band]),
  [
    [12, 'top20'],
    [5, 'top10']
  ]
)
assert.deepEqual(
  heatmapRows[1].cells.map((cell) => [cell.rankNo, cell.band]),
  [
    [24, 'top50'],
    [undefined, 'missing']
  ]
)

const chartOption = buildSelfRankChartOption(reports[0]) as {
  xAxis: { data: string[] }
  series: Array<{ id: string; data: Array<number | null> }>
}
assert.deepEqual(chartOption.xAxis.data, ['07-26', '07-27'])
assert.deepEqual(
  chartOption.series.map((series) => series.id),
  ['self-organic', 'self-ad', 'ZCOMP001-organic']
)

const pageSource = readFileSync(
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'utf8'
)
assert.doesNotMatch(
  pageSource,
  /function (?:SelfRankReportModal|buildSelfRankReport|buildSelfRankChartOption|RankHeatmap)\b/
)
