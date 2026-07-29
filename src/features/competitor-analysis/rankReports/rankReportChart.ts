import type { EChartsCoreOption } from 'echarts/core'
import { buildRankChartProductSeries, colorByProduct } from './rankReportModel'
import type {
  ReportChartLineMeta,
  ReportChartLineSeries,
  SelfRankKeywordReport
} from './rankReportTypes'

export function buildSelfRankChartOption(report: SelfRankKeywordReport): EChartsCoreOption {
  const dates = report.points.map((point) => point.date.slice(5))
  const productSeriesList = buildRankChartProductSeries(report)
  const seriesMeta: ReportChartLineMeta[] = []
  const series = productSeriesList.flatMap((productSeries, productIndex) => {
    const color = colorByProduct(productIndex)
    const isSelf = productIndex === 0
    const productName = isSelf ? '本品' : productSeries.name
    const lineWidth = isSelf ? 3 : 2
    const symbolSize = isSelf ? 7 : 5
    const lines: ReportChartLineSeries[] = [
      {
        id: `${productSeries.productCode}-organic`,
        name: productName,
        type: 'line',
        smooth: true,
        symbolSize,
        connectNulls: false,
        itemStyle: { color },
        lineStyle: { color, width: lineWidth },
        data: productSeries.organicData
      }
    ]
    seriesMeta.push({ productName, lineKind: '自然', color })
    if (productSeries.adData.some((rank) => typeof rank === 'number')) {
      lines.push({
        id: `${productSeries.productCode}-ad`,
        name: productName,
        type: 'line',
        smooth: true,
        symbolSize,
        connectNulls: false,
        itemStyle: { color },
        lineStyle: {
          color,
          type: 'dashed',
          width: Math.max(1.5, lineWidth - 0.4)
        },
        data: productSeries.adData
      })
      seriesMeta.push({ productName, lineKind: '广告', color })
    }
    return lines
  })

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => formatRankChartTooltip(params, seriesMeta)
    },
    legend: {
      top: 0,
      left: 0,
      data: productSeriesList.map((productSeries, index) =>
        index === 0 ? '本品' : productSeries.name
      )
    },
    grid: { top: 68, right: 20, bottom: 28, left: 42 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      inverse: true,
      min: 1,
      max: 200,
      splitNumber: 5,
      axisLabel: { formatter: (value: number) => `${value}` },
      splitArea: {
        show: true,
        areaStyle: {
          color: [
            'rgba(82, 196, 26, 0.10)',
            'rgba(149, 222, 100, 0.08)',
            'rgba(250, 219, 20, 0.08)',
            'rgba(217, 217, 217, 0.12)'
          ]
        }
      }
    },
    series
  }
}

function formatRankChartTooltip(params: unknown, seriesMeta: ReportChartLineMeta[]) {
  const items = Array.isArray(params) ? params : [params]
  const validItems = items.filter(isTooltipParam)
  const axisLabel = validItems[0]?.axisValueLabel || validItems[0]?.name || ''
  const rows = validItems
    .map((item) => {
      const meta = seriesMeta[item.seriesIndex]
      if (!meta || typeof item.value !== 'number') {
        return ''
      }
      return `<div style="display:flex;align-items:center;gap:6px;line-height:20px;"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${meta.color};"></span><span>${escapeHtml(meta.productName)} ${meta.lineKind}</span><strong>第 ${item.value} 名</strong></div>`
    })
    .filter(Boolean)
    .join('')
  return `<div style="min-width:140px;"><div style="font-weight:600;margin-bottom:4px;">${escapeHtml(String(axisLabel))}</div>${rows || '<span style="color:#8c8c8c;">暂无排名</span>'}</div>`
}

function isTooltipParam(value: unknown): value is {
  axisValueLabel?: string
  name?: string
  seriesIndex: number
  value: unknown
} {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'seriesIndex' in value &&
      'value' in value
  )
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
