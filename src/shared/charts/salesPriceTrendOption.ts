import type { EChartsCoreOption } from 'echarts/core'
import { formatChartNullableNumber, formatChartPrice } from './chartOptionFormatters'
import type { LinePoint, SalesPricePoint } from './chartOptionTypes'

export function buildSalesPriceTrendOption(
  salesPoints: LinePoint[],
  pricePoints: SalesPricePoint[]
): EChartsCoreOption {
  const salesByDate = new Map(salesPoints.map((point) => [point.fullDate || point.date, point]))
  const priceByDate = new Map(pricePoints.map((point) => [point.fullDate || point.date, point]))
  const xPoints = Array.from(new Set([...salesByDate.keys(), ...priceByDate.keys()]))
    .sort()
    .map((fullDate) => ({
      fullDate,
      date: salesByDate.get(fullDate)?.date || priceByDate.get(fullDate)?.date || fullDate
    }))
  const salesValues = xPoints.map((point) => salesByDate.get(point.fullDate)?.value ?? null)
  const priceValues = xPoints.map((point) => priceByDate.get(point.fullDate)?.avgOfferPrice ?? null)
  const currencyCode = pricePoints.find((point) => point.currencyCode)?.currencyCode || ''

  return {
    grid: {
      bottom: 24,
      containLabel: true,
      left: 8,
      right: 42,
      top: 56
    },
    legend: {
      itemGap: 18,
      right: 8,
      top: 6,
      textStyle: {
        color: '#64748b'
      }
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
        const axisPoint = xPoints[dataIndex]
        const pricePoint = axisPoint ? priceByDate.get(axisPoint.fullDate) : undefined
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${axisPoint?.fullDate || axisPoint?.date || ''}</div>
          <div style="display:flex;align-items:center;gap:8px;color:#475569;margin-bottom:4px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#168553;"></span>
            <span>净销量</span>
            <span style="font-weight:700;color:#111827;">${formatChartNullableNumber(salesValues[dataIndex])}</span>
            <span>件</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:#475569;margin-bottom:4px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#0f766e;"></span>
            <span>平均出单价</span>
            <span style="font-weight:700;color:#111827;">${formatChartPrice(pricePoint?.avgOfferPrice)}</span>
            <span>${pricePoint?.currencyCode || currencyCode}</span>
          </div>
          <div style="color:#64748b;">最低/最高 ${formatChartPrice(pricePoint?.minOfferPrice)} / ${formatChartPrice(pricePoint?.maxOfferPrice)}</div>
          <div style="color:#64748b;">订单行数 ${formatChartNullableNumber(pricePoint?.orderLineCount)} · 币种 ${pricePoint?.currencyCode || currencyCode || '-'}</div>
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
      data: xPoints.map((point) => point.date),
      type: 'category'
    },
    yAxis: [
      {
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
      {
        axisLabel: {
          color: '#64748b'
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        type: 'value'
      }
    ],
    series: [
      {
        data: salesValues,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          borderColor: '#168553',
          borderWidth: 2,
          color: '#fff'
        },
        lineStyle: {
          color: '#168553',
          width: 2.5
        },
        name: '净销量',
        showSymbol: true,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        type: 'line',
        yAxisIndex: 0
      },
      {
        connectNulls: true,
        data: priceValues,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          borderColor: '#0f766e',
          borderWidth: 2,
          color: '#fff'
        },
        lineStyle: {
          color: '#0f766e',
          width: 2.5
        },
        name: '出单价',
        showSymbol: true,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        type: 'line',
        yAxisIndex: 1
      }
    ]
  }
}
