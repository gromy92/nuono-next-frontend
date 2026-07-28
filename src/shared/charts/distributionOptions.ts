import type { EChartsCoreOption } from 'echarts/core'
import { formatChartNumber } from './chartOptionFormatters'
import type { DistributionPoint } from './chartOptionTypes'

export function buildDistributionPieOption(
  items: DistributionPoint[],
  {
    seriesName = '分布',
    unit = ''
  }: {
    seriesName?: string
    unit?: string
  } = {}
): EChartsCoreOption {
  const data = items.map((item) => ({
    name: item.label,
    value: Number(item.value || 0)
  }))

  return {
    legend: {
      bottom: 0,
      itemGap: 12,
      textStyle: {
        color: '#64748b'
      },
      type: 'scroll'
    },
    series: [
      {
        avoidLabelOverlap: true,
        data,
        emphasis: {
          label: {
            fontSize: 14,
            fontWeight: 700,
            show: true
          }
        },
        label: {
          color: '#334155',
          formatter: '{b}: {c}',
          overflow: 'break',
          width: 110
        },
        name: seriesName,
        radius: ['42%', '68%'],
        type: 'pie'
      }
    ],
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      borderRadius: 8,
      borderWidth: 1,
      formatter: (params: unknown) => {
        const point = params as { name?: string; value?: number; percent?: number }
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${point.name || seriesName}</div>
          <div style="color:#475569;">
            <span>${seriesName}</span>
            <span style="font-weight:700;color:#111827;margin-left:8px;">${formatChartNumber(point.value)}</span>
            <span>${unit}</span>
            <span style="margin-left:8px;color:#64748b;">${Number(point.percent || 0).toFixed(1)}%</span>
          </div>
        `
      },
      padding: [10, 12],
      trigger: 'item'
    }
  }
}

export function buildHorizontalBarOption(
  items: DistributionPoint[],
  {
    seriesName = '数量',
    unit = ''
  }: {
    seriesName?: string
    unit?: string
  } = {}
): EChartsCoreOption {
  const rows = [...items].sort((left, right) => Number(right.value || 0) - Number(left.value || 0))

  return {
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: 18,
      top: 18
    },
    series: [
      {
        barMaxWidth: 18,
        data: rows.map((item) => Number(item.value || 0)),
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: '#1677ff'
        },
        label: {
          color: '#334155',
          formatter: `{c}${unit}`,
          position: 'right',
          show: true
        },
        name: seriesName,
        type: 'bar'
      }
    ],
    tooltip: {
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      borderRadius: 8,
      borderWidth: 1,
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params
        const name = typeof item === 'object' && item && 'name' in item ? String((item as { name?: string }).name || '') : seriesName
        const value = typeof item === 'object' && item && 'value' in item ? Number((item as { value?: number }).value || 0) : 0
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${name}</div>
          <div style="color:#475569;">
            <span>${seriesName}</span>
            <span style="font-weight:700;color:#111827;margin-left:8px;">${formatChartNumber(value)}</span>
            <span>${unit}</span>
          </div>
        `
      },
      padding: [10, 12],
      trigger: 'axis'
    },
    xAxis: {
      axisLabel: {
        color: '#64748b'
      },
      axisTick: {
        show: false
      },
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed'
        }
      },
      type: 'value'
    },
    yAxis: {
      axisLabel: {
        color: '#334155',
        interval: 0,
        overflow: 'truncate',
        width: 120
      },
      axisTick: {
        show: false
      },
      data: rows.map((item) => item.label),
      inverse: true,
      type: 'category'
    }
  }
}
