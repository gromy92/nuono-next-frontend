import type { EChartsCoreOption } from 'echarts/core'
import type { CompetitorDashboardSummaryItem, CompetitorDashboardTrendItem } from './types'
import { DASHBOARD_COLORS, DASHBOARD_TOOLTIP_BASE } from './dashboardChartShared'

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

function formatShortDate(date: string) {
  return date.slice(5) || date
}
