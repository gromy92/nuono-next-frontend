import { Button, Drawer, Empty, List, Space, Spin, Tabs, Tag, Typography } from 'antd'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  Ali1688HistoricalOrderDetail,
  Ali1688HistoricalOrderItem
} from '../types'
import type { AssignmentTargetOption } from '../model/pageTypes'
import {
  orderMoneyText,
  quantityText,
  renderAssignmentState,
  renderInfoGrid
} from '../presentation/orderContextCells'
import {
  assignmentSummaryText,
  compactJoin,
  importStatusColor,
  importStatusText,
  orderStatusText,
  renderMissingFields
} from '../presentation/orderText'
import type { useAli1688ImportHistory } from '../hooks/useAli1688ImportHistory'

const { Text } = Typography

interface Ali1688HistoricalOrderDrawersProps {
  selectedOrder: Ali1688HistoricalOrderDetail | null
  setSelectedOrder: Dispatch<SetStateAction<Ali1688HistoricalOrderDetail | null>>
  setSelectedLineItemId: Dispatch<SetStateAction<string | undefined>>
  selectedDetailItem?: Ali1688HistoricalOrderItem
  detailLoading: boolean
  assignmentTargetOptions: AssignmentTargetOption[]
  assignmentRecordsNode: ReactNode
  resetAssignmentRecords: () => void
  importState: ReturnType<typeof useAli1688ImportHistory>
}

