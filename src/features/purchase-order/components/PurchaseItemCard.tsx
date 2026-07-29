import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Popover, Progress, Tag, Tooltip, Typography } from 'antd'
import type { PurchaseOrderAli1688HistorySource, PurchaseOrderItem } from '../types'
import {
  displayShortText,
  formatPurchaseAmount,
  latestAli1688Batch,
  recentAli1688OrderNo,
  recentAli1688UnitPrice,
  sortedAli1688History
} from '../model/purchaseOrderAli1688Model'
import { buildItemTitlePair, sameDisplayText } from '../model/purchaseOrderDisplayModel'
import { isProductDataCompletionIssue, issueTagColor } from '../model/purchaseOrderIssueModel'
import {
  allocationDisplayLabel,
  fulfillmentTypeLabel,
  normalizeFulfillmentType,
  normalizeSiteCode
} from '../model/purchaseOrderItemCommandModel'
import { ITEM_STATUS_META } from '../model/purchaseOrderUiMeta'
import type { PurchaseOrderAli1688HistoryEntry } from '../model/purchaseOrderViewTypes'
import {
  ProductDetailButton,
  ProductThumbnail
} from './ProductDetailButton'

const { Text } = Typography

export function PurchaseItemCard({
  item,
  issues,
  editing,
  deleting,
  ali1688HistoryEntries,
  ali1688HistoryLoading,
  ali1688HistoryError,
  locked,
  onEdit,
  onDelete,
  onOpenTop5,
  onIssueClick
}: {
  item: PurchaseOrderItem
  issues: string[]
  editing: boolean
  deleting: boolean
  ali1688HistoryEntries: PurchaseOrderAli1688HistoryEntry[]
  ali1688HistoryLoading: boolean
  ali1688HistoryError?: string
  locked: boolean
  onEdit: () => void
  onDelete: () => void
  onOpenTop5: () => void
  onIssueClick: (issue: string) => void
}) {
  const meta = ITEM_STATUS_META[item.collectionStatus] || ITEM_STATUS_META.not_started
  const imageUrl = item.sourceImageUrl || item.productImageUrl
  const titlePair = buildItemTitlePair(item)
  const showInlinePsku = !sameDisplayText(titlePair.cn, item.partnerSku)
  const fulfillmentType = normalizeFulfillmentType(item.fulfillmentType)
  const fulfillmentLabel = item.fulfillmentTypeLabel || fulfillmentTypeLabel(fulfillmentType)

  return (
    <article className="purchase-item-card">
      <div className="purchase-item-main">
        <ProductThumbnail imageUrl={imageUrl} />
        <div className="purchase-item-copy">
          <div className="purchase-item-title-row">
            <Text strong ellipsis className="purchase-item-title">
              {titlePair.cn}
            </Text>
            <Tag color={fulfillmentType === 'FACTORY_DIRECT' ? 'gold' : 'blue'}>{fulfillmentLabel}</Tag>
            <ProductDetailButton item={item} imageUrl={imageUrl} titlePair={titlePair} />
          </div>
          {showInlinePsku || titlePair.en ? (
            <div className="purchase-item-sub-row">
              {showInlinePsku ? (
                <Text type="secondary" className="purchase-item-psku">{item.partnerSku}</Text>
              ) : null}
              {titlePair.en ? (
                <Text type="secondary" ellipsis className="purchase-item-en-title">{titlePair.en}</Text>
              ) : null}
            </div>
          ) : null}
          {issues.length ? (
            <div className="purchase-item-issue-list">
              {issues.slice(0, 3).map((issue) => {
                if (isProductDataCompletionIssue(issue) && !locked) {
                  return (
                    <button
                      type="button"
                      className="purchase-item-issue-button"
                      key={issue}
                      onClick={() => onIssueClick(issue)}
                    >
                      <Tag color={issueTagColor(issue)}>{issue}</Tag>
                    </button>
                  )
                }
                return <Tag color={issueTagColor(issue)} key={issue}>{issue}</Tag>
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="purchase-sku-cell">
        <div className="purchase-site-list">
          {(item.allocations || []).map((allocation) => (
            <span
              className={`purchase-site-chip${allocation.enabled ? '' : ' is-disabled'}`}
              key={`${item.id}:${allocation.site}:${allocation.transportMode || 'UNSPECIFIED'}`}
            >
              <span>{allocationDisplayLabel(allocation)}</span>
              <strong>{allocation.quantity}</strong>
            </span>
          ))}
        </div>
        <PurchaseAli1688HistoryLine
          entries={ali1688HistoryEntries}
          loading={ali1688HistoryLoading}
          error={ali1688HistoryError}
        />
      </div>

      <button type="button" className="purchase-collection-cell" onClick={onOpenTop5}>
        <div className="purchase-collection-line">
          <Text type="secondary">1688</Text>
          <Tag color={meta.color}>{meta.label}</Tag>
          <Text strong>{item.progress}%</Text>
        </div>
        <div className="purchase-collection-line purchase-collection-progress-line">
          <Progress
            percent={item.progress}
            size="small"
            showInfo={false}
            status={item.collectionStatus === 'failed' ? 'exception' : undefined}
          />
        </div>
      </button>

      <div className="purchase-item-actions">
        <Button
          size="small"
          icon={<EditOutlined />}
          loading={editing}
          disabled={locked}
          aria-label="编辑"
          title="编辑"
          onClick={onEdit}
        />
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          loading={deleting}
          disabled={locked}
          aria-label="删除"
          title="删除"
          onClick={onDelete}
        />
      </div>
    </article>
  )
}

function PurchaseAli1688HistoryLine({
  entries,
  loading,
  error
}: {
  entries: PurchaseOrderAli1688HistoryEntry[]
  loading: boolean
  error?: string
}) {
  const visibleEntries = entries.filter((entry) => Boolean(entry.record))
  if (loading && !visibleEntries.length) {
    return <Text type="secondary" className="purchase-ali1688-history-status">1688历史读取中</Text>
  }
  if (error && !visibleEntries.length) {
    return (
      <Tooltip title={error}>
        <Text type="danger" className="purchase-ali1688-history-status">1688历史读取失败</Text>
      </Tooltip>
    )
  }
  if (!visibleEntries.length) {
    return <Text type="secondary" className="purchase-ali1688-history-status">暂无1688历史</Text>
  }
  return (
    <div className="purchase-ali1688-history-list" aria-label="1688 历史采购">
      {visibleEntries.map((entry) => (
        <Popover
          key={entry.key}
          placement="topLeft"
          title="1688 历史采购"
          content={<PurchaseAli1688HistoryPopover entry={entry} />}
        >
          <button type="button" className="purchase-ali1688-history-chip">
            <span>{normalizeSiteCode(entry.siteCode) || '全部'}历史</span>
            <strong>{formatPurchaseAmount(recentAli1688UnitPrice(entry.record))}</strong>
            <em>{displayShortText(recentAli1688OrderNo(entry.record), '无订单')}</em>
          </button>
        </Popover>
      ))}
    </div>
  )
}

function PurchaseAli1688HistoryPopover({ entry }: { entry: PurchaseOrderAli1688HistoryEntry }) {
  const record = entry.record
  const batches = record?.purchaseBatches || []
  const latestBatch = latestAli1688Batch(record)
  const batchSourceRows = latestBatch?.sources || []
  const historyRows = sortedAli1688History(record?.history || [])
  const hasHistory = historyRows.length > 0
  return (
    <div className="purchase-ali1688-history-popover">
      <div className="purchase-ali1688-history-popover-summary">
        <Text strong>{displayShortText(record?.partnerSku, '未知 PSKU')}</Text>
        <Text type="secondary">
          {displayShortText(record?.storeCode)} · {displayShortText(record?.siteCode || entry.siteCode)}
        </Text>
        <Text type="secondary">
          采购 {record?.purchaseCount || batches.length || 0} 次 · 最近 {formatPurchaseAmount(recentAli1688UnitPrice(record))}
        </Text>
      </div>
      {latestBatch ? (
        <div className="purchase-ali1688-history-popover-batch">
          <Text strong>{displayShortText(latestBatch.label, '最近批次')}</Text>
          <Text type="secondary">
            数量 {displayShortText(latestBatch.countedQuantity)} · 成本 {formatPurchaseAmount(latestBatch.countedCost)}
          </Text>
          {batchSourceRows.map((source, index) => (
            <div className="purchase-ali1688-history-source" key={ali1688HistorySourceKey(source, index)}>
              <Text>{displayShortText(source.orderNo, '无订单号')}</Text>
              <Text type="secondary">{ali1688HistorySourceSummary(source, false)}</Text>
            </div>
          ))}
        </div>
      ) : null}
      {hasHistory ? (
        <div className="purchase-ali1688-history-popover-batch">
          <Text strong>历史订单</Text>
          {historyRows.slice(0, 5).map((source, index) => (
            <div className="purchase-ali1688-history-source" key={ali1688HistorySourceKey(source, index)}>
              <Text>{displayShortText(source.orderNo, '无订单号')}</Text>
              <Text type="secondary">{ali1688HistorySourceSummary(source, true)}</Text>
            </div>
          ))}
        </div>
      ) : !latestBatch ? (
        <Text type="secondary">暂无已维护批次来源</Text>
      ) : null}
    </div>
  )
}

function ali1688HistorySourceKey(source: PurchaseOrderAli1688HistorySource, index: number) {
  return `${source.allocationId || source.assignmentId || source.orderNo || 'source'}:${source.itemId || ''}:${index}`
}

function ali1688HistorySourceSummary(source: PurchaseOrderAli1688HistorySource, includePrice: boolean) {
  const parts = [
    displayShortText(source.orderTime),
    displayShortText(source.supplierName)
  ]
  if (source.sourceLineLabel) {
    parts.push(source.sourceLineLabel)
  }
  if (source.assignedQuantity) {
    parts.push(`数量 ${displayShortText(source.assignedQuantity)}`)
  }
  if (includePrice) {
    parts.push(`成本 ${formatPurchaseAmount(source.allocatedCost)}`)
    parts.push(`单价 ${formatPurchaseAmount(source.unitPrice)}`)
  }
  if (source.allocationBasis) {
    parts.push(source.allocationBasis)
  }
  return parts.join(' · ')
}
