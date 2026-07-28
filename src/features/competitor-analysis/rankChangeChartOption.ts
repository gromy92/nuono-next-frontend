import type { EChartsCoreOption } from 'echarts/core'
import type { CompetitorDashboardRankChangeItem } from './types'
import { chartDataItem, DASHBOARD_TOOLTIP_BASE, escapeDashboardHtml } from './dashboardChartShared'

const RANK_UP_COLOR = '#16a34a'
const RANK_DOWN_COLOR = '#dc2626'
const RANK_NEUTRAL_COLOR = '#64748b'
const RANK_CHANGE_DISPLAY_LIMIT = 100

export function buildRankChangeChartOption(
  items: CompetitorDashboardRankChangeItem[],
  seriesName: string
): EChartsCoreOption {
  const visibleItems = items.slice(0, RANK_CHANGE_DISPLAY_LIMIT)
  const denseMode = visibleItems.length > 16
  return {
    color: [RANK_UP_COLOR, RANK_DOWN_COLOR],
    grid: {
      bottom: 58,
      containLabel: true,
      left: 46,
      right: 26,
      top: 22
    },
    tooltip: {
      ...DASHBOARD_TOOLTIP_BASE,
      axisPointer: { type: 'shadow' },
      trigger: 'axis',
      formatter: (params: unknown) => {
        const point = visibleItems[chartDataItem(params).dataIndex || 0]
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeDashboardHtml(point?.partnerSku || point?.title || '')}</div>
          <div style="color:#475569;margin-bottom:6px;">${escapeDashboardHtml(point?.keyword || '未记录关键词')}</div>
          <div style="font-weight:700;color:#111827;margin-top:6px;">${escapeDashboardHtml(rankChangeText(point))}</div>
        `
      }
    },
    xAxis: {
      axisLabel: {
        color: '#334155',
        interval: denseMode ? 'auto' : 0,
        overflow: 'truncate',
        rotate: denseMode ? 35 : 28,
        width: denseMode ? 64 : 82
      },
      axisTick: { show: false },
      data: visibleItems.map((item) => rankChangeAxisLabel(item)),
      type: 'category'
    },
    yAxis: {
      axisLabel: {
        color: '#64748b',
        formatter: (value: number) => (value > 0 ? `+${value}` : String(value))
      },
      axisLine: { lineStyle: { color: '#94a3b8' }, show: true },
      axisTick: { show: false },
      name: '排名变化',
      nameGap: 18,
      nameTextStyle: { color: '#64748b', fontSize: 12 },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
      type: 'value'
    },
    series: [
      {
        barMaxWidth: 26,
        data: visibleItems.map((item) => ({
          itemStyle: { color: item.rankDelta > 0 ? RANK_UP_COLOR : item.rankDelta < 0 ? RANK_DOWN_COLOR : RANK_NEUTRAL_COLOR },
          label: { position: item.rankDelta < 0 ? 'bottom' : 'top' },
          value: item.rankDelta
        })),
        label: {
          color: '#334155',
          formatter: (params: unknown) => rankChangeLabel(visibleItems[chartDataItem(params).dataIndex || 0]),
          position: 'top',
          show: !denseMode
        },
        name: seriesName,
        type: 'bar'
      }
    ]
  }
}

function rankChangeLabel(item?: CompetitorDashboardRankChangeItem) {
  if (!item) return ''
  if (item.previousRankStatus !== 'ranked' && item.rankStatus === 'ranked') return '进榜'
  if (item.previousRankStatus === 'ranked' && item.rankStatus !== 'ranked') return '出榜'
  if (item.rankDelta > 0) return `+${item.rankDelta}`
  if (item.rankDelta < 0) return `${item.rankDelta}`
  return '0'
}

function rankChangeText(item?: CompetitorDashboardRankChangeItem) {
  if (!item) return ''
  return `${rankDisplay(item.previousRankStatus, item.previousRankNo)} → ${rankDisplay(item.rankStatus, item.rankNo)}（${rankChangeLabel(item)}）`
}

function rankChangeAxisLabel(item?: CompetitorDashboardRankChangeItem) {
  if (!item) return '-'
  return item.keyword || item.partnerSku || item.noonProductCode || '-'
}

function rankDisplay(status?: CompetitorDashboardRankChangeItem['rankStatus'], rankNo?: number) {
  return status === 'ranked' && rankNo ? `#${rankNo}` : '未进榜'
}
