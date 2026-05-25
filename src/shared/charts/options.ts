import type { EChartsCoreOption } from 'echarts/core'

export type LinePoint = {
  date: string
  fullDate?: string
  value: number
}

export type DistributionPoint = {
  key?: string
  label: string
  value: number
}

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

function formatChartNumber(value: number | undefined) {
  return Number(value || 0).toLocaleString()
}
