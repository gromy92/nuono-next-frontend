import { Segmented, Tooltip, Typography, Tag } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import type { EChartsCoreOption } from 'echarts/core'
import type { ReactNode } from 'react'
import { EChartPanel } from '../../shared/charts'
import type { SearchRunStatus } from './types'
import {
  DASHBOARD_DAYS_OPTIONS,
  RANK_CHANGE_DIRECTION_OPTIONS,
  dashboardDaysSummary,
  type DashboardDays,
  type RankChangeDirection
} from './dashboardShared'

const { Text } = Typography

export function DashboardChartCard({
  title,
  description,
  days,
  onDaysChange,
  option,
  loading,
  empty,
  testId,
  ariaLabel,
  height,
  onChartClick
}: {
  title: string
  description: string
  days?: DashboardDays
  onDaysChange?: (days: DashboardDays) => void
  option: EChartsCoreOption
  loading: boolean
  empty: boolean
  testId: string
  ariaLabel: string
  height: number
  onChartClick: (dataIndex?: number, seriesName?: string) => void
}) {
  return (
    <section className="competitor-analysis-dashboard-panel">
      <PanelHeader
        title={title}
        explanation={description}
        summary={days ? dashboardDaysSummary(days) : undefined}
        action={days && onDaysChange ? <ChartDaysSelector value={days} onChange={onDaysChange} ariaLabel={`${title}时间范围`} /> : undefined}
      />
      <EChartPanel
        option={option}
        state={loading ? 'loading' : empty ? 'empty' : 'ready'}
        emptyText="当前没有这类数据"
        height={height}
        testId={testId}
        ariaLabel={ariaLabel}
        onChartClick={(params) => onChartClick(params.dataIndex, params.seriesName)}
      />
    </section>
  )
}

export function PanelHeader({
  title,
  explanation,
  summary,
  action
}: {
  title: string
  explanation: string
  summary?: string
  action?: ReactNode
}) {
  return (
    <div className="competitor-analysis-dashboard-panel-header">
      <div>
        <span className="competitor-analysis-dashboard-panel-title">
          <Text strong>{title}</Text>
          <Tooltip title={explanation} placement="top">
            <ExclamationCircleOutlined className="competitor-analysis-dashboard-info-icon" role="img" aria-label={`${title}说明`} />
          </Tooltip>
        </span>
        {summary ? <Text type="secondary">{summary}</Text> : null}
      </div>
      {action ? <div className="competitor-analysis-dashboard-panel-action">{action}</div> : null}
    </div>
  )
}

export function ChartDaysSelector({
  value,
  onChange,
  ariaLabel
}: {
  value: DashboardDays
  onChange: (days: DashboardDays) => void
  ariaLabel: string
}) {
  return (
    <Segmented
      aria-label={ariaLabel}
      size="small"
      value={value}
      onChange={(nextValue) => onChange(Number(nextValue) as DashboardDays)}
      options={DASHBOARD_DAYS_OPTIONS}
    />
  )
}

export function RankDirectionSelector({
  value,
  onChange,
  ariaLabel
}: {
  value: RankChangeDirection
  onChange: (direction: RankChangeDirection) => void
  ariaLabel: string
}) {
  return (
    <Segmented
      aria-label={ariaLabel}
      size="small"
      value={value}
      onChange={(nextValue) => onChange(String(nextValue) as RankChangeDirection)}
      options={RANK_CHANGE_DIRECTION_OPTIONS}
    />
  )
}

export function RunStatusTag({ status }: { status: SearchRunStatus }) {
  const statusView = runStatusView(status)
  return <Tag color={statusView.color}>{statusView.label}</Tag>
}

function runStatusView(status: SearchRunStatus) {
  if (status === 'succeeded') return { label: '成功', color: 'success' }
  if (status === 'running') return { label: '运行中', color: 'processing' }
  if (status === 'partial_failed') return { label: '部分失败', color: 'warning' }
  if (status === 'captcha_required') return { label: '验证码', color: 'warning' }
  if (status === 'parse_failed') return { label: '解析失败', color: 'error' }
  if (status === 'provider_unavailable') return { label: '服务不可用', color: 'error' }
  return { label: '未运行', color: 'default' }
}
