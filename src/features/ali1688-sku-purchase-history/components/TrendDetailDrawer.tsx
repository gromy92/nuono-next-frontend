import { Drawer, Space, Table, Tag, Typography } from 'antd'
import type { EChartsCoreOption } from 'echarts/core'
import { useMemo } from 'react'
import { EChartPanel } from '../../../shared/charts'
import type { Ali1688SkuPurchaseHistoryItem } from '../../ali1688-historical-orders/types'
import type { PurchaseBatch } from '../model/pageTypes'
import {
  calculatePurchaseBatchMetrics,
  displayText,
  formatCurrency,
  formatNumberText,
  getReadyPurchaseBatchPoints,
  purchaseBatchLatestOrderTime,
  purchaseBatchOrderNos,
  purchaseBatchPriceQuality,
  purchaseBatchSupplierNames,
  purchaseBatchUnitPrice,
  priceQualityTag
} from '../model/purchaseBatchMetrics'
import { PurchaseSummaryCell } from './ProductPurchaseCells'

const { Text } = Typography

export function TrendDetailDrawer({
  record,
  batches,
  onClose
}: {
  record: Ali1688SkuPurchaseHistoryItem | null
  batches: PurchaseBatch[]
  onClose: () => void
}) {
  const metrics = calculatePurchaseBatchMetrics(batches)
  return (
    <Drawer
      title={`采购单价趋势 · ${displayText(record?.skuParent)}`}
      open={Boolean(record)}
      onClose={onClose}
      width={920}
      destroyOnClose
    >
      {record ? (
        <div className="ali1688-sku-trend-detail">
          <Space size={[10, 8]} wrap>
            <Tag color="red">最高采购单价: {formatCurrency(metrics.highestUnitPrice)}</Tag>
            <Tag color="blue">最低采购单价: {formatCurrency(metrics.lowestUnitPrice)}</Tag>
            <Tag>{displayText(record.storeCode)} · {displayText(record.siteCode)}</Tag>
          </Space>
          <LargePriceTrendChart batches={batches} />
          <Table<PurchaseBatch>
            rowKey={(item) => item.id}
            size="small"
            pagination={false}
            dataSource={batches}
            scroll={{ x: 780 }}
            columns={[
              {
                title: '批次',
                dataIndex: 'label',
                width: 90,
                render: (value) => displayText(value)
              },
              {
                title: '采购时间',
                width: 150,
                render: (_: unknown, batch) => displayText(purchaseBatchLatestOrderTime(batch))
              },
              {
                title: '来源订单',
                width: 180,
                render: (_: unknown, batch) => displayText(purchaseBatchOrderNos(batch).join('、'))
              },
              {
                title: '供应商',
                width: 180,
                render: (_: unknown, batch) => displayText(purchaseBatchSupplierNames(batch).join('、'))
              },
              {
                title: '采购数量',
                width: 90,
                render: (_: unknown, batch) => formatNumberText(batch.countedQuantity)
              },
              {
                title: '分摊金额',
                width: 110,
                render: (_: unknown, batch) => formatCurrency(batch.countedCost)
              },
              {
                title: '采购单价',
                width: 110,
                render: (_: unknown, batch) => formatCurrency(purchaseBatchUnitPrice(batch))
              },
              {
                title: '价格状态',
                width: 120,
                render: (_: unknown, batch) => priceQualityTag(purchaseBatchPriceQuality(batch))
              }
            ]}
          />
        </div>
      ) : null}
    </Drawer>
  )
}

export function LargePriceTrendChart({ batches }: { batches: PurchaseBatch[] }) {
  const option = useMemo(() => buildPurchaseBatchPriceTrendOption(batches), [batches])

  return (
    <EChartPanel
      ariaLabel="采购单价趋势图表"
      className="ali1688-sku-trend-chart-panel"
      emptyText="暂无可计算价格点"
      height={280}
      option={option}
      state={option ? 'ready' : 'empty'}
      testId="sku-purchase-price-trend-chart"
    />
  )
}

export function buildPurchaseBatchPriceTrendOption(batches: PurchaseBatch[]): EChartsCoreOption | null {
  const chartPoints = getReadyPurchaseBatchPoints(batches)
    .map((batch) => ({
      batch,
      value: purchaseBatchUnitPrice(batch)
    }))
    .filter((point): point is { batch: PurchaseBatch; value: number } => point.value !== null)

  if (!chartPoints.length) {
    return null
  }

  const values = chartPoints.map((point) => point.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const allSameValue = max === min
  const axisPadding = Math.max((max - min) * 0.18, max * 0.04, 0.05)
  const yMin = Math.max(0, min - axisPadding)
  const yMax = max + axisPadding
  const axisLabels = chartPoints.map((point) => purchaseBatchChartLabel(point.batch))

  return {
    grid: {
      bottom: 28,
      containLabel: true,
      left: 8,
      right: 22,
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
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      borderRadius: 8,
      borderWidth: 1,
      confine: true,
      extraCssText: 'box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);',
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params
        const dataIndex = typeof item === 'object' && item && 'dataIndex' in item ? Number((item as { dataIndex: number }).dataIndex) : 0
        const point = chartPoints[dataIndex]
        if (!point) {
          return ''
        }
        const orderNos = purchaseBatchOrderNos(point.batch).join('、')
        const supplierNames = purchaseBatchSupplierNames(point.batch).join('、')
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeChartHtml(point.batch.label)}</div>
          <div style="color:#64748b;margin-bottom:6px;">${escapeChartHtml(displayText(purchaseBatchLatestOrderTime(point.batch)))}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;color:#475569;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#2563eb;"></span>
            <span>采购单价</span>
            <span style="font-weight:700;color:#111827;">${escapeChartHtml(formatCurrency(point.value))}</span>
          </div>
          <div style="color:#64748b;">数量 ${escapeChartHtml(formatNumberText(point.batch.countedQuantity))} · 成本 ${escapeChartHtml(formatCurrency(point.batch.countedCost))}</div>
          <div style="color:#64748b;">订单 ${escapeChartHtml(displayText(orderNos))}</div>
          <div style="color:#64748b;">供应商 ${escapeChartHtml(displayText(supplierNames))}</div>
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
      data: axisLabels,
      type: 'category'
    },
    yAxis: {
      axisLabel: {
        color: '#64748b',
        formatter: (value: number) => `¥${Number(value).toFixed(2)}`
      },
      axisTick: {
        show: false
      },
      max: Number(yMax.toFixed(2)),
      min: Number(yMin.toFixed(2)),
      name: '采购单价',
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
        data: chartPoints.map((point) => {
          const isMax = !allSameValue && point.value === max
          const isMin = !allSameValue && point.value === min
          return {
            itemStyle: {
              borderColor: '#ffffff',
              borderWidth: 2,
              color: isMax ? '#dc2626' : isMin ? '#2563eb' : '#0f766e'
            },
            symbolSize: isMax || isMin ? 9 : 7,
            value: Number(point.value.toFixed(4))
          }
        }),
        emphasis: {
          focus: 'series'
        },
        lineStyle: {
          color: '#2563eb',
          width: 2.5
        },
        name: '采购单价',
        showSymbol: true,
        smooth: false,
        symbol: 'circle',
        type: 'line'
      }
    ]
  }
}

export function purchaseBatchChartLabel(batch: PurchaseBatch) {
  const latestTime = purchaseBatchLatestOrderTime(batch)
  if (!latestTime) {
    return batch.label
  }
  const match = latestTime.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const dateLabel = match ? `${match[2]}-${match[3]}` : latestTime
  return `${dateLabel}\n${batch.label}`
}

export function escapeChartHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
