import { Typography } from 'antd'
import { OfficialWarehouseMetric as Metric } from './OfficialWarehouseMetric'
import { inboundStageLabel } from './statisticsDomain'
import type {
  OfficialWarehouseInboundStatisticsView,
  OfficialWarehouseStockStatisticsView
} from './statisticsTypes'

const { Text } = Typography

export function OfficialWarehouseStatisticsSummary({
  stockStats,
  inboundStats,
  stockBucket,
  shouldShowProduct,
  shouldShowInbound,
  onStockBucketChange
}: {
  stockStats: OfficialWarehouseStockStatisticsView
  inboundStats: OfficialWarehouseInboundStatisticsView
  stockBucket?: string
  shouldShowProduct: boolean
  shouldShowInbound: boolean
  onStockBucketChange: (value?: string) => void
}) {
  const hasInboundReport =
    inboundStats.summary.lineReceiptReportConnected || inboundStats.summary.scheduledDeliveryAccuracyConnected
  return (
    <div className="official-warehouse-statistics-summary-row">
      {shouldShowProduct ? (
        <div className="official-warehouse-statistics-summary-group">
          <div className="official-warehouse-metrics official-warehouse-history-metrics">
            <Metric
              label="有效在仓"
              value={stockStats.summary.effectiveStock}
              tone="green"
              active={stockBucket === 'SELLABLE'}
              onClick={() => onStockBucketChange('SELLABLE')}
            />
            <Metric
              label="当前库存"
              value={stockStats.summary.currentStock}
              active={!stockBucket}
              onClick={() => onStockBucketChange(undefined)}
            />
            <Metric label="退货" value={stockStats.summary.returnStock} active={stockBucket === 'RETURNED'} onClick={() => onStockBucketChange('RETURNED')} />
            <Metric label="失败/异常" value={stockStats.summary.failedOrExceptionStock} tone="red" active={stockBucket === 'DAMAGED'} onClick={() => onStockBucketChange('DAMAGED')} />
            <Metric label="待确认" value={stockStats.summary.pendingConfirmationStock} tone="amber" active={stockBucket === 'PENDING_CONFIRMATION'} onClick={() => onStockBucketChange('PENDING_CONFIRMATION')} />
          </div>
        </div>
      ) : null}
      {shouldShowInbound ? (
        <div className="official-warehouse-statistics-summary-group official-warehouse-statistics-summary-compact">
          <Text className="official-warehouse-statistics-summary-label">入仓摘要</Text>
          <div className="official-warehouse-metrics official-warehouse-history-metrics">
            {hasInboundReport
              ? <InboundReportMetrics inboundStats={inboundStats} />
              : <InboundFallbackMetrics inboundStats={inboundStats} />}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function InboundReportMetrics({ inboundStats }: { inboundStats: OfficialWarehouseInboundStatisticsView }) {
  const { summary } = inboundStats
  return (
    <>
      <Metric label="ASN" value={summary.scheduledDeliveryAccuracyAsnCount || summary.asnCount} />
      <Metric label="预期" value={summary.expectedQuantity || summary.totalQuantity} />
      <Metric label="实收" value={summary.receivedQuantity || summary.grnQuantity} tone="green" />
      <Metric label="QC失败" value={summary.qcFailedQuantity} tone="red" />
      <Metric label="短收" value={summary.shortReceivedLineCount} tone="red" />
      <Metric label="差异" value={summary.inboundQuantityVariance} tone={summary.inboundQuantityVariance > 0 ? 'red' : 'green'} />
    </>
  )
}

function InboundFallbackMetrics({ inboundStats }: { inboundStats: OfficialWarehouseInboundStatisticsView }) {
  const { summary } = inboundStats
  return (
    <>
      <Metric label="ASN" value={summary.asnCount} />
      <Metric label="总件数" value={summary.totalQuantity} />
      <Metric label={inboundStageLabel('RECEIVING')} value={summary.receivingAsnCount} tone="blue" />
      <Metric label={inboundStageLabel('GRN_COMPLETED')} value={summary.grnCompletedAsnCount} tone="green" />
      <Metric label={inboundStageLabel('FAILED')} value={summary.failedAsnCount} tone="red" />
      <Metric label="约仓成功" value={summary.appointmentScheduledCount} tone="green" />
    </>
  )
}
