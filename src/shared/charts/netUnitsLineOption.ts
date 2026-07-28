import type { EChartsCoreOption } from 'echarts/core'
import { formatChartNumber } from './chartOptionFormatters'
import type { LinePoint } from './chartOptionTypes'

export function buildNetUnitsLineOption(points: LinePoint[]): EChartsCoreOption {
  const values = points.map((point) => Number(point.value || 0))
  return {
    grid: {
      bottom: 24,
      containLabel: true,
      left: 8,
      right: 14,
      top: 32
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#94a3b8',
          type: 'dashed'
        },
        type: 'line'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      borderRadius: 8,
      borderWidth: 1,
      extraCssText: 'box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);',
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params
        const dataIndex = typeof item === 'object' && item && 'dataIndex' in item ? Number((item as { dataIndex: number }).dataIndex) : 0
        const point = points[dataIndex]
        const value = values[dataIndex]
        const fullDate = point?.fullDate || point?.date || ''
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${fullDate}</div>
          <div style="display:flex;align-items:center;gap:8px;color:#475569;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#5e3cde;"></span>
            <span>净销量</span>
            <span style="font-weight:700;color:#111827;">${formatChartNumber(value)}</span>
            <span>件</span>
          </div>
        `
      },
      padding: [10, 12],
      trigger: 'axis'
    },
    xAxis: {
      axisLabel: {
        color: '#64748b',
        hideOverlap: true
      },
      axisLine: {
        lineStyle: {
          color: '#cbd5e1'
        }
      },
      axisTick: {
        show: false
      },
      boundaryGap: false,
      data: points.map((point) => point.date),
      type: 'category'
    },
    yAxis: {
      axisLabel: {
        color: '#64748b'
      },
      axisTick: {
        show: false
      },
      minInterval: 1,
      name: '净销量',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#64748b',
        fontWeight: 600,
        padding: [0, 0, 0, 34]
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed'
        }
      },
      type: 'value'
    },
    series: [
      {
        areaStyle: {
          color: {
            colorStops: [
              {
                color: 'rgba(94, 60, 222, 0.24)',
                offset: 0.1
              },
              {
                color: 'rgba(94, 60, 222, 0.02)',
                offset: 1
              }
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1
          }
        },
        data: values,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          borderColor: '#5e3cde',
          borderWidth: 2,
          color: '#fff'
        },
        lineStyle: {
          color: '#5e3cde',
          width: 2.5
        },
        name: '净销量',
        showSymbol: true,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        type: 'line'
      }
    ]
  }
}
