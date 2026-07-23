import { Badge, Popover, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { normalizeNoonImageUrl } from '../product-management/utils'
import type {
  DispatchPlanStatus,
  ProductSpecStatus,
  PurchaseReceiptItem,
  PurchaseReceiptOrder,
  ReceiptStatus,
  WarehouseFulfillmentType,
  WarehouseTransportMode
} from './types'
import type { ProductBaselineSummary, ReceiptOrderSummary } from './workbenchModels'
import {
  DISPATCH_STATUS_META,
  FULFILLMENT_LABELS,
  RECEIPT_STATUS_META,
  TRANSPORT_LABELS
} from './workbenchModels'
import {
  formatReceiptQuantity,
  receiptRemainingQuantity,
  summarizeReceiptOrder
} from './receiptDomain'
import { hasCjkText } from './workbenchUtils'

const { Text } = Typography

export function buildTabLabel(label: string, count: number, tone?: 'operations') {
  return (
    <span className={`warehouse-dispatch-tab-label${tone === 'operations' ? ' is-operations' : ''}`}>
      {label}
      <Badge count={count} overflowCount={9999} size="small" offset={[6, -2]} />
    </span>
  )
}

export function renderSummaryGrid(items: Array<[string, ReactNode]>, className?: string) {
  return (
    <div className={['warehouse-dispatch-summary-grid', className].filter(Boolean).join(' ')}>
      {items.map(([label, value]) => (
        <div className="warehouse-dispatch-metric" key={label}>
          <span className="warehouse-dispatch-metric-value">{value}</span>
          <span className="warehouse-dispatch-metric-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

export function renderReceiptQuickFilters(orderSummaries: Map<string, ReceiptOrderSummary>) {
  const counts = Array.from(orderSummaries.values()).reduce<Record<ReceiptStatus, number>>(
    (result, summary) => ({ ...result, [summary.status]: result[summary.status] + 1 }),
    { pending: 0, partial: 0, ready: 0, planned: 0, exception: 0 }
  )
  const statuses: ReceiptStatus[] = ['pending', 'partial', 'exception', 'ready']
  return statuses.map((status) => (
    <Tag key={status} color={RECEIPT_STATUS_META[status].color}>
      {RECEIPT_STATUS_META[status].label} {counts[status]}
    </Tag>
  ))
}

export function renderReceiptOrderSummary(order: PurchaseReceiptOrder, summary?: ReceiptOrderSummary) {
  const safeSummary = summary ?? summarizeReceiptOrder(order)
  return (
    <div className="warehouse-dispatch-receipt-summary-card">
      {receiptSummaryItem('仓库单', `${order.title || order.orderNo} · ${order.orderNo}`, true)}
      {receiptSummaryItem('商品', `${safeSummary.pskuCount} PSKU`)}
      {receiptSummaryItem('应收', formatReceiptQuantity(safeSummary.expectedQty))}
      {receiptSummaryItem('已收', formatReceiptQuantity(safeSummary.receivedQty))}
      {receiptSummaryItem('未收', formatReceiptQuantity(safeSummary.remainingQty))}
      {receiptSummaryItem('收货状态', renderReceiptStatus(safeSummary.status))}
    </div>
  )
}

export function renderReceiptStatus(status: ReceiptStatus) {
  const meta = RECEIPT_STATUS_META[status]
  return <Tag color={meta.color}>{meta.label}</Tag>
}

export function renderReceiptItemStatus(item: PurchaseReceiptItem) {
  const remainingQty = receiptRemainingQuantity(item)
  if (remainingQty <= 0) {
    return <Tag color="green">已完成</Tag>
  }
  return item.receivedQty > 0
    ? <Tag color="blue">部分收货</Tag>
    : <Tag color="gold">待收货</Tag>
}

export function renderDispatchStatus(status: DispatchPlanStatus) {
  const meta = DISPATCH_STATUS_META[status]
  return <Tag color={meta.color}>{meta.label}</Tag>
}

export function renderTransportMode(mode: WarehouseTransportMode) {
  if (mode === 'UNSPECIFIED') {
    return <Tag>{TRANSPORT_LABELS[mode]}</Tag>
  }
  return <Tag color={mode === 'AIR' ? 'geekblue' : 'cyan'}>{TRANSPORT_LABELS[mode]}</Tag>
}

export function renderFulfillmentType(type?: WarehouseFulfillmentType) {
  const fulfillmentType = type || 'WAREHOUSE_RECEIPT'
  return (
    <Tag color={fulfillmentType === 'FACTORY_DIRECT' ? 'purple' : 'blue'}>
      {FULFILLMENT_LABELS[fulfillmentType]}
    </Tag>
  )
}

export function renderSpecStatus(status: ProductSpecStatus) {
  return status === 'complete'
    ? <Tag color="green">完整</Tag>
    : <Tag color="gold">规格缺失</Tag>
}

export function renderWarehouseProductCell({
  psku,
  title: fallbackTitle,
  imageUrl: fallbackImageUrl,
  baseline
}: {
  psku: string
  title?: string
  imageUrl?: string
  baseline?: ProductBaselineSummary
}) {
  const imageUrl = normalizeNoonImageUrl(baseline?.imageUrl || fallbackImageUrl)
  const title = selectWarehouseProductTitle(fallbackTitle, baseline?.title)
  return (
    <div className="warehouse-dispatch-product-cell">
      {productThumb(imageUrl, title || psku, psku)}
      <div className="warehouse-dispatch-product-main">
        <div className="warehouse-dispatch-product-title-line">
          <Text strong>{psku}</Text>
          {baseline?.detailBaselineStatus ? (
            <Tag color={baseline.detailBaselineStatus === 'ready' ? 'green' : 'gold'}>
              基线{baselineStatusLabel(baseline.detailBaselineStatus)}
            </Tag>
          ) : null}
        </div>
        <Text className="warehouse-dispatch-product-title" type="secondary">
          {title || '未命名商品'}
        </Text>
      </div>
    </div>
  )
}

function receiptSummaryItem(label: string, value: ReactNode, strong = false) {
  return (
    <div className="warehouse-dispatch-receipt-summary-item">
      <span className="warehouse-dispatch-receipt-summary-label">{label}</span>
      <span className={`warehouse-dispatch-receipt-summary-value${strong ? ' is-strong' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function productThumb(imageUrl: string | undefined, alt: string, psku: string) {
  const thumb = (
    <div className={`warehouse-dispatch-product-thumb${imageUrl ? ' is-previewable' : ''}`}>
      {imageUrl ? <img src={imageUrl} alt={alt} loading="lazy" decoding="async" /> : <span>{psku.slice(0, 2)}</span>}
    </div>
  )
  if (!imageUrl) {
    return thumb
  }
  return (
    <Popover placement="right" mouseEnterDelay={0.12} styles={{ body: { padding: 6 } }} content={(
      <img src={imageUrl} alt={alt} style={{ width: 240, maxWidth: '60vw', maxHeight: 320,
        objectFit: 'contain', display: 'block' }} />
    )}>
      {thumb}
    </Popover>
  )
}

function selectWarehouseProductTitle(primaryTitle?: string, fallbackTitle?: string) {
  return hasCjkText(primaryTitle) ? primaryTitle : primaryTitle || fallbackTitle
}

function baselineStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ready: '完整',
    missing: '缺失',
    preparing: '准备中',
    failed: '失败'
  }
  return labels[status] || status
}
