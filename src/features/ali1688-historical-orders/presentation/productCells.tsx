import { Avatar, Button, Space, Tag, Tooltip, Typography } from 'antd'
import { DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import type {
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderProductLink
} from '../types'
import type {
  AssignmentTargetOption,
  ProductLineRow,
  ProductLinkActionControls
} from '../model/pageTypes'
import {
  canOpenProductLinkActionForRows,
  canLinkProductLine,
  isAssignableProductLine
} from '../model/productLineEligibility'
import { isStorelessFullLineAssignmentType } from '../model/assignmentTargets'
import {
  assignmentStatusLabel,
  assignmentSummaryText,
  compactJoin,
  renderMissingFields
} from './orderText'
import {
  labeledValue,
  renderAssignmentState
} from './orderContextCells'

const { Text } = Typography

export function renderProductCell(
  row: ProductLineRow,
  assignmentTargetOptions: AssignmentTargetOption[],
  productLinkControls: ProductLinkActionControls
) {
  const item = row.item
  const title = item?.title || '未返回'
  return (
    <div className="ali1688-product-line-cell">
      {item?.imageUrl ? (
        <img
          className={productLineImageClassName(item)}
          src={item.imageUrl}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <div className="ali1688-product-line-main">
        <Tooltip title={title} placement="topLeft">
          <Text strong className="ali1688-product-line-title">{title}</Text>
        </Tooltip>
        <Text type="secondary" className="ali1688-product-line-spec">
          {labeledValue('规格', compactJoin([item?.skuText, item?.modelText], ' / ') || '未返回')}
        </Text>
        <Space size={4} wrap className="ali1688-product-line-tags">
          {item?.productCode ? <Tag>货号 {item.productCode}</Tag> : null}
          {item?.singleProductCode ? <Tag>单品 {item.singleProductCode}</Tag> : null}
        </Space>
        {renderAssignmentState(item, assignmentTargetOptions)}
        <div className="ali1688-product-line-actions">
          {renderProductLineActions(row, productLinkControls)}
        </div>
      </div>
    </div>
  )
}

export function productLineImageClassName(item?: Ali1688HistoricalOrderItem) {
  const classNames = ['ali1688-product-line-image']
  if (item?.productLink?.skuParent) {
    classNames.push('ali1688-product-line-image--product-linked')
  } else if (isAssignedToStore(item)) {
    classNames.push('ali1688-product-line-image--store-linked')
  }
  return classNames.join(' ')
}

export function isAssignedToStore(item?: Ali1688HistoricalOrderItem) {
  return Boolean(
    item?.assignmentTargetStoreCode &&
    !isStorelessFullLineAssignmentType(item.assignmentTargetType)
  )
}

export function renderProductLineActions(row: ProductLineRow, controls: ProductLinkActionControls) {
  const item = row.item
  const hasLinkState = Boolean(item?.productLink?.skuParent)
  const canOpenAction = isAssignableProductLine(row)
    || (controls.canMutateProductLinks && canOpenProductLinkActionForRows([row]))
  const canDeleteOrder = controls.canDeleteOrders && Boolean(row.order.id)
  if (!hasLinkState && !canOpenAction && !canDeleteOrder) {
    return null
  }

  const actionButton = canOpenAction ? (
    <Button
      type="link"
      size="small"
      icon={<LinkOutlined />}
      onClick={() => void controls.onOpenProductActionModal(row)}
    >
      分配/关联
    </Button>
  ) : null
  const deleteButton = canDeleteOrder ? (
    <Button
      type="link"
      size="small"
      danger
      icon={<DeleteOutlined />}
      aria-label={`删除订单 ${row.order.orderNo || row.order.id}`}
      onClick={() => controls.onOpenDeleteOrderModal(row.order)}
    >
      删除订单
    </Button>
  ) : null

  return (
    <Space size={[6, 4]} wrap className="ali1688-product-link-actions">
      {renderProductLinkState(item)}
      {actionButton}
      {deleteButton}
    </Space>
  )
}

export function renderProductLinkState(item: Ali1688HistoricalOrderItem | undefined) {
  if (!item?.productLink?.skuParent) {
    return null
  }
  return (
    <Text className="ali1688-product-link-state">
      {productLinkDisplayText(item.productLink)}
    </Text>
  )
}

export function productLinkDisplayText(productLink?: Ali1688HistoricalOrderProductLink) {
  if (!productLink?.skuParent) {
    return undefined
  }
  return `已关联: ${productLink.partnerSku || productLink.skuParent}`
}
