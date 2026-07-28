import { LineChartOutlined } from '@ant-design/icons'
import { Button, Empty, Popover, Space, Tag, Tooltip, Typography } from 'antd'
import { useEffect, useState } from 'react'
import type { Ali1688SkuPurchaseHistoryItem } from '../../ali1688-historical-orders/types'
import { normalizeNoonImageUrl } from '../../product-baseline'
import type { PurchaseBatch, PurchaseBatchMetrics } from '../model/pageTypes'
import {
  displayOptionalText,
  displayText,
  formatCurrency,
  formatNumberText,
  getLatestPurchaseBatch,
  getReadyPurchaseBatchPoints,
  purchaseBatchLatestOrderTime,
  purchaseBatchOrderNos,
  purchaseBatchPriceQuality,
  purchaseBatchSupplierNames,
  purchaseBatchUnitPrice
} from '../model/purchaseBatchMetrics'

const { Text } = Typography

export function SkuPurchaseHistoryEmptyState({ unlinkedAssignedLineCount }: { unlinkedAssignedLineCount: number }) {
  if (unlinkedAssignedLineCount > 0) {
    return (
      <Empty
        description={
          <div className="ali1688-sku-empty-state">
            <Text strong>当前筛选下没有已关联 SKU 采购历史</Text>
            <Text type="secondary">有 {unlinkedAssignedLineCount} 条已分配货品行尚未商品关联</Text>
          </div>
        }
      />
    )
  }
  return <Empty description="暂无 SKU 采购历史" />
}

export function ProductInfoCell({ record }: { record: Ali1688SkuPurchaseHistoryItem }) {
  const title = displayText(record.productTitle, record.partnerSku || record.skuParent)
  const visiblePsku = displayText(record.partnerSku)
  const visibleSku = displayText(record.skuParent)
  const titleCn = displayOptionalText(record.productTitleCn)
  return (
    <div className="ali1688-sku-product-cell">
      <SkuProductThumbnail src={record.productImageUrl} alt={title} linked={record.linkStatus !== 'unlinked'} />
      <div className="ali1688-sku-product-main">
        <Tooltip title={<ProductTitleTooltip title={title} titleCn={titleCn} />} placement="topLeft">
          <Text strong className="ali1688-sku-product-title">
            {title}
          </Text>
        </Tooltip>
        <Space wrap size={[10, 2]} className="ali1688-sku-product-identity">
          <span>
            <Text type="secondary">PSKU: </Text>
            <Text copyable={visiblePsku !== '-' ? { text: visiblePsku, tooltips: ['复制 PSKU', '已复制'] } : false}>
              {visiblePsku}
            </Text>
          </span>
          <span>
            <Text type="secondary">SKU: </Text>
            <Text copyable={visibleSku !== '-' ? { text: visibleSku, tooltips: ['复制 SKU', '已复制'] } : false}>
              {visibleSku}
            </Text>
          </span>
        </Space>
        <Space size={[6, 4]} wrap>
          {record.linkStatus === 'unlinked' ? <Tag>未关联</Tag> : <Tag color="green">已关联</Tag>}
          <Tag>店铺: {displayText(record.storeCode)} · {displayText(record.siteCode)}</Tag>
        </Space>
      </div>
    </div>
  )
}

export function ProductTitleTooltip({ title, titleCn }: { title: string; titleCn?: string }) {
  return (
    <div className="ali1688-sku-product-title-tooltip">
      <div>{title}</div>
      <div className="ali1688-sku-product-title-tooltip-cn">
        <span>中文名</span>
        <strong>{titleCn || '未维护'}</strong>
      </div>
    </div>
  )
}

