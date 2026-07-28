import type { EChartsCoreOption } from 'echarts/core'
import type { CompetitorDashboardProductItem, CompetitorWatchProduct } from './types'
import { chartDataItem, DASHBOARD_TOOLTIP_BASE, escapeDashboardHtml } from './dashboardChartShared'

const WORKLOAD_COLORS = ['#ef4444', '#2563eb', '#16a34a']

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
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeDashboardHtml(point?.title || point?.label || '')}</div>
          <div style="color:#475569;">${escapeDashboardHtml(point?.partnerSku || '')}</div>
          <div style="font-weight:700;color:#111827;margin-top:6px;">${escapeDashboardHtml(valueName)} ${point?.value || 0}${targetText}</div>
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
            return `<div>${item.marker || ''}${escapeDashboardHtml(item.seriesName || '')}: <strong>${item.value || 0}</strong></div>`
          })
          .join('')
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeDashboardHtml(point?.partnerSku || point?.title || '')}</div>
          <div style="color:#475569;margin-bottom:6px;">${escapeDashboardHtml(point?.title || '')}</div>
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
