import { Alert, Descriptions, Drawer, Empty, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dispatch, SetStateAction } from 'react'
import type {
  OfficialWarehouseAsn,
  OfficialWarehouseAsnInboundDetail,
  OfficialWarehouseAsnInboundLine
} from '../api'
import { isNoonBackofficeAsnWithoutSyncedLines } from '../asnDetailDisplay'
import { officialWarehousePublicAsnNo } from '../domain'
import {
  INBOUND_DISCREPANCY_FILTER_OPTIONS,
  appointmentDeliveryTimeText,
  appointmentStatusTag,
  asnProductCountText,
  businessErrorText,
  noonAsnStatusTag,
  shippingLinkSummaryItems,
  statusTag,
  type InboundDiscrepancyFilter
} from '../officialWarehouseAsnPresentation'
import { InboundReceiptMetric } from './OfficialWarehouseMetrics'

const { Text } = Typography

type Props = {
  selectedAsn?: OfficialWarehouseAsn
  closeDetail: () => void
  selectedInboundDetail?: OfficialWarehouseAsnInboundDetail
  selectedInboundLoading: boolean
  selectedInboundError?: string
  inboundProductColumns: ColumnsType<OfficialWarehouseAsnInboundLine>
  visibleInboundLines: OfficialWarehouseAsnInboundLine[]
  inboundDiscrepancyFilter?: InboundDiscrepancyFilter
  setInboundDiscrepancyFilter: Dispatch<SetStateAction<InboundDiscrepancyFilter | undefined>>
}

