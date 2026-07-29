import { Space, Tooltip, Typography } from 'antd'
import type { ReplenishmentPlanInboundBatch, ReplenishmentPlanItem, ReplenishmentPlanMissingEtaBatch } from '../types'
import type { PurchasePlanProgressSummary } from '../purchaseProgress'
import { formatEtaDistanceDays, formatMonthDay, formatQuantity, inboundBatchKey, isEtaReviewRequired, numericQuantity } from '../replenishmentFormatting'

const { Text } = Typography

export function renderPurchaseProgressSummary(summary: PurchasePlanProgressSummary) {
  const orderText = summary.orderLabels.length ? summary.orderLabels.join('、') : '暂无'
  return (
    <div className="replenishment-plan-progress-summary">
      <Text strong className="replenishment-plan-progress-title">当前计划</Text>
      <Tooltip title={orderText}>
        <Text className="replenishment-plan-progress-orders">已加入 {orderText}</Text>
      </Tooltip>
      <Text>
        商品 {formatQuantity(summary.addedSkuCount)} / {formatQuantity(summary.totalReplenishmentSkuCount)} 个
      </Text>
      {summary.partialSkuCount ? <Text>部分覆盖 {formatQuantity(summary.partialSkuCount)} 个</Text> : null}
      <Text>
        空运 {formatQuantity(summary.airSkuCount)} 个 / {formatQuantity(summary.airQuantity)} 件
      </Text>
      <Text>
        海运 {formatQuantity(summary.seaSkuCount)} 个 / {formatQuantity(summary.seaQuantity)} 件
      </Text>
      <Text strong>还剩 {formatQuantity(summary.remainingSkuCount)} 个商品</Text>
    </div>
  )
}

export function hasAirSuggestion(item: ReplenishmentPlanItem) {
  return !item.calculationBlocked && numericQuantity(item.airSuggestedUnits) > 0
}

export function hasSeaSuggestion(item: ReplenishmentPlanItem) {
  return !item.calculationBlocked && numericQuantity(item.seaSuggestedUnits) > 0
}

export function renderInboundBatchGroup(
  batches: Array<ReplenishmentPlanInboundBatch | ReplenishmentPlanMissingEtaBatch> | undefined,
  kind: 'known' | 'missing',
  planDate: string,
  siteCode: string
) {
  if (!batches?.length) {
    return null
  }
  return (
    <div className="replenishment-plan-inbound-group">
      <Space direction="vertical" size={2} className="replenishment-plan-inbound-list">
        {batches.map((batch, index) => {
          const etaReviewRequired = isEtaReviewRequired(batch)
          const etaDate = 'etaDate' in batch ? batch.etaDate : null
          const etaDistanceText = etaDate ? formatEtaDistanceDays(etaDate, planDate) : ''
          const etaDisplay = etaDate ? `${formatMonthDay(etaDate)}${etaDistanceText ? ` ${etaDistanceText}` : ''}` : 'ETA 未维护'
          const destinationDisplay = batch.destinationCode
            ? `${batch.destinationCode} / ${siteCode || '-'}`
            : siteCode || '-'
          return (
            <div
              className={`replenishment-plan-inbound-batch${etaReviewRequired ? ' replenishment-plan-inbound-batch-review' : ''}`}
              key={inboundBatchKey(batch, index)}
            >
              <span className="replenishment-plan-inbound-identity">
                <Text type="secondary" className="replenishment-plan-inbound-ref">{batch.batchReferenceNo || `#${batch.batchId || '-'}`}</Text>
                <Text type="secondary" className="replenishment-plan-inbound-destination">{destinationDisplay}</Text>
              </span>
              <Text type="secondary" className="replenishment-plan-inbound-quantity">{formatQuantity(batch.remainingQuantity)}</Text>
              <Text
                type={etaReviewRequired || kind === 'missing' ? 'danger' : undefined}
                className="replenishment-plan-inbound-eta"
              >
                {etaReviewRequired
                  ? `${etaDisplay} 待判断`
                  : etaDisplay}
              </Text>
            </div>
          )
        })}
      </Space>
    </div>
  )
}
