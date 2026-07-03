import type { EChartsCoreOption } from 'echarts/core'
import type {
  CompetitorDashboardProductItem,
  CompetitorDashboardRankChangeItem,
  CompetitorDashboardSummaryItem,
  CompetitorDashboardTrendItem,
  CompetitorWatchProduct
} from './types'

const DASHBOARD_COLORS = ['#2563eb', '#f59e0b', '#dc2626', '#0891b2', '#16a34a', '#7c3aed']
const WORKLOAD_COLORS = ['#ef4444', '#2563eb', '#16a34a']
const RANK_UP_COLOR = '#16a34a'
const RANK_DOWN_COLOR = '#dc2626'
const RANK_NEUTRAL_COLOR = '#64748b'
const RANK_CHANGE_DISPLAY_LIMIT = 100
const DASHBOARD_TOOLTIP_CSS = [
  'max-width:420px',
  'white-space:normal',
  'word-break:break-word',
  'overflow-wrap:anywhere',
  'line-height:1.45',
  'pointer-events:auto',
  'user-select:text'
].join(';')

const DASHBOARD_TOOLTIP_BASE = {
  appendToBody: false,
  confine: true,
  enterable: true,
  extraCssText: DASHBOARD_TOOLTIP_CSS,
  hideDelay: 400,
  transitionDuration: 0
}

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
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeHtml(point?.partnerSku || point?.title || '')}</div>
          <div style="color:#475569;margin-bottom:6px;">${escapeHtml(point?.keyword || '未记录关键词')}</div>
          <div style="font-weight:700;color:#111827;margin-top:6px;">${escapeHtml(rankChangeText(point))}</div>
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

export function buildIssueSummaryOption(items: CompetitorDashboardSummaryItem[]): EChartsCoreOption {
  return {
    color: DASHBOARD_COLORS,
    grid: {
      bottom: 18,
      containLabel: true,
      left: 12,
      right: 34,
      top: 16
    },
    tooltip: {
      ...DASHBOARD_TOOLTIP_BASE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      axisLabel: { color: '#64748b', hideOverlap: true },
      axisTick: { show: false },
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
      type: 'value'
    },
    yAxis: {
      axisLabel: { color: '#334155' },
      axisTick: { show: false },
      data: items.map((item) => item.label),
      inverse: true,
      type: 'category'
    },
    series: [
      {
        barMaxWidth: 22,
        data: items.map((item) => item.value),
        label: {
          color: '#334155',
          formatter: '{c}',
          position: 'right',
          show: true
        },
        name: '待处理',
        type: 'bar'
      }
    ]
  }
}

export function buildIssueTrendOption(items: CompetitorDashboardTrendItem[]): EChartsCoreOption {
  const dates = Array.from(new Set(items.map((item) => item.date).filter(Boolean))).sort()
  const labels = Array.from(new Set(items.map((item) => item.label).filter(Boolean)))
  return {
    color: DASHBOARD_COLORS,
    grid: {
      bottom: 24,
      containLabel: true,
      left: 8,
      right: 14,
      top: labels.length > 1 ? 48 : 28
    },
    legend: labels.length > 1 ? { top: 4, textStyle: { color: '#64748b' } } : undefined,
    tooltip: {
      ...DASHBOARD_TOOLTIP_BASE,
      trigger: 'axis'
    },
    xAxis: {
      axisLabel: { color: '#64748b', hideOverlap: true },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      boundaryGap: false,
      data: dates.map(formatShortDate),
      type: 'category'
    },
    yAxis: {
      axisLabel: { color: '#64748b' },
      axisTick: { show: false },
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
      type: 'value'
    },
    series: (labels.length ? labels : ['待处理']).map((label) => ({
      data: dates.map((date) =>
        items
          .filter((item) => item.date === date && (labels.length ? item.label === label : true))
          .reduce((sum, item) => sum + item.value, 0)
      ),
      emphasis: { focus: 'series' },
      name: label,
      showSymbol: true,
      smooth: true,
      type: 'line'
    }))
  }
}

