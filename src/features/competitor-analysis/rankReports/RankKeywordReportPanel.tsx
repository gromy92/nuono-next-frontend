import { ExportOutlined } from '@ant-design/icons'
import { Button, Card, Space, Tag, Tooltip, Typography } from 'antd'
import { EChartPanel } from '../../../shared/charts'
import { formatNotInRankRangeText } from '../competitorRankFormatting'
import { buildRankReportSummary, type RankReportSummary } from '../rankReportSummary'
import type { CompetitorWatchProduct } from '../types'
import { buildSelfRankChartOption } from './rankReportChart'
import {
  rankedMonitoredCompetitorCount,
  reportMonitoredCount
} from './rankCompetitorSeries'
import {
  buildEmptySelfRankReportPoint,
  buildRankChartProductSeries,
  buildRankHeatmapRows,
  formatSelfRankReportText,
  hasRenderableRankData
} from './rankReportModel'
import type { RankHeatmapRow, SelfRankKeywordReport } from './rankReportTypes'

const { Text } = Typography

export function RankKeywordReportPanel({
  product,
  report
}: {
  product: CompetitorWatchProduct
  report: SelfRankKeywordReport
}) {
  const summary = buildRankReportSummary({
    points: report.points,
    productSeries: buildRankChartProductSeries(report)
  })
  const hasRankChartData = hasRenderableRankData(report)
  const rankedCount = rankedMonitoredCompetitorCount(product, report.keywordId)
  const monitoredCount = reportMonitoredCount(product, report.keywordId)
  const latest =
    report.points[report.points.length - 1] ??
    buildEmptySelfRankReportPoint('', [{ scanDepth: summary.scanDepth }])
  const heatmapRows = hasRankChartData ? buildRankHeatmapRows(report) : []

  return (
    <div className="competitor-analysis-rank-report-panel">
      <RankInsightStrip summary={summary} />
      {hasRankChartData ? (
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Card
            size="small"
            variant="borderless"
            className="competitor-analysis-report-keyword-card competitor-analysis-rank-race-card"
            title={
              <div className="competitor-analysis-race-card-title">
                <Space size={6} wrap>
                  <Tag color="blue">
                    本品自然{' '}
                    {formatSelfRankReportText(
                      latest.organicStatus,
                      latest.organicRankNo
                    )}
                  </Tag>
                  <Tag color="blue">
                    本品广告{' '}
                    {formatSelfRankReportText(
                      latest.adStatus,
                      latest.adRankNo
                    )}
                  </Tag>
                  <Tag color="green">
                    竞品 {report.competitorSeries.length}
                  </Tag>
                </Space>
                <div className="competitor-analysis-rank-zone-legend">
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top10">前10</span>
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top20">11-20</span>
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top50">21-50</span>
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top200">51-200</span>
                </div>
              </div>
            }
          >
            <div className="competitor-analysis-report-chart-only">
              <EChartPanel
                testId={`self-rank-chart-${report.keywordId}`}
                ariaLabel={`${report.keyword} 本品与竞品排名赛道图`}
                height={260}
                option={buildSelfRankChartOption(report)}
              />
            </div>
          </Card>
          <RankHeatmap
            rows={heatmapRows}
            dates={report.points.map((point) => point.date.slice(5))}
          />
        </Space>
      ) : (
        <RankCompactEmpty
          rankedCount={rankedCount}
          monitoredCount={monitoredCount}
        />
      )}
    </div>
  )
}

function RankInsightStrip({ summary }: { summary: RankReportSummary }) {
  return (
    <div className="competitor-analysis-rank-insight-strip">
      <RankInsightItem label="最新自然位" value={summary.latestOrganicText} tone={summary.latestOrganicRank ? 'strong' : 'muted'} />
      <RankInsightItem label="15日" value={summary.organicChangeText} tone={summary.organicChangeText === '暂无趋势' ? 'muted' : 'strong'} />
      <RankInsightItem label="广告" value={summary.adDaysText} tone={summary.adDaysText.startsWith('0/') ? 'muted' : 'strong'} />
      <RankInsightItem label="最强竞品" value={summary.bestCompetitorText} tone={summary.bestCompetitorText === '暂无竞品排名' ? 'muted' : 'strong'} />
    </div>
  )
}

function RankInsightItem({
  label,
  value,
  tone
}: {
  label: string
  value: string
  tone: 'strong' | 'muted'
}) {
  return (
    <div className={`competitor-analysis-rank-insight-item competitor-analysis-rank-insight-item-${tone}`}>
      <Text type="secondary">{label}</Text>
      <Text strong ellipsis={{ tooltip: value }}>{value}</Text>
    </div>
  )
}

function RankCompactEmpty({
  rankedCount,
  monitoredCount
}: {
  rankedCount: number
  monitoredCount: number
}) {
  return (
    <div className="competitor-analysis-rank-empty-panel">
      <Text strong>本关键词暂无可绘制排名</Text>
      <Text type="secondary">
        本品最近无排名数据，监控竞品 {rankedCount} in {monitoredCount}
      </Text>
    </div>
  )
}

function RankHeatmap({ rows, dates }: { rows: RankHeatmapRow[]; dates: string[] }) {
  return (
    <Card
      size="small"
      variant="borderless"
      className="competitor-analysis-rank-heatmap-card"
      title={
        <Space size={8} wrap>
          <Text strong>排名热力矩阵</Text>
          <Text type="secondary">颜色越深代表排名越靠前，AD 表示当天出现广告位。</Text>
        </Space>
      }
    >
      <div
        className="competitor-analysis-rank-heatmap"
        style={{ gridTemplateColumns: `minmax(132px, 1.15fr) repeat(${dates.length}, minmax(58px, 1fr))` }}
      >
        <div className="competitor-analysis-rank-heatmap-corner">商品</div>
        {dates.map((date) => (
          <div key={date} className="competitor-analysis-rank-heatmap-date">
            {date}
          </div>
        ))}
        {rows.map((row) => (
          <RankHeatmapRowView key={row.productCode} row={row} />
        ))}
      </div>
    </Card>
  )
}

function RankHeatmapRowView({ row }: { row: RankHeatmapRow }) {
  return (
    <>
      <div className={`competitor-analysis-rank-heatmap-product${row.isSelf ? ' competitor-analysis-rank-heatmap-product-self' : ''}`}>
        <span style={{ background: row.color }} />
        <Text strong={row.isSelf} ellipsis={{ tooltip: row.name }}>
          {row.name}
        </Text>
        {!row.isSelf && row.productUrl ? (
          <Tooltip title="打开 Noon 商品详情">
            <Button
              aria-label={`打开 Noon 商品 ${row.productCode}`}
              className="competitor-analysis-competitor-link-button"
              href={row.productUrl}
              icon={<ExportOutlined />}
              size="small"
              target="_blank"
              type="text"
            />
          </Tooltip>
        ) : null}
      </div>
      {row.cells.map((cell) => (
        <div
          key={`${row.productCode}-${cell.dateLabel}`}
          className={`competitor-analysis-rank-heatmap-cell competitor-analysis-rank-heatmap-cell-${cell.band}`}
          title={`${row.name} ${cell.dateLabel} ${cell.rankNo ? `第 ${cell.rankNo} 名` : formatNotInRankRangeText(cell.scanDepth)}${cell.adRankNo ? `，广告第 ${cell.adRankNo} 名` : ''}`}
        >
          <span>{cell.rankNo ? cell.rankNo : '-'}</span>
          {cell.adRankNo ? <em>AD {cell.adRankNo}</em> : null}
        </div>
      ))}
    </>
  )
}