export function SkuProductThumbnail({ src, alt, linked }: { src?: string; alt: string; linked?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const normalizedSrc = normalizeNoonImageUrl(src)

  useEffect(() => {
    setImageFailed(false)
  }, [normalizedSrc])

  if (!normalizedSrc || imageFailed) {
    return <span className={skuProductThumbnailClassName('ali1688-sku-product-thumbnail-placeholder', linked)}>无图</span>
  }
  return (
    <span className={skuProductThumbnailClassName('ali1688-sku-product-thumbnail', linked)}>
      <img src={normalizedSrc} alt={alt} onError={() => setImageFailed(true)} />
    </span>
  )
}

export function skuProductThumbnailClassName(baseClassName: string, linked?: boolean) {
  return linked ? `${baseClassName} ${baseClassName}--linked` : baseClassName
}

export function PurchaseHistoryCell({
  record,
  batches,
  onOpenBatches
}: {
  record: Ali1688SkuPurchaseHistoryItem
  batches: PurchaseBatch[]
  onOpenBatches: () => void
}) {
  const latest = getLatestPurchaseBatch(batches)
  const content = (
    <div className="ali1688-sku-history-popover">
      {batches.slice(0, 8).map((batch) => (
        <div key={batch.id} className="ali1688-sku-history-popover-row">
          <Text strong>{batch.label} · {formatCurrency(purchaseBatchUnitPrice(batch))}</Text>
          <Text type="secondary">
            {displayText(purchaseBatchLatestOrderTime(batch))} · {displayText(purchaseBatchSupplierNames(batch).join('、'))}
          </Text>
          <Text type="secondary">来源订单</Text>
          {purchaseBatchOrderNos(batch).map((orderNo) => (
            <Text key={orderNo} type="secondary">
              {orderNo}
            </Text>
          ))}
          <Text type="secondary">
            计入数量 {formatNumberText(batch.countedQuantity)} · 计入成本 {formatCurrency(batch.countedCost)}
          </Text>
        </div>
      ))}
      {!batches.length ? <Text type="secondary">暂无采购历史摘要</Text> : null}
    </div>
  )

  return (
    <div className="ali1688-sku-history-cell">
      <Popover title="采购历史摘要" content={content} placement="topLeft">
        <div
          className="ali1688-sku-history-summary"
          data-testid={`sku-purchase-history-summary-${record.skuParent || 'unknown'}`}
        >
          <Text strong>{latest ? formatCurrency(purchaseBatchUnitPrice(latest)) : '未返回信息'}</Text>
          <Text type="secondary">{latest ? displayText(purchaseBatchLatestOrderTime(latest)) : '暂无最近采购'}</Text>
          <Text type="secondary">
            {latest ? displayText(purchaseBatchSupplierNames(latest).join('、')) : '暂无供应商'}
          </Text>
          <Text type="secondary">{latest ? `来源 ${displayText(purchaseBatchOrderNos(latest).join('、'))}` : '无订单号'}</Text>
        </div>
      </Popover>
      <Button size="small" onClick={onOpenBatches} disabled={!batches.length}>
        批次明细
      </Button>
    </div>
  )
}

export function PurchaseTrendCell({
  record,
  batches,
  metrics,
  onOpen
}: {
  record: Ali1688SkuPurchaseHistoryItem
  batches: PurchaseBatch[]
  metrics: PurchaseBatchMetrics
  onOpen: () => void
}) {
  const points = getReadyPurchaseBatchPoints(batches).map((batch) => purchaseBatchUnitPrice(batch) ?? 0)
  return (
    <div className="ali1688-sku-trend-cell">
      <Sparkline points={points} skuParent={record.skuParent} onOpen={onOpen} />
      <Space size={8} wrap>
        <Text type="secondary">最低 {formatCurrency(metrics.lowestUnitPrice)}</Text>
        <Text type="secondary">最高 {formatCurrency(metrics.highestUnitPrice)}</Text>
      </Space>
    </div>
  )
}

export function Sparkline({ points, skuParent, onOpen }: { points: number[]; skuParent?: string; onOpen: () => void }) {
  if (!points.length) {
    return (
      <button
        type="button"
        className="ali1688-sku-sparkline-empty"
        data-testid={`sku-purchase-sparkline-${skuParent || 'unknown'}`}
        onClick={onOpen}
      >
        <LineChartOutlined />
        <Text type="secondary">暂无趋势</Text>
      </button>
    )
  }
  const width = 154
  const height = 48
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = points.length === 1 ? width : width / (points.length - 1)
  const pathPoints = points
    .map((value, index) => {
      const x = points.length === 1 ? width / 2 : index * step
      const y = height - ((value - min) / range) * (height - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <button
      className="ali1688-sku-sparkline"
      data-testid={`sku-purchase-sparkline-${skuParent || 'unknown'}`}
      type="button"
      onClick={onOpen}
    >
      <svg role="img" aria-label="采购单价趋势" viewBox={`0 0 ${width} ${height}`}>
        <polyline points={pathPoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((value, index) => {
          const x = points.length === 1 ? width / 2 : index * step
          const y = height - ((value - min) / range) * (height - 8) - 4
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="3" fill="#2563eb" />
        })}
      </svg>
    </button>
  )
}

export function PurchaseSummaryCell({ metrics }: { metrics: PurchaseBatchMetrics }) {
  return (
    <div className="ali1688-sku-summary-cell">
      <Text strong>采购次数: {metrics.purchaseCount}</Text>
      <Text>采购总费用: {formatCurrency(metrics.totalCost)}</Text>
      <Text>采购总件数: {formatNumberText(metrics.totalQuantity)}</Text>
      <Text type="secondary">平均采购单价: {formatCurrency(metrics.averageUnitPrice)}</Text>
      <Text type="secondary">最近采购单价: {formatCurrency(metrics.recentUnitPrice)}</Text>
      <Text type="secondary">最近采购时间: {displayText(metrics.recentPurchaseTime)}</Text>
    </div>
  )
}