export function buildDashboardBarOption(
  items: CompetitorDashboardProductItem[],
  valueName: string
): EChartsCoreOption {
  const visibleItems = items.slice().reverse()
  return {
    color: ['#2563eb'],
    grid: {
      bottom: 16,
      containLabel: true,
      left: 12,
      right: 26,
      top: 18
    },
    tooltip: {
      ...DASHBOARD_TOOLTIP_BASE,
      axisPointer: { type: 'shadow' },
      trigger: 'axis',
      formatter: (params: unknown) => {
        const item = chartDataItem(params)
        const point = visibleItems[item.dataIndex || 0]
        const targetText = point?.targetValue ? ` / 目标 ${point.targetValue}` : ''
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeHtml(point?.title || point?.label || '')}</div>
          <div style="color:#475569;">${escapeHtml(point?.partnerSku || '')}</div>
          <div style="font-weight:700;color:#111827;margin-top:6px;">${escapeHtml(valueName)} ${point?.value || 0}${targetText}</div>
        `
      }
    },
    xAxis: {
      axisLabel: { color: '#64748b', hideOverlap: true },
      axisTick: { show: false },
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
      type: 'value'
    },
    yAxis: {
      axisLabel: {
        color: '#334155',
        overflow: 'truncate',
        width: 120
      },
      axisTick: { show: false },
      data: visibleItems.map((item) => item.label || item.partnerSku || item.title || '-'),
      type: 'category'
    },
    series: [
      {
        barMaxWidth: 18,
        data: visibleItems.map((item) => item.value),
        label: {
          color: '#334155',
          formatter: '{c}',
          position: 'right',
          show: true
        },
        name: valueName,
        type: 'bar'
      }
    ]
  }
}

export function buildCurrentProductWorkloadOption(items: CompetitorWatchProduct[]): EChartsCoreOption {
  const visibleItems = items.slice(0, 10)
  return {
    color: WORKLOAD_COLORS,
    grid: {
      bottom: 18,
      containLabel: true,
      left: 12,
      right: 22,
      top: 36
    },
    legend: {
      top: 0,
      itemHeight: 8,
      itemWidth: 10,
      textStyle: { color: '#64748b' }
    },
    tooltip: {
      ...DASHBOARD_TOOLTIP_BASE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const seriesItems = Array.isArray(params) ? params : []
        const point = visibleItems[chartDataItem(seriesItems[0]).dataIndex || 0]
        const metrics = seriesItems
          .map((entry) => {
            const item = entry as { marker?: string; seriesName?: string; value?: number }
            return `<div>${item.marker || ''}${escapeHtml(item.seriesName || '')}: <strong>${item.value || 0}</strong></div>`
          })
          .join('')
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeHtml(point?.partnerSku || point?.title || '')}</div>
          <div style="color:#475569;margin-bottom:6px;">${escapeHtml(point?.title || '')}</div>
          ${metrics}
        `
      }
    },
    xAxis: {
      axisLabel: { color: '#64748b', hideOverlap: true },
      axisTick: { show: false },
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
      type: 'value'
    },
    yAxis: {
      axisLabel: {
        color: '#334155',
        overflow: 'truncate',
        width: 128
      },
      axisTick: { show: false },
      data: visibleItems.map((item) => item.partnerSku || item.title || '-'),
      inverse: true,
      type: 'category'
    },
    series: [
      {
        barMaxWidth: 18,
        data: visibleItems.map((item) => item.pendingCandidateCount || 0),
        name: '待确认',
        stack: 'workload',
        type: 'bar'
      },
      {
        barMaxWidth: 18,
        data: visibleItems.map((item) => item.activeKeywordCount || 0),
        name: '关键词',
        stack: 'workload',
        type: 'bar'
      },
      {
        barMaxWidth: 18,
        data: visibleItems.map((item) => item.confirmedCompetitorCount || 0),
        name: '已确认',
        stack: 'workload',
        type: 'bar'
      }
    ]
  }
}

function chartDataItem(params: unknown) {
  if (Array.isArray(params)) {
    return chartDataItem(params[0])
  }
  if (typeof params === 'object' && params) {
    return params as { dataIndex?: number }
  }
  return { dataIndex: 0 }
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

function formatShortDate(date: string) {
  return date.slice(5) || date
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
