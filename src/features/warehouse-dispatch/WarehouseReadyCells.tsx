import { Button, Space, Tag, Typography } from 'antd'
import type { ReadyShipmentItem } from './types'
import {
  buildReadySourceRows,
  formatReceiptSourceDate,
  uniqueFulfillmentTypes,
  uniqueReadySiteCodes
} from './readyDomain'
import {
  renderFulfillmentType,
  renderWarehouseProductCell
} from './WarehouseDispatchSharedView'
import type {
  ProductBaselineSummary,
  ReadyShipmentRow,
  ReceiptOrderMeta
} from './workbenchModels'
import { TRANSPORT_LABELS } from './workbenchModels'
import { normalizeProductKey } from './workbenchUtils'

const { Text } = Typography

export function renderReadyProductCell(
  item: ReadyShipmentItem,
  productBaselineByPsku: Record<string, ProductBaselineSummary>
) {
  return renderWarehouseProductCell({
    psku: item.psku,
    title: item.title,
    imageUrl: item.imageUrl,
    baseline: productBaselineByPsku[normalizeProductKey(item.psku)]
  })
}

export function renderReadySourceCell(
  item: ReadyShipmentRow,
  orderMetaById: Map<string, ReceiptOrderMeta>,
  onModifyPlan: (source: ReadyShipmentItem) => void
) {
  const sourceItems = item.items.length ? item.items : [item]
  return (
    <div className="warehouse-dispatch-source-list">
      {buildReadySourceRows(sourceItems, orderMetaById).map((source) => (
        <div className="warehouse-dispatch-ready-source-row" key={source.key}>
          <span className="warehouse-dispatch-ready-source-main">
            <Text strong>{source.orderTitle || source.orderNo}</Text>
            <span className="warehouse-dispatch-ready-source-separator">/</span>
            <Text type="secondary">{formatReceiptSourceDate(source.orderCreatedAt)}</Text>
          </span>
          <span className="warehouse-dispatch-ready-source-meta">
            <Tag color="blue">{source.targetSiteCode}</Tag>
            {renderLogisticsQuoteStatus(source.logisticsQuoteStatus, source.logisticsShippingSubmitStatus)}
            <span className="warehouse-dispatch-source-qty">可发 {source.availableQty}</span>
            <span className="warehouse-dispatch-source-qty">
              当前计划 {TRANSPORT_LABELS[source.targetTransportMode]}
            </span>
            <span className="warehouse-dispatch-source-qty">
              原计划 {source.originalSiteCode}/{TRANSPORT_LABELS[source.plannedTransportMode]}
            </span>
            <Button
              className="warehouse-dispatch-ready-source-action"
              size="small"
              type="link"
              disabled={!source.item.fulfillmentBalanceId || source.item.availableQty <= 0}
              onClick={(event) => {
                event.stopPropagation()
                onModifyPlan(source.item)
              }}
            >
              修改计划
            </Button>
          </span>
        </div>
      ))}
    </div>
  )
}

export function renderReadyQuoteCell(item: ReadyShipmentRow) {
  const blockingCount = item.items.filter((source) => source.logisticsQuoteBlocking).length
  return (
    <Space direction="vertical" size={2}>
      {renderLogisticsQuoteStatus(item.logisticsQuoteStatus, item.logisticsShippingSubmitStatus)}
      {blockingCount ? <Text type="secondary">{blockingCount} 个来源待处理</Text> : null}
    </Space>
  )
}

export function renderLogisticsQuoteStatus(quoteStatus?: string, shippingSubmitStatus?: string) {
  if (quoteStatus !== 'CONFIRMED') {
    return <Tag color="gold">待报价</Tag>
  }
  if (shippingSubmitStatus !== 'SUBMITTED') {
    return <Tag color="orange">未提交发货</Tag>
  }
  return <Tag color="green">可装箱</Tag>
}

export function renderReadyFulfillmentCell(item: ReadyShipmentRow) {
  const types = uniqueFulfillmentTypes(
    item.items.map((source) => source.fulfillmentType || item.fulfillmentType)
  )
  if (types.length <= 1) {
    return renderFulfillmentType(types[0])
  }
  return <Space size={0} wrap>{types.map((type) => renderFulfillmentType(type))}</Space>
}

export function renderReadySiteCell(item: ReadyShipmentRow) {
  return (
    <Space size={0} wrap>
      {uniqueReadySiteCodes(item).map((siteCode) => (
        <Tag color="blue" key={siteCode}>{siteCode}</Tag>
      ))}
    </Space>
  )
}
