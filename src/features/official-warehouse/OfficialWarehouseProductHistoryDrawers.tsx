import { Drawer, Empty, Table, Typography } from 'antd'
import { OfficialWarehouseMetric as Metric } from './OfficialWarehouseMetric'
import {
  ProductStockSourceChainView,
  ProductStockSourceSegmentDetail
} from './ProductStockSourceChainView'
import { sourceStageLabel } from './productStockSourcePresentation'
import { productHistoryColumns } from './OfficialWarehouseStatisticsTables'
import { productInboundHistoryNeedsReview } from './statisticsDomain'
import type { ProductStockSourceChain, ProductStockSourceChainSegment } from './statisticsDomain'
import type {
  OfficialWarehouseProductInboundHistoryView,
  OfficialWarehouseStockStatisticsRow
} from './statisticsTypes'

const { Text } = Typography

export function OfficialWarehouseProductHistoryDrawers({
  selectedStockRow,
  selectedSourceSegment,
  productHistory,
  productSourceChain,
  historyLoading,
  onCloseHistory,
  onSelectSourceSegment,
  onCloseSourceSegment
}: {
  selectedStockRow?: OfficialWarehouseStockStatisticsRow
  selectedSourceSegment?: ProductStockSourceChainSegment
  productHistory: OfficialWarehouseProductInboundHistoryView
  productSourceChain: ProductStockSourceChain
  historyLoading: boolean
  onCloseHistory: () => void
  onSelectSourceSegment: (segment: ProductStockSourceChainSegment) => void
  onCloseSourceSegment: () => void
}) {
  return (
    <>
      <Drawer
        width={760}
        open={Boolean(selectedStockRow)}
        title={selectedStockRow?.partnerSku || selectedStockRow?.noonSku || '商品详情'}
        onClose={onCloseHistory}
      >
        {selectedStockRow ? (
          <div className="official-warehouse-stack">
            <div className="official-warehouse-statistics-title">
              <Text strong>{selectedStockRow.titleCn || selectedStockRow.title || selectedStockRow.noonSku || '-'}</Text>
              <Text type="secondary">{selectedStockRow.titleEn || selectedStockRow.partnerSku || selectedStockRow.noonSku || '-'}</Text>
            </div>
            <div className="official-warehouse-metrics official-warehouse-history-metrics">
              <Metric label="当前库存" value={selectedStockRow.currentStock} />
              <Metric label="有效在仓" value={selectedStockRow.effectiveStock} tone="green" />
              <Metric label="退货" value={selectedStockRow.returnStock} />
              <Metric label="失败/异常" value={selectedStockRow.failedOrExceptionStock} tone="red" />
              <Metric label="待确认" value={selectedStockRow.pendingConfirmationStock} tone="amber" />
            </div>
            <div className="official-warehouse-statistics-title">
              <Text strong>库存来源推算</Text>
              <Text type="secondary">按当前库存总量 + FIFO 消耗推算，非 Noon 真实批次归属。</Text>
            </div>
            <ProductStockSourceChainView
              chain={productSourceChain}
              loading={historyLoading}
              onSegmentClick={onSelectSourceSegment}
            />
            <ProductInboundHistory history={productHistory} loading={historyLoading} />
          </div>
        ) : null}
      </Drawer>
      <Drawer
        width={420}
        open={Boolean(selectedSourceSegment)}
        title={selectedSourceSegment ? `${sourceStageLabel(selectedSourceSegment.stage)}详情` : '来源详情'}
        onClose={onCloseSourceSegment}
      >
        {selectedSourceSegment ? <ProductStockSourceSegmentDetail segment={selectedSourceSegment} /> : null}
      </Drawer>
    </>
  )
}

function ProductInboundHistory({
  history,
  loading
}: {
  history: OfficialWarehouseProductInboundHistoryView
  loading: boolean
}) {
  return (
    <>
      <div className="official-warehouse-statistics-title">
        <Text strong>历史入仓</Text>
        <Text type={productInboundHistoryNeedsReview(history) ? 'warning' : 'secondary'}>
          {history.summary.receiptLineCount
            ? `预期 ${history.summary.expectedQuantity.toLocaleString()}，实收 ${history.summary.receivedQuantity.toLocaleString()}，QC失败 ${history.summary.qcFailedQuantity.toLocaleString()}`
            : '暂无入仓记录'}
        </Text>
      </div>
      <Table
        rowKey={(row) => `${row.importId || ''}-${row.reportRowId || ''}-${row.noonAsnNr || ''}`}
        size="small"
        loading={loading}
        columns={productHistoryColumns}
        dataSource={history.rows}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        scroll={{ x: 980 }}
        locale={{ emptyText: <Empty description="暂无该商品入仓历史" /> }}
      />
    </>
  )
}
