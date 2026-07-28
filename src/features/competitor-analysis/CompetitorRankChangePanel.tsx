import { Space } from 'antd'
import { useMemo } from 'react'
import { EChartPanel } from '../../shared/charts'
import { buildRankChangeChartOption } from './dashboardCharts'
import type { CompetitorDashboardRankChangeItem } from './types'
import { ChartDaysSelector, PanelHeader, RankDirectionSelector } from './CompetitorDashboardCommon'
import { dashboardDaysSummary, type DashboardDays, type RankChangeDirection } from './dashboardShared'

export function RankChangePanel({
  title,
  explanation,
  loading,
  days,
  onDaysChange,
  direction,
  onDirectionChange,
  items,
  emptyText,
  testId,
  fullWidth,
  onItemClick
}: {
  title: string
  explanation: string
  loading: boolean
  days: DashboardDays
  onDaysChange: (days: DashboardDays) => void
  direction?: RankChangeDirection
  onDirectionChange?: (direction: RankChangeDirection) => void
  items: CompetitorDashboardRankChangeItem[]
  emptyText: string
  testId: string
  fullWidth?: boolean
  onItemClick: (item: CompetitorDashboardRankChangeItem) => void
}) {
  const chartOption = useMemo(() => buildRankChangeChartOption(items, title), [items, title])
  const chartItems = useMemo(() => items.slice(0, 100), [items])
  const directionLabel = direction === 'UP' ? '增长 Top' : direction === 'DOWN' ? '下降 Top' : '最新'

  return (
    <section className={`competitor-analysis-dashboard-panel competitor-analysis-dashboard-priority-panel${fullWidth ? ' competitor-analysis-dashboard-priority-panel-wide' : ''}`}>
      <PanelHeader
        title={title}
        explanation={explanation}
        summary={`${dashboardDaysSummary(days)} · ${directionLabel} ${items.length} 条关键词变化`}
        action={
          <Space size={6} wrap>
            <ChartDaysSelector value={days} onChange={onDaysChange} ariaLabel={`${title}时间范围`} />
            {direction && onDirectionChange ? (
              <RankDirectionSelector value={direction} onChange={onDirectionChange} ariaLabel={`${title}方向`} />
            ) : null}
          </Space>
        }
      />
      <EChartPanel
        option={chartOption}
        state={loading ? 'loading' : items.length ? 'ready' : 'empty'}
        emptyText={emptyText}
        height={fullWidth ? 320 : 260}
        testId={testId}
        ariaLabel={title}
        onChartClick={(params) => {
          const item = typeof params.dataIndex === 'number' ? chartItems[params.dataIndex] : undefined
          if (item) onItemClick(item)
        }}
      />
    </section>
  )
}