export function OfficialWarehouseDetailDrawer({
  selectedAsn,
  closeDetail,
  selectedInboundDetail,
  selectedInboundLoading,
  selectedInboundError,
  inboundProductColumns,
  visibleInboundLines,
  inboundDiscrepancyFilter,
  setInboundDiscrepancyFilter
}: Props) {
  return (
      <Drawer
        title={selectedAsn ? `${officialWarehousePublicAsnNo(selectedAsn)} 详情` : 'ASN详情'}
        width={860}
        open={Boolean(selectedAsn)}
        onClose={closeDetail}
      >
        {selectedAsn ? (
          <div className="official-warehouse-detail-section">
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="状态">{statusTag(selectedAsn.status)}</Descriptions.Item>
              <Descriptions.Item label="Noon ASN">{officialWarehousePublicAsnNo(selectedAsn)}</Descriptions.Item>
              <Descriptions.Item label="站点">{selectedAsn.siteCode}</Descriptions.Item>
              <Descriptions.Item label="商品种类">{asnProductCountText(selectedAsn)}</Descriptions.Item>
              <Descriptions.Item label="总件数">{selectedAsn.totalQuantity || 0}</Descriptions.Item>
              <Descriptions.Item label="约仓状态">
                {selectedAsn.appointment
                  ? appointmentStatusTag(selectedAsn.appointment.status)
                  : noonAsnStatusTag(selectedAsn.noonAsnStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="约仓时间">
                {appointmentDeliveryTimeText(selectedAsn.appointment) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="失败信息" span={2}>
                {selectedAsn.errorMessage || selectedAsn.appointment?.errorMessage ? (
                  <Text type="danger">
                    {businessErrorText(
                      selectedAsn.errorMessage || selectedAsn.appointment?.errorMessage,
                      selectedAsn.failureType || selectedAsn.appointment?.failureType
                    )}
                  </Text>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
            {selectedAsn.shippingBatchLinks?.length ? (
              <div className="official-warehouse-link-summary">
                <Text strong>物流批次号关联</Text>
                <div className="official-warehouse-link-summary-list">
                  {shippingLinkSummaryItems(selectedAsn).map((item) => (
                    <div className="official-warehouse-link-summary-item" key={item.key}>
                      <Text strong>{item.batchNo}</Text>
                      <Text>{Number(item.quantity || 0).toLocaleString()} 件</Text>
                      <Text type="secondary">
                        {item.purchaseOrders.length ? `${item.purchaseOrders.length} 个采购单` : '采购单未记录'}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="official-warehouse-inbound-receipt-section">
              <div className="official-warehouse-inbound-receipt-header">
                <Text strong>入仓回执</Text>
                {selectedInboundDetail?.summary.latestImportedAt ? (
                  <Text type="secondary">数据更新：{selectedInboundDetail.summary.latestImportedAt}</Text>
                ) : null}
              </div>
              {selectedInboundLoading ? <Alert showIcon type="info" message="正在读取商品入仓结果…" /> : null}
              {selectedInboundError ? <Alert showIcon type="error" message="入仓详情加载失败" description={selectedInboundError} /> : null}
              {selectedInboundDetail?.summary.reportConnected ? (
                <div className="official-warehouse-inbound-receipt-metrics">
                  <InboundReceiptMetric label="ASN件数" value={selectedInboundDetail.summary.asnQuantity} />
                  <InboundReceiptMetric label="预计入仓" value={selectedInboundDetail.summary.expectedQuantity} />
                  <InboundReceiptMetric label="已入仓" value={selectedInboundDetail.summary.receivedQuantity} tone="green" />
                  <InboundReceiptMetric
                    label={selectedInboundDetail.summary.shortQuantity ? '少收' : '超收'}
                    value={selectedInboundDetail.summary.shortQuantity || selectedInboundDetail.summary.overQuantity}
                    tone={selectedInboundDetail.summary.shortQuantity ? 'red' : 'amber'}
                  />
                  <InboundReceiptMetric label="QC异常" value={selectedInboundDetail.summary.qcFailedQuantity} tone="red" />
                  <InboundReceiptMetric label="未识别" value={selectedInboundDetail.summary.unidentifiedQuantity} tone="purple" />
                </div>
              ) : selectedInboundDetail ? (
                <Alert
                  showIcon
                  type="info"
                  message="暂未收到 Noon 入仓回执"
                  description="当前只展示 ASN 商品数量；入仓报表返回后会显示预计、实收和异常数量。"
                />
              ) : null}
              {selectedInboundDetail?.summary.unmatchedLineCount ? (
                <Alert
                  showIcon
                  type="warning"
                  message={`有 ${selectedInboundDetail.summary.unmatchedLineCount} 个入仓商品未匹配本地 ASN 商品行`}
                  description="这些商品保留在下方并标注为来自 FBN 入仓报表，不会合并到其他商品。"
                />
              ) : null}
              {isNoonBackofficeAsnWithoutSyncedLines(selectedAsn) && selectedInboundDetail?.summary.reportConnected ? (
                <Alert
                  showIcon
                  type="info"
                  message="Noon 后台创建的 ASN"
                  description="本地商品明细未同步；下方商品和入仓数量来自 FBN 入仓报表。"
                />
              ) : null}
              <Table
                rowKey={(row) => row.asnLineId || `${row.partnerSku || ''}-${row.noonSku || ''}-${row.pskuCode || ''}`}
                size="small"
                columns={inboundProductColumns}
                dataSource={visibleInboundLines}
                loading={selectedInboundLoading}
                pagination={false}
                scroll={{ x: 1100 }}
                locale={{
                  emptyText: (
                    <Empty description={inboundDiscrepancyFilter ? '暂无符合条件的入仓商品' : '暂无商品入仓明细'} />
                  )
                }}
                title={() => (
                  <div className="official-warehouse-inbound-table-title">
                    <Text strong>商品入仓明细</Text>
                    <Select<InboundDiscrepancyFilter>
                      allowClear
                      className="official-warehouse-inbound-discrepancy-filter"
                      placeholder="入仓差异"
                      value={inboundDiscrepancyFilter}
                      options={INBOUND_DISCREPANCY_FILTER_OPTIONS}
                      onChange={setInboundDiscrepancyFilter}
                    />
                  </div>
                )}
              />
              {isNoonBackofficeAsnWithoutSyncedLines(selectedAsn) && !selectedInboundLoading && !selectedInboundDetail?.summary.reportConnected ? (
                <Alert
                  showIcon
                  type="info"
                  message="商品明细"
                  description="该 ASN 在 Noon 后台创建，商品明细未同步，请前往 Noon 后台查看详情。当前也没有匹配到 FBN 入仓回执。"
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </Drawer>

  )
}