export function Ali1688HistoricalOrderDrawers({
  selectedOrder,
  setSelectedOrder,
  setSelectedLineItemId,
  selectedDetailItem,
  detailLoading,
  assignmentTargetOptions,
  assignmentRecordsNode,
  resetAssignmentRecords,
  importState
}: Ali1688HistoricalOrderDrawersProps) {
  const {
    importHistoryOpen,
    setImportHistoryOpen,
    importHistoryLoading,
    importBatches,
    importBatchDetail,
    setImportBatchDetail,
    importBatchDetailLoading,
    openImportBatchDetail
  } = importState

  return (
    <>
      <Drawer
        title="采购货品详情"
        aria-label="采购货品详情"
        width={760}
        open={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrder(null)
          setSelectedLineItemId(undefined)
          resetAssignmentRecords()
        }}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          {selectedOrder ? (
            <div className="ali1688-historical-orders-detail">
              <Tabs
                items={[
                  {
                    key: 'item',
                    label: '货品信息',
                    children: (
                      <Space direction="vertical" size={12} className="ali1688-historical-orders-detail-section">
                        <Text strong>{selectedDetailItem?.title || '未返回'}</Text>
                        {renderMissingFields(selectedDetailItem?.missingFields)}
                        {renderInfoGrid([
                          { label: '规格', value: selectedDetailItem?.skuText },
                          { label: '型号', value: selectedDetailItem?.modelText },
                          { label: 'Offer ID', value: selectedDetailItem?.offerId },
                          { label: 'SKU ID', value: selectedDetailItem?.skuId },
                          { label: '货号', value: selectedDetailItem?.productCode },
                          { label: '单品货号', value: selectedDetailItem?.singleProductCode },
                          { label: '数量', value: quantityText(selectedDetailItem) },
                          {
                            label: '分配状态',
                            value: selectedDetailItem
                              ? renderAssignmentState(selectedDetailItem, assignmentTargetOptions)
                              : undefined
                          },
                          { label: '分配数量', value: assignmentSummaryText(selectedDetailItem) },
                          { label: '单价', value: selectedDetailItem?.unitPriceText },
                          { label: '金额', value: selectedDetailItem?.amountText }
                        ])}
                        {assignmentRecordsNode}
                      </Space>
                    )
                  },
                  {
                    key: 'order',
                    label: '订单信息',
                    children: (
                      <Space direction="vertical" size={12} className="ali1688-historical-orders-detail-section">
                        {renderMissingFields(selectedOrder.missingFields)}
                        {selectedOrder.originalUrl ? (
                          <a href={selectedOrder.originalUrl} target="_blank" rel="noreferrer">
                            1688 原始订单
                          </a>
                        ) : null}
                        {renderInfoGrid([
                          { label: '订单号', value: selectedOrder.orderNo },
                          { label: '订单状态', value: orderStatusText(selectedOrder.orderStatus) },
                          { label: '创建时间', value: selectedOrder.orderTime },
                          { label: '付款时间', value: selectedOrder.paidAt },
                          { label: '买家公司', value: selectedOrder.buyerCompanyName },
                          { label: '买家会员', value: selectedOrder.buyerMemberName },
                          { label: '卖家公司', value: selectedOrder.supplierName },
                          { label: '卖家会员', value: selectedOrder.sellerMemberName },
                          { label: '货品总价', value: orderMoneyText(selectedOrder.goodsTotalText) },
                          { label: '运费', value: selectedOrder.freightText },
                          {
                            label: '实付款',
                            value: orderMoneyText(selectedOrder.paidAmountText || selectedOrder.amountText)
                          },
                          { label: '发起人', value: selectedOrder.initiatorLoginName },
                          { label: '下游订单号', value: selectedOrder.downstreamOrderNo }
                        ])}
                      </Space>
                    )
                  },
                  {
                    key: 'logistics',
                    label: '物流信息',
                    children: renderInfoGrid([
                      { label: '发货方', value: selectedOrder.shipperName },
                      { label: '物流状态', value: selectedOrder.logisticsStatus },
                      { label: '物流公司', value: selectedDetailItem?.logisticsCompany },
                      { label: '运单号', value: selectedDetailItem?.trackingNo },
                      { label: '下单批次号', value: selectedOrder.sourceBatchNo }
                    ])
                  },
                  {
                    key: 'receiver',
                    label: '收货与备注',
                    children: renderInfoGrid([
                      { label: '收货人', value: selectedOrder.receiverName },
                      { label: '收货手机', value: selectedOrder.sensitiveFields?.receiverPhone || '已隐藏' },
                      { label: '收货地址', value: selectedOrder.sensitiveFields?.receiverAddress || '已隐藏' },
                      { label: '联系电话', value: selectedOrder.receiverTelephone },
                      { label: '邮编', value: selectedOrder.receiverPostalCode },
                      { label: '买家备注', value: selectedOrder.sensitiveFields?.buyerRemark || '已隐藏' },
                      { label: '供应商联系', value: selectedOrder.sensitiveFields?.supplierContact || '已隐藏' }
                    ])
                  }
                ]}
              />
            </div>
          ) : null}
        </Spin>
      </Drawer>

      <Drawer
        title="Excel 导入历史"
        aria-label="Excel 导入历史"
        width={760}
        open={importHistoryOpen}
        onClose={() => {
          setImportHistoryOpen(false)
          setImportBatchDetail(undefined)
        }}
        destroyOnClose
      >
        <Spin spinning={importHistoryLoading}>
          <List
            size="small"
            dataSource={importBatches}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无导入批次" /> }}
            renderItem={(batch) => (
              <List.Item
                actions={[
                  <Button key="detail" type="link" onClick={() => void openImportBatchDetail(batch.batchId)}>
                    查看详情
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Text>{batch.fileName || `批次 ${batch.batchId}`}</Text>
                      <Tag color={importStatusColor(batch.status)}>{importStatusText(batch.status)}</Tag>
                    </Space>
                  }
                  description={
                    <Space size={8} wrap>
                      <Text type="secondary">{compactJoin([batch.storeCode, batch.siteCode], ' · ')}</Text>
                      <Text type="secondary">货品 {batch.productLineCount ?? 0}</Text>
                      <Text type="secondary">{batch.createdAt || '-'}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          {importBatchDetail ? (
            <Spin spinning={importBatchDetailLoading}>
              <section className="ali1688-import-history-detail">
                {renderInfoGrid([
                  { label: '批次', value: importBatchDetail.batchId },
                  { label: '状态', value: importStatusText(importBatchDetail.status) },
                  { label: '范围', value: compactJoin([importBatchDetail.storeCode, importBatchDetail.siteCode], ' · ') },
                  { label: '文件名', value: importBatchDetail.fileName },
                  { label: '文件大小', value: importBatchDetail.fileSize },
                  { label: '文件 Hash', value: importBatchDetail.fileHash },
                  { label: '表头版本', value: importBatchDetail.headerVersion },
                  { label: '订单数', value: importBatchDetail.orderHeaderRowCount },
                  { label: '货品行', value: importBatchDetail.productLineCount },
                  { label: '物流行', value: importBatchDetail.logisticsLineCount },
                  { label: '可导入', value: importBatchDetail.validRowCount },
                  { label: '疑似重复', value: importBatchDetail.duplicateCandidateCount },
                  { label: '错误数', value: importBatchDetail.errorCount },
                  { label: '警告数', value: importBatchDetail.warningCount },
                  { label: '上传人', value: importBatchDetail.createdBy },
                  { label: '上传时间', value: importBatchDetail.createdAt },
                  { label: '错误代码', value: importBatchDetail.failureCode },
                  { label: '错误摘要', value: importBatchDetail.failureMessage },
                  { label: '行级摘要', value: importBatchDetail.errorSummaryJson }
                ])}
              </section>
            </Spin>
          ) : null}
        </Spin>
      </Drawer>
    </>
  )
}
