import { Space, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import type {
  Ali1688HistoricalOrderDetail,
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderRow
} from '../types'
import type { AssignmentTargetOption } from '../model/pageTypes'
import {
  assignmentStatusLabel,
  assignmentSummaryText,
  compactJoin,
  orderStatusText,
  parseAssignmentBreakdownTargets,
  renderMissingFields
} from './orderText'

const { Text } = Typography

export function renderSupplierCell(order: Ali1688HistoricalOrderRow) {
  return (
    <div className="ali1688-supplier-cell">
      <Text className="ali1688-supplier-name">{labeledValue('供应商', order.supplierName || '未返回')}</Text>
      {order.sellerMemberName ? <Text type="secondary">{labeledValue('卖家', order.sellerMemberName)}</Text> : null}
      {order.buyerCompanyName ? <Text type="secondary">{labeledValue('买家', order.buyerCompanyName)}</Text> : null}
    </div>
  )
}

export function renderPurchaseCell(item: Ali1688HistoricalOrderItem | undefined, order: Ali1688HistoricalOrderRow) {
  return (
    <div className="ali1688-purchase-cell">
      <Text strong>{labeledValue('订单总价', orderMoneyText(order.goodsTotalText || order.amountText))}</Text>
      <Text type="secondary">{labeledValue('运费', order.freightText || '未返回')}</Text>
      <Text type="secondary">{labeledValue('实付款', orderMoneyText(order.paidAmountText || order.amountText))}</Text>
      <Text type="secondary">{labeledValue('数量', quantityText(item))}</Text>
    </div>
  )
}

export function renderLogisticsCell(item: Ali1688HistoricalOrderItem | undefined, order: Ali1688HistoricalOrderRow) {
  return (
    <div className="ali1688-logistics-cell">
      <Text>{labeledValue('物流', item?.logisticsCompany || order.logisticsStatus || '未返回')}</Text>
      {item?.trackingNo ? <Text type="secondary">{item.trackingNo}</Text> : null}
      {renderMissingFields(mergedMissingFields(order.missingFields, item?.missingFields))}
    </div>
  )
}

export function renderOrderContextCell(order: Ali1688HistoricalOrderRow, item?: Ali1688HistoricalOrderItem) {
  return (
    <div className="ali1688-order-context-cell">
      <Text className="ali1688-order-no">{labeledValue('订单号', order.orderNo || '未返回')}</Text>
      <Space size={4} wrap className="ali1688-order-context-tags">
        {item?.offerId ? <Tag>Offer {item.offerId}</Tag> : null}
        {item?.skuId ? <Tag>SKU {item.skuId}</Tag> : null}
      </Space>
      <Text type="secondary">{labeledValue('下单时间', order.orderTime || '未返回')}</Text>
      <Tag color={order.orderStatus ? 'processing' : 'default'}>{orderStatusText(order.orderStatus)}</Tag>
    </div>
  )
}

export function labeledValue(label: string, value?: ReactNode) {
  return (
    <>
      <span className="ali1688-field-label">{label}: </span>
      {displayValue(value)}
    </>
  )
}

export function findSelectedDetailItem(order: Ali1688HistoricalOrderDetail, selectedLineItemId?: string) {
  if (!order.items?.length) {
    return undefined
  }
  if (!selectedLineItemId) {
    return order.items[0]
  }
  return order.items.find((item) => item.id === selectedLineItemId) || order.items[0]
}

export function renderInfoGrid(fields: Array<{ label: string; value?: ReactNode }>) {
  return (
    <dl>
      {fields.map((field) => (
        <div key={field.label}>
          <dt>{field.label}</dt>
          <dd>{displayValue(field.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function displayValue(value?: ReactNode) {
  return value === undefined || value === null || value === '' ? '未返回' : value
}

export function orderMoneyText(value?: string | number | null) {
  if (value === undefined || value === null) {
    return '未返回'
  }
  const rawValue = String(value).trim()
  if (!rawValue) {
    return '未返回'
  }
  const numericText = rawValue.replace(/[¥￥,\s]/g, '')
  if (!/^[-+]?\d+(\.\d+)?$/.test(numericText)) {
    return rawValue
  }
  const numericValue = Number(numericText)
  if (!Number.isFinite(numericValue)) {
    return rawValue
  }
  const sign = numericValue < 0 ? '-' : ''
  return `${sign}¥${Math.abs(numericValue).toFixed(2)}`
}

export function mergedMissingFields(...fieldGroups: Array<string[] | undefined>) {
  const seen = new Set<string>()
  fieldGroups.flatMap((fields) => fields || []).forEach((field) => {
    if (field?.trim()) {
      seen.add(field)
    }
  })
  return Array.from(seen)
}

export function quantityText(item?: Ali1688HistoricalOrderItem) {
  if (!item || item.quantity === undefined || item.quantity === null) {
    return '数量未返回'
  }
  return `${item.quantity}${item.unit || ''}`
}

export function renderAssignmentState(
  item: Ali1688HistoricalOrderItem | undefined,
  assignmentTargetOptions: AssignmentTargetOption[]
) {
  if (!item) {
    return null
  }
  const targetText = assignmentTargetDisplayText(item.assignmentBreakdownText, assignmentTargetOptions)
  const displayText = targetText || assignmentStatusLabel(item)
  return (
    <Text type="secondary" className="ali1688-assignment-state">
      分配信息 {displayText}
    </Text>
  )
}

export function assignmentTargetDisplayText(
  assignmentBreakdownText: string | undefined,
  assignmentTargetOptions: AssignmentTargetOption[]
) {
  const entries = parseAssignmentBreakdownTargets(assignmentBreakdownText)
  const labels = entries
    .map((entry) => {
      if (entry.targetType === 'CONSUMABLE') {
        return '耗材'
      }
      if (entry.targetType === 'DISCONTINUED') {
        const exactOption = assignmentTargetOptions.find((option) =>
          option.targetType === 'STORE_SITE' &&
          option.targetStoreCode === entry.targetStoreCode &&
          (!entry.targetSiteCode || option.targetSiteCode === entry.targetSiteCode)
        )
        return compactJoin([exactOption?.label || compactJoin([entry.targetStoreCode, entry.targetSiteCode], ' '), '已下架'], ' ')
      }
      const exactOption = assignmentTargetOptions.find((option) =>
        option.targetType === 'STORE_SITE' &&
        option.targetStoreCode === entry.targetStoreCode &&
        (!entry.targetSiteCode || option.targetSiteCode === entry.targetSiteCode)
      )
      if (exactOption) {
        return exactOption.label
      }
      return compactJoin([entry.targetStoreCode, entry.targetSiteCode], ' ')
    })
    .filter(Boolean)
  return Array.from(new Set(labels)).join(' ')
}
