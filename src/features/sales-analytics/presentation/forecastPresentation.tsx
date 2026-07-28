import type { EChartsCoreOption } from 'echarts/core'
import { Typography } from 'antd'
import type { SalesForecastDailyForecast } from '../../sales-forecast/types'
import type { DailySalesFact } from '../types'
import type { DateRangeValue } from '../model/pageTypes'
import { datesBetween, formatChartUnits, numericForecastValue } from './formatters'

const { Text } = Typography

export function SummaryStrip({ items }: { items: Array<{ title: string; value: string }> }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        overflowX: 'auto'
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.title}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: '1 0 max-content',
            padding: index === 0 ? '0 18px 0 0' : '0 18px',
            borderLeft: index ? '1px solid #e5e7eb' : undefined
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>
          <Text strong style={{ fontSize: 16 }}>{item.value}</Text>
        </div>
      ))}
    </div>
  )
}

export function SummaryTile({ title, value, testId }: { title: string; value: string; testId?: string }) {
  return (
    <div data-testid={testId} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

export function buildActualAndForecastChartOption(
  actualFacts: DailySalesFact[],
  forecastPoints: SalesForecastDailyForecast[],
  range: DateRangeValue
): EChartsCoreOption | null {
  const axisDates = datesBetween(range)
  if (!axisDates.length) return null
  const actualByDate = new Map(
    actualFacts
      .filter((fact) => fact.factDate)
      .map((fact) => [fact.factDate, typeof fact.netUnits === 'number' ? fact.netUnits : 0])
  )
  const forecastByDate = new Map(
    forecastPoints
      .filter((point) => point.forecastDate)
      .map((point) => [String(point.forecastDate), numericForecastValue(point.forecastUnits)])
  )
  const actualValues = axisDates.map((date) => actualByDate.has(date) ? actualByDate.get(date) ?? 0 : null)
  const forecastValues = axisDates.map((date) => forecastByDate.has(date) ? forecastByDate.get(date) ?? 0 : null)
  const hasData = actualValues.some((value) => value !== null) || forecastValues.some((value) => value !== null)
  if (!hasData) return null
  return {
    legend: {
      bottom: 0,
      data: ['实际销量', '预测销量'],
      icon: 'roundRect'
    },
    grid: {
      bottom: 42,
      containLabel: true,
      left: 8,
      right: 14,
      top: 28
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
        const items = Array.isArray(params) ? params : [params]
        const first = items[0]
        const dataIndex = typeof first === 'object' && first && 'dataIndex' in first ? Number((first as { dataIndex: number }).dataIndex) : 0
        const date = axisDates[dataIndex]
        const rows = items
          .map((item) => {
            if (!item || typeof item !== 'object') return ''
            const seriesName = 'seriesName' in item ? String((item as { seriesName: string }).seriesName) : ''
            const value = 'value' in item ? (item as { value?: number | null }).value : null
            if (value === null || value === undefined || !Number.isFinite(Number(value))) return ''
            const color = seriesName === '实际销量' ? '#14b8a6' : '#1677ff'
            return `
              <div style="display:flex;align-items:center;gap:8px;color:#475569;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${color};"></span>
                <span>${seriesName}</span>
                <span style="font-weight:700;color:#111827;">${formatChartUnits(Number(value))}</span>
                <span>件</span>
              </div>
            `
          })
          .filter(Boolean)
          .join('')
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${date}</div>
          ${rows}
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
      data: axisDates.map((date) => date.slice(5)),
      type: 'category'
    },
    yAxis: {
      axisLabel: {
        color: '#64748b'
      },
      axisTick: {
        show: false
      },
      name: '预测销量',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#64748b',
        fontWeight: 600,
        padding: [0, 0, 0, 44]
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
        data: actualValues,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#14b8a6'
        },
        lineStyle: {
          color: '#14b8a6',
          width: 2
        },
        name: '实际销量',
        showSymbol: false,
        smooth: true,
        type: 'line'
      },
      {
        areaStyle: {
          color: {
            colorStops: [
              {
                color: 'rgba(22, 119, 255, 0.20)',
                offset: 0
              },
              {
                color: 'rgba(20, 184, 166, 0.03)',
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
        data: forecastValues,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#1677ff'
        },
        lineStyle: {
          color: '#1677ff',
          type: 'dashed',
          width: 2
        },
        name: '预测销量',
        showSymbol: false,
        smooth: true,
        type: 'line'
      }
    ]
  }
}
