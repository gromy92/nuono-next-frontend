import { HistoryOutlined, KeyOutlined, LinkOutlined, ReloadOutlined, SearchOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Avatar, Button, DatePicker, Drawer, Empty, Input, InputNumber, List, Modal, Segmented, Select, Space, Spin, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd'
import type { Dayjs } from 'dayjs'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  adjustAli1688HistoricalOrderAssignment,
  assignAli1688HistoricalOrderLines,
  createDevAli1688HistoricalOrderAuthorization,
  deleteAli1688HistoricalOrder,
  linkAli1688HistoricalOrderProduct,
  loadAli1688HistoricalOrderProductLinkCandidates,
  loadAli1688ExcelImportBatchDetail,
  loadAli1688ExcelImportBatches,
  loadAli1688HistoricalOrderDetail,
  loadAli1688HistoricalOrderItemAssignments,
  loadAli1688HistoricalOrderWorkbench,
  revokeAli1688HistoricalOrderAssignment,
  runInitialAli1688HistoricalOrderSync,
  runManualAli1688HistoricalOrderRefresh,
  unlinkAli1688HistoricalOrderProduct
} from './api'
import { Ali1688AuthorizationModal } from './components/Ali1688AuthorizationModal'
import { Ali1688ExcelImportModal } from './components/Ali1688ExcelImportModal'
import type {
  Ali1688ExcelImportBatch,
  Ali1688ExcelImportBatchDetail,
  Ali1688HistoricalOrderAssignmentRecord,
  Ali1688HistoricalOrderDetail,
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderProductLinkCandidate,
  Ali1688HistoricalOrderQuery,
  Ali1688HistoricalOrderRow,
  Ali1688HistoricalOrderWorkbench
} from './types'
import './Ali1688HistoricalOrdersPage.css'

const { Text } = Typography
const { RangePicker } = DatePicker

type OrderFilterState = {
  placedRange: [Dayjs | null, Dayjs | null] | null
  orderStatus?: string
  assignmentFilter?: string
  supplierKeyword: string
  keyword: string
}

type ProductLineRow = {
  lineKey: string
  order: Ali1688HistoricalOrderRow
  item?: Ali1688HistoricalOrderItem
  lineNo: number
}

type Ali1688HistoricalOrdersPageProps = {
  storeName?: string
  storeCode?: string
  siteCode?: string
  ownerUserId?: number
  operatorRoleName?: string
  availableStores?: AssignmentTargetStore[]
}

type AssignmentTargetStore = {
  storeCode: string
  projectCode?: string
  projectName?: string
  site?: string
}

type AssignmentTargetOption = {
  value: string
  label: string
  targetType: 'STORE_SITE' | 'CONSUMABLE'
  targetStoreCode?: string
  targetSiteCode?: string
}

type ProductLinkActionControls = {
  canMutateProductLinks: boolean
  productLinkUnlinkingAssignmentId?: number
  onOpenProductLinkModal: (row: ProductLineRow) => void | Promise<void>
  onSubmitProductUnlink: (assignmentId?: number) => void | Promise<void>
}

const CONSUMABLE_ASSIGNMENT_VALUE = '__CONSUMABLE__'

const EMPTY_WORKBENCH: Ali1688HistoricalOrderWorkbench = {
  ready: false,
  authorization: {
    status: 'loading'
  },
  roleCapabilities: {
    canAuthorize: false,
    canTriggerSync: false,
    canViewOrders: false
  },
  syncSummary: {
    latestTaskStatus: 'loading',
    totalOrderCount: 0,
    totalItemCount: 0
  },
  orders: [],
  storeScope: {
    status: 'owner_scope',
    message: '当前按老板全部 1688 授权账号查看。'
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
}

export function Ali1688HistoricalOrdersPage({ storeCode, siteCode, ownerUserId, operatorRoleName, availableStores }: Ali1688HistoricalOrdersPageProps) {
  const [workbench, setWorkbench] = useState<Ali1688HistoricalOrderWorkbench>(EMPTY_WORKBENCH)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<OrderFilterState>({
    placedRange: null,
    supplierKeyword: '',
    keyword: ''
  })
  const storeScopeQuery = useMemo(
    () => ({
      storeCode: storeCode?.trim() || undefined,
      siteCode: siteCode?.trim() || undefined
    }),
    [siteCode, storeCode]
  )
  const [query, setQuery] = useState<Ali1688HistoricalOrderQuery>({
    ...storeScopeQuery,
    page: 1,
    pageSize: 20
  })
  const [authorizationModalOpen, setAuthorizationModalOpen] = useState(false)
  const [excelImportModalOpen, setExcelImportModalOpen] = useState(false)
  const [importHistoryOpen, setImportHistoryOpen] = useState(false)
  const [importHistoryLoading, setImportHistoryLoading] = useState(false)
  const [importBatches, setImportBatches] = useState<Ali1688ExcelImportBatch[]>([])
  const [importBatchDetail, setImportBatchDetail] = useState<Ali1688ExcelImportBatchDetail>()
  const [importBatchDetailLoading, setImportBatchDetailLoading] = useState(false)
  const [authorizationSubmitting, setAuthorizationSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Ali1688HistoricalOrderDetail | null>(null)
  const [selectedLineItemId, setSelectedLineItemId] = useState<string | undefined>()
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedLineKeys, setSelectedLineKeys] = useState<string[]>([])
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [assignmentTargetValues, setAssignmentTargetValues] = useState<string[]>([])
  const [singleLineTargetQuantities, setSingleLineTargetQuantities] = useState<Record<string, number | null>>({})
  const [assigning, setAssigning] = useState(false)
  const [assignmentRecords, setAssignmentRecords] = useState<Ali1688HistoricalOrderAssignmentRecord[]>([])
  const [assignmentRecordsLoading, setAssignmentRecordsLoading] = useState(false)
  const [assignmentRecordQuantities, setAssignmentRecordQuantities] = useState<Record<string, number | null>>({})
  const [assignmentRecordUpdatingId, setAssignmentRecordUpdatingId] = useState<number>()
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<Ali1688HistoricalOrderRow | null>(null)
  const [deleteOrderReason, setDeleteOrderReason] = useState('不属于任何店铺')
  const [deleteOrderSubmitting, setDeleteOrderSubmitting] = useState(false)
  const [productLinkRow, setProductLinkRow] = useState<ProductLineRow | null>(null)
  const [productLinkCandidates, setProductLinkCandidates] = useState<Ali1688HistoricalOrderProductLinkCandidate[]>([])
  const [productLinkStatusFilter, setProductLinkStatusFilter] = useState<'unlinked' | 'linked'>('unlinked')
  const [productLinkSearch, setProductLinkSearch] = useState('')
  const [selectedProductCandidate, setSelectedProductCandidate] = useState<Ali1688HistoricalOrderProductLinkCandidate | null>(null)
  const [productLinkLoading, setProductLinkLoading] = useState(false)
  const [productLinkSubmitting, setProductLinkSubmitting] = useState(false)
  const [productLinkUnlinkingAssignmentId, setProductLinkUnlinkingAssignmentId] = useState<number>()
  const productLineRows = useMemo(() => buildProductLineRows(workbench.orders || []), [workbench.orders])
  const visibleProductLineRows = useMemo(
    () => filterProductLineRowsByAssignment(productLineRows, filters.assignmentFilter),
    [filters.assignmentFilter, productLineRows]
  )
  const filteredProductLinkCandidates = useMemo(
    () => filterProductLinkCandidates(productLinkCandidates, productLinkSearch),
    [productLinkCandidates, productLinkSearch]
  )
  const selectedProductLineRows = useMemo(
    () => visibleProductLineRows.filter((row) => selectedLineKeys.includes(row.lineKey)),
    [selectedLineKeys, visibleProductLineRows]
  )
  const assignmentTargetOptions = useMemo(
    () => buildAssignmentTargetOptions(availableStores, storeCode, siteCode),
    [availableStores, siteCode, storeCode]
  )
  const selectedDetailItem = selectedOrder
    ? findSelectedDetailItem(selectedOrder, selectedLineItemId)
    : undefined

  async function loadWorkbench(nextQuery: Ali1688HistoricalOrderQuery = query) {
    setLoading(true)
    try {
      const scopedQuery = withStoreScope(nextQuery, storeScopeQuery)
      setQuery(scopedQuery)
      setWorkbench(await loadAli1688HistoricalOrderWorkbench(scopedQuery))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 1688 历史订单失败')
      setWorkbench(EMPTY_WORKBENCH)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkbench({
      page: 1,
      pageSize: query.pageSize || 20
    })
  }, [storeScopeQuery.storeCode, storeScopeQuery.siteCode])

  const showAuthorizeButton = workbench.roleCapabilities?.canAuthorize
  const canTriggerSync = workbench.roleCapabilities?.canTriggerSync
  const canMutateProductLinks = canRoleMutateProductLinks(operatorRoleName)
  const hasSyncedOrders = (workbench.syncSummary?.totalOrderCount ?? 0) > 0

  return (
    <section className="ali1688-historical-orders-page" data-testid="ali1688-historical-orders-page">
      <section className="ali1688-historical-orders-controls ali1688-historical-orders-filters" aria-label="1688 历史订单操作与筛选">
        <div className="ali1688-historical-orders-query">
          <RangePicker
            allowClear
            value={filters.placedRange}
            onChange={(value) => setFilters((current) => ({ ...current, placedRange: value }))}
            placeholder={['下单开始', '下单结束']}
            format="YYYY-MM-DD"
          />
          <Select
            aria-label="订单状态"
            allowClear
            placeholder="订单状态"
            value={filters.orderStatus}
            onChange={(value) => setFilters((current) => ({ ...current, orderStatus: value }))}
            options={[
              { label: '待付款', value: '待付款' },
              { label: '已付款', value: '已付款' },
              { label: '已发货', value: '已发货' },
              { label: '已完成', value: '已完成' },
              { label: '已关闭', value: '已关闭' }
            ]}
            style={{ width: 140 }}
          />
          <Select
            aria-label="分配筛选"
            allowClear
            placeholder="分配筛选"
            value={filters.assignmentFilter}
            onChange={(value) => setFilters((current) => ({ ...current, assignmentFilter: value }))}
            options={[
              { label: '未分配', value: 'state:unassigned' },
              { label: '耗材', value: 'state:consumable' },
              ...assignmentTargetOptions
                .filter((option) => option.targetType === 'STORE_SITE')
                .map((option) => ({
                  label: option.label,
                  value: `target:${option.value}`
                }))
            ]}
            style={{ width: 190 }}
          />
          <Input
            aria-label="供应商"
            allowClear
            placeholder="供应商"
            value={filters.supplierKeyword}
            onChange={(event) => setFilters((current) => ({ ...current, supplierKeyword: event.target.value }))}
          />
          <Input
            allowClear
            placeholder="订单号 / 商品 / offerId / SKU / 货号"
            value={filters.keyword}
            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => void submitFilters()}>
            查询
          </Button>
        </div>
        <div className="ali1688-historical-orders-actions">
          {showAuthorizeButton ? (
            <Button icon={<UploadOutlined />} onClick={() => setExcelImportModalOpen(true)}>
              Excel 导入
            </Button>
          ) : null}
          {workbench.roleCapabilities?.canViewOrders ? (
            <Button icon={<HistoryOutlined />} onClick={() => void openImportHistory()}>
              导入历史
            </Button>
          ) : null}
          {showAuthorizeButton ? (
            <Button type="primary" icon={<KeyOutlined />} onClick={() => setAuthorizationModalOpen(true)}>
              授权 1688
            </Button>
          ) : null}
          <Button
            type="primary"
            disabled={selectedProductLineRows.length === 0}
            onClick={() => openAssignmentModal()}
          >
            批量分配到店
          </Button>
          {canTriggerSync ? (
            <Button
              className="ali1688-historical-orders-refresh-action"
              icon={<SyncOutlined />}
              loading={syncing}
              onClick={() => void runSyncAction()}
            >
              {hasSyncedOrders ? '刷新订单' : '同步历史订单'}
            </Button>
          ) : (
            <Button
              className="ali1688-historical-orders-refresh-action"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => void loadWorkbench()}
            >
              刷新
            </Button>
          )}
        </div>
      </section>

      {workbench.authorization?.status === 'not_authorized' ? (
        <Alert
          type="warning"
          showIcon
          message="老板授权后可同步 1688 历史订单"
          description={showAuthorizeButton ? '当前页面暂未连接 1688 买家账号。' : '当前页面暂未连接 1688 买家账号，请老板完成授权。'}
        />
      ) : null}

      {workbench.syncSummary?.failureMessage ? (
        <Alert
          type={workbench.syncSummary.latestTaskStatus === 'failed' ? 'error' : 'warning'}
          showIcon
          message={syncStatusText(workbench.syncSummary.latestTaskStatus)}
          description={workbench.syncSummary.failureMessage}
        />
      ) : null}

      <Spin spinning={loading}>
        <Table<ProductLineRow>
          rowKey={(row) => row.lineKey}
          size="middle"
          tableLayout="fixed"
          className="ali1688-historical-orders-table"
          scroll={{ x: 1540 }}
          dataSource={visibleProductLineRows}
          rowSelection={{
            selectedRowKeys: selectedLineKeys,
            onChange: (keys) => setSelectedLineKeys(keys.map(String)),
            getCheckboxProps: (row) => ({
              disabled: !isAssignableProductLine(row),
              'aria-label': `选择 ${row.item?.title || row.order.orderNo || row.lineKey}`
            })
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={workbench.authorization?.status === 'not_authorized' ? '暂无 1688 历史订单' : '暂无货品'}
              />
            )
          }}
          columns={[
            {
              title: '货品',
              key: 'product',
              width: 560,
              render: (_, row) => renderProductCell(row, assignmentTargetOptions, {
                canMutateProductLinks,
                productLinkUnlinkingAssignmentId,
                onOpenProductLinkModal: openProductLinkModal,
                onSubmitProductUnlink: submitProductUnlink
              })
            },
            {
              title: '供应商',
              key: 'supplier',
              width: 260,
              render: (_, row) => renderSupplierCell(row.order)
            },
            {
              title: '采购',
              key: 'purchase',
              width: 230,
              render: (_, row) => renderPurchaseCell(row.item, row.order)
            },
            {
              title: '物流',
              key: 'logistics',
              width: 150,
              render: (_, row) => renderLogisticsCell(row.item, row.order)
            },
            {
              title: '订单',
              key: 'order',
              width: 220,
              render: (_, row) => renderOrderContextCell(row.order, row.item)
            },
            {
              title: '操作',
              key: 'actions',
              width: 150,
              render: (_, row) => (
                <Space direction="vertical" size={2}>
                  <Button type="link" onClick={() => void openProductLineDetail(row)}>
                    查看货品
                  </Button>
                  {showAuthorizeButton && row.order.id ? (
                    <Button
                      type="link"
                      danger
                      aria-label={`删除订单 ${row.order.orderNo || row.order.id}`}
                      onClick={() => openDeleteOrderModal(row.order)}
                    >
                      删除订单
                    </Button>
                  ) : null}
                </Space>
              )
            }
          ]}
          pagination={{
            current: workbench.pagination?.page || 1,
            pageSize: workbench.pagination?.pageSize || 20,
            total: Math.max(workbench.pagination?.total || 0, visibleProductLineRows.length),
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条货品行`,
            onChange: (page, pageSize) => {
              void loadWorkbench({ ...query, page, pageSize })
            }
          }}
        />
      </Spin>

      <Drawer
        title="采购货品详情"
        aria-label="采购货品详情"
        width={760}
        open={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrder(null)
          setSelectedLineItemId(undefined)
          setAssignmentRecords([])
          setAssignmentRecordQuantities({})
          setAssignmentRecordUpdatingId(undefined)
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
                        { label: '分配状态', value: selectedDetailItem ? renderAssignmentState(selectedDetailItem, assignmentTargetOptions) : undefined },
                        { label: '分配数量', value: assignmentSummaryText(selectedDetailItem) },
                        { label: '单价', value: selectedDetailItem?.unitPriceText },
                        { label: '金额', value: selectedDetailItem?.amountText }
                      ])}
                      {renderAssignmentRecords()}
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
                        { label: '订单状态', value: selectedOrder.orderStatus },
                        { label: '创建时间', value: selectedOrder.orderTime },
                        { label: '付款时间', value: selectedOrder.paidAt },
                        { label: '买家公司', value: selectedOrder.buyerCompanyName },
                        { label: '买家会员', value: selectedOrder.buyerMemberName },
                        { label: '卖家公司', value: selectedOrder.supplierName },
                        { label: '卖家会员', value: selectedOrder.sellerMemberName },
                        { label: '货品总价', value: selectedOrder.goodsTotalText },
                        { label: '运费', value: selectedOrder.freightText },
                        { label: '涨价或折扣', value: selectedOrder.adjustmentText },
                        { label: '实付款', value: selectedOrder.paidAmountText || selectedOrder.amountText },
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

      <Modal
        title="分配货品到店铺"
        open={assignmentModalOpen}
        onCancel={() => setAssignmentModalOpen(false)}
        onOk={() => void submitAssignment()}
        okText="确认分配"
        cancelText="取消"
        confirmLoading={assigning}
        okButtonProps={{
          disabled: !canSubmitAssignment(selectedProductLineRows, assignmentTargetValues, singleLineTargetQuantities)
        }}
        destroyOnClose
      >
        <Space direction="vertical" size={12} className="ali1688-assignment-modal">
          {selectedProductLineRows.length === 1 ? (
            <>
              <Text type="secondary">单个货品可拆分到多个店铺，请为每个店铺填写数量。</Text>
              <Select
                aria-label="目标店铺"
                mode="multiple"
                placeholder="目标店铺"
                value={assignmentTargetValues}
                onChange={updateAssignmentTargetValues}
                options={assignmentTargetOptions.map((option) => ({ value: option.value, label: option.label }))}
              />
              <Space size={6} wrap className="ali1688-assignment-target-summary">
                {assignmentTargetOptions.map((option) => (
                  <Tag key={option.value}>{option.label}</Tag>
                ))}
              </Space>
              {selectedAssignmentTargets(assignmentTargetOptions, assignmentTargetValues).some(isConsumableTarget) ? (
                <List
                  size="small"
                  dataSource={selectedProductLineRows}
                  renderItem={(row) => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Text>{row.item?.title || '未返回'}</Text>}
                        description={<Text type="secondary">标记为耗材，使用整条货品行数量 {assignmentMaxQuantity(row)}</Text>}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <List
                  size="small"
                  dataSource={selectedAssignmentTargets(assignmentTargetOptions, assignmentTargetValues)}
                  renderItem={(target) => {
                    const row = selectedProductLineRows[0]
                    if (!row) {
                      return null
                    }
                    return (
                      <List.Item>
                        <List.Item.Meta
                          title={<Text>{target.label}</Text>}
                          description={
                            <Space size={8} wrap>
                              <Text type="secondary">{row.item?.title || '未返回'}</Text>
                              <Text type="secondary">剩余 {assignmentMaxQuantity(row)}</Text>
                            </Space>
                          }
                        />
                        <InputNumber
                          aria-label={`分配数量 ${target.label}`}
                          min={1}
                          max={assignmentMaxQuantity(row)}
                          value={singleLineTargetQuantities[target.value]}
                          onChange={(value) => updateSingleLineTargetQuantity(target.value, value)}
                        />
                      </List.Item>
                    )
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Text type="secondary">多选货品只能分配到一个店铺，数量使用订单剩余数量。</Text>
              <Select
                aria-label="目标店铺"
                placeholder="目标店铺"
                value={assignmentTargetValues[0]}
                onChange={(value) => setAssignmentTargetValues(value ? [value] : [])}
                options={assignmentTargetOptions.map((option) => ({ value: option.value, label: option.label }))}
              />
              <List
                size="small"
                dataSource={selectedProductLineRows}
                renderItem={(row) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text>{row.item?.title || '未返回'}</Text>}
                      description={
                        <Space size={8} wrap>
                          <Text type="secondary">使用数量 {assignmentMaxQuantity(row)}</Text>
                          <Text type="secondary">{compactJoin([row.order.orderNo, row.item?.productCode], ' · ')}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}
        </Space>
      </Modal>

      <Modal
        title="商品关联"
        open={Boolean(productLinkRow)}
        onCancel={closeProductLinkModal}
        onOk={() => void submitProductLink()}
        okText="确认关联"
        cancelText="取消"
        width={980}
        confirmLoading={productLinkSubmitting}
        okButtonProps={{ disabled: !selectedProductCandidate }}
        destroyOnClose
      >
        <div className="ali1688-product-link-modal">
          <section className="ali1688-product-link-source">
            <Text strong>{productLinkRow?.item?.title || '未返回'}</Text>
            {renderInfoGrid([
              { label: '规格', value: compactJoin([productLinkRow?.item?.skuText, productLinkRow?.item?.modelText], ' / ') },
              { label: '货号', value: productLinkRow?.item?.productCode || productLinkRow?.item?.singleProductCode },
              { label: '供应商', value: productLinkRow?.order.supplierName },
              { label: '数量', value: quantityText(productLinkRow?.item) },
              { label: '订单价', value: productLinkRow?.item?.unitPriceText },
              { label: '分配店铺', value: productLinkTargetLabel(productLinkRow?.item) },
              { label: '当前关联', value: productLinkRow?.item?.productLink?.displayText }
            ])}
          </section>
          <section className="ali1688-product-link-candidates">
            <div className="ali1688-product-link-filter">
              <Input.Search
                allowClear
                aria-label="搜索商品"
                placeholder="搜索 SKU Parent / Partner SKU / PSKU / 标题"
                value={productLinkSearch}
                onChange={(event) => setProductLinkSearch(event.target.value)}
                onSearch={(value) => setProductLinkSearch(value)}
              />
              <Segmented
                value={productLinkStatusFilter}
                options={[
                  { label: '未关联', value: 'unlinked' },
                  { label: '已关联', value: 'linked' }
                ]}
                onChange={(value) => void changeProductLinkStatusFilter(value as 'unlinked' | 'linked')}
              />
            </div>
            <Spin spinning={productLinkLoading}>
              <List
                size="small"
                dataSource={filteredProductLinkCandidates}
                className="ali1688-product-link-candidate-list"
                locale={{ emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={productLinkCandidates.length ? '没有匹配的商品' : productLinkEmptyText(productLinkStatusFilter)}
                  />
                ) }}
                renderItem={(product) => {
                  const selected = selectedProductCandidate?.skuParent === product.skuParent
                  return (
                    <List.Item
                      className={selected ? 'ali1688-product-link-candidate-selected' : undefined}
                      onClick={() => setSelectedProductCandidate(product)}
                      actions={[
                        <Button key="select" type={selected ? 'primary' : 'default'} size="small">
                          {selected ? '已选择' : '选择'}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar shape="square" size={48} src={product.productImageUrl} />}
                        title={<Text>{product.productTitle || product.skuParent}</Text>}
                        description={
                          <Space size={6} wrap>
                            <Tag>SKU {product.skuParent}</Tag>
                            {product.partnerSku ? <Tag>Partner {product.partnerSku}</Tag> : null}
                            {product.pskuCode ? <Tag>PSKU {product.pskuCode}</Tag> : null}
                            {product.siteCode ? <Text type="secondary">{product.siteCode}</Text> : null}
                            {product.linkStatus === 'linked'
                              ? <Tag color="blue">已关联{product.linkedAssignmentCount ? ` ${product.linkedAssignmentCount}` : ''}</Tag>
                              : <Tag color="default">未关联</Tag>}
                          </Space>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            </Spin>
          </section>
        </div>
      </Modal>

      <Modal
        title="删除订单"
        open={Boolean(deleteOrderTarget)}
        onCancel={() => {
          setDeleteOrderTarget(null)
          setDeleteOrderReason('不属于任何店铺')
        }}
        onOk={() => void submitDeleteOrder()}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: !deleteOrderReason.trim() }}
        confirmLoading={deleteOrderSubmitting}
        destroyOnClose
      >
        <Space direction="vertical" size={12} className="ali1688-delete-order-modal">
          <Text strong>{deleteOrderTarget?.orderNo || deleteOrderTarget?.id || '-'}</Text>
          <Input
            aria-label="删除原因"
            value={deleteOrderReason}
            onChange={(event) => setDeleteOrderReason(event.target.value)}
          />
        </Space>
      </Modal>

      <Ali1688AuthorizationModal
        open={authorizationModalOpen}
        submitting={authorizationSubmitting}
        onCancel={() => setAuthorizationModalOpen(false)}
        onConfirm={() => void confirmDevAuthorization()}
      />
      <Ali1688ExcelImportModal
        open={excelImportModalOpen}
        storeCode={storeScopeQuery.storeCode}
        siteCode={storeScopeQuery.siteCode}
        onClose={() => setExcelImportModalOpen(false)}
        onImported={async () => {
          await loadWorkbench({ ...query, page: 1 })
          if (importHistoryOpen) {
            await loadImportHistory(false)
          }
        }}
      />
    </section>
  )

  async function confirmDevAuthorization() {
    setAuthorizationSubmitting(true)
    try {
      setWorkbench(await createDevAli1688HistoricalOrderAuthorization())
      setAuthorizationModalOpen(false)
      message.success('1688 历史订单授权已连接')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '授权 1688 历史订单失败')
    } finally {
      setAuthorizationSubmitting(false)
    }
  }

  async function runSyncAction() {
    setSyncing(true)
    try {
      setWorkbench(
        hasSyncedOrders
          ? await runManualAli1688HistoricalOrderRefresh()
          : await runInitialAli1688HistoricalOrderSync()
      )
      message.success(hasSyncedOrders ? '1688 历史订单刷新完成' : '1688 历史订单同步完成')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '同步 1688 历史订单失败')
    } finally {
      setSyncing(false)
    }
  }

  function buildQueryFromFilters(): Ali1688HistoricalOrderQuery {
    const [placedStart, placedEnd] = filters.placedRange || []
    return {
      placedTimeFrom: placedStart ? `${placedStart.format('YYYY-MM-DD')} 00:00:00` : undefined,
      placedTimeTo: placedEnd ? `${placedEnd.format('YYYY-MM-DD')} 23:59:59` : undefined,
      orderStatus: filters.orderStatus,
      supplierKeyword: filters.supplierKeyword.trim() || undefined,
      keyword: filters.keyword.trim() || undefined,
      ...assignmentFilterQuery(filters.assignmentFilter),
      ...storeScopeQuery,
      page: 1,
      pageSize: workbench.pagination?.pageSize || 20
    }
  }

  async function submitFilters() {
    setSelectedLineKeys([])
    await loadWorkbench(buildQueryFromFilters())
  }

  async function openProductLineDetail(row: ProductLineRow) {
    setSelectedLineItemId(row.item?.id)
    setSelectedOrder(row.order)
    setAssignmentRecords([])
    setAssignmentRecordQuantities({})
    if (row.item?.id) {
      void loadAssignmentRecords(row.item.id)
    }
    if (!row.order.id) {
      return
    }
    setDetailLoading(true)
    try {
      setSelectedOrder(await loadAli1688HistoricalOrderDetail(row.order.id, storeScopeQuery))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 1688 历史订单详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  async function openImportHistory() {
    setImportHistoryOpen(true)
    await loadImportHistory(true)
  }

  async function loadImportHistory(resetDetail: boolean) {
    setImportHistoryLoading(true)
    if (resetDetail) {
      setImportBatchDetail(undefined)
    }
    try {
      setImportBatches(await loadAli1688ExcelImportBatches(storeScopeQuery))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 1688 Excel 导入历史失败')
      setImportBatches([])
    } finally {
      setImportHistoryLoading(false)
    }
  }

  async function openImportBatchDetail(batchId: number) {
    setImportBatchDetailLoading(true)
    try {
      setImportBatchDetail(await loadAli1688ExcelImportBatchDetail(batchId, storeScopeQuery))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 1688 Excel 导入详情失败')
    } finally {
      setImportBatchDetailLoading(false)
    }
  }

  function openDeleteOrderModal(order: Ali1688HistoricalOrderRow) {
    setDeleteOrderTarget(order)
    setDeleteOrderReason('不属于任何店铺')
  }

  async function openProductLinkModal(row: ProductLineRow) {
    if (!canMutateProductLinks) {
      message.warning('当前角色只能查看商品关联，不能修改')
      return
    }
    if (!canLinkProductLine(row) || !row.item?.assignmentId) {
      message.warning('请先把货品行分配到店铺后再关联商品')
      return
    }
    const defaultLinkStatus = row.item.productLink?.status === 'linked' ? 'linked' : 'unlinked'
    setProductLinkRow(row)
    setProductLinkStatusFilter(defaultLinkStatus)
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    setProductLinkCandidates([])
    await loadProductLinkCandidatesForRow(row, defaultLinkStatus)
  }

  async function changeProductLinkStatusFilter(linkStatus: 'unlinked' | 'linked') {
    setProductLinkStatusFilter(linkStatus)
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    if (productLinkRow) {
      await loadProductLinkCandidatesForRow(productLinkRow, linkStatus)
    }
  }

  async function loadProductLinkCandidatesForRow(row: ProductLineRow, linkStatus: 'unlinked' | 'linked') {
    const assignmentId = row.item?.assignmentId
    if (!assignmentId) {
      return
    }
    setProductLinkLoading(true)
    try {
      setProductLinkCandidates(await loadAli1688HistoricalOrderProductLinkCandidates({
        assignmentId,
        linkStatus
      }))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取商品关联候选失败')
      setProductLinkCandidates([])
    } finally {
      setProductLinkLoading(false)
    }
  }

  function closeProductLinkModal() {
    setProductLinkRow(null)
    setProductLinkStatusFilter('unlinked')
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    setProductLinkCandidates([])
    setProductLinkLoading(false)
  }

  async function submitProductLink() {
    if (!canMutateProductLinks) {
      message.warning('当前角色只能查看商品关联，不能修改')
      return
    }
    if (!productLinkRow?.item?.assignmentId || !selectedProductCandidate?.skuParent) {
      message.error('请选择要关联的商品')
      return
    }
    setProductLinkSubmitting(true)
    try {
      await linkAli1688HistoricalOrderProduct({
        assignmentId: productLinkRow.item.assignmentId,
        skuParent: selectedProductCandidate.skuParent,
        partnerSku: selectedProductCandidate.partnerSku,
        pskuCode: selectedProductCandidate.pskuCode,
        productTitle: selectedProductCandidate.productTitle,
        productImageUrl: selectedProductCandidate.productImageUrl
      })
      message.success('商品关联已保存')
      closeProductLinkModal()
      await loadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '关联商品失败')
    } finally {
      setProductLinkSubmitting(false)
    }
  }

  async function submitProductUnlink(assignmentId?: number) {
    if (!canMutateProductLinks) {
      message.warning('当前角色只能查看商品关联，不能修改')
      return
    }
    if (!assignmentId) {
      return
    }
    setProductLinkUnlinkingAssignmentId(assignmentId)
    try {
      await unlinkAli1688HistoricalOrderProduct(assignmentId)
      message.success('商品关联已解除')
      await loadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '解除商品关联失败')
    } finally {
      setProductLinkUnlinkingAssignmentId(undefined)
    }
  }

  async function submitDeleteOrder() {
    if (!deleteOrderTarget?.id) {
      return
    }
    setDeleteOrderSubmitting(true)
    try {
      await deleteAli1688HistoricalOrder(deleteOrderTarget.id, {
        ...storeScopeQuery,
        reason: deleteOrderReason.trim()
      })
      message.success('1688 历史订单已删除')
      setDeleteOrderTarget(null)
      setDeleteOrderReason('不属于任何店铺')
      setSelectedLineKeys([])
      await loadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除 1688 历史订单失败')
    } finally {
      setDeleteOrderSubmitting(false)
    }
  }

  function openAssignmentModal() {
    if (!selectedProductLineRows.length) {
      message.warning('请选择要分配的货品行')
      return
    }
    const nextTargetValue =
      assignmentTargetValues[0] ||
      assignmentTargetOptions.find((option) =>
        option.targetStoreCode === storeScopeQuery.storeCode &&
        (!option.targetSiteCode || option.targetSiteCode === storeScopeQuery.siteCode)
      )?.value ||
      assignmentTargetOptions[0]?.value
    const singleLineMode = selectedProductLineRows.length === 1
    setAssignmentTargetValues(singleLineMode ? [] : nextTargetValue ? [nextTargetValue] : [])
    setSingleLineTargetQuantities(() => {
      if (!singleLineMode) {
        return {}
      }
      return {}
    })
    setAssignmentModalOpen(true)
  }

  function updateAssignmentTargetValues(values: string[]) {
    const nextValues = values.includes(CONSUMABLE_ASSIGNMENT_VALUE)
      ? [CONSUMABLE_ASSIGNMENT_VALUE]
      : values
    setAssignmentTargetValues(nextValues)
    setSingleLineTargetQuantities((current) => {
      if (selectedProductLineRows.length !== 1) {
        return {}
      }
      const selectedRow = selectedProductLineRows[0]
      if (!selectedRow) {
        return {}
      }
      const maxQuantity = assignmentMaxQuantity(selectedRow)
      if (nextValues.includes(CONSUMABLE_ASSIGNMENT_VALUE)) {
        return {}
      }
      return nextValues.reduce<Record<string, number | null>>((next, value) => {
        const currentQuantity = current[value]
        next[value] = currentQuantity && currentQuantity > 0
          ? Math.min(currentQuantity, maxQuantity)
          : null
        return next
      }, {})
    })
  }

  function updateSingleLineTargetQuantity(targetValue: string, value: number | string | null) {
    const parsed = typeof value === 'string' ? Number(value) : value
    setSingleLineTargetQuantities((current) => ({
      ...current,
      [targetValue]: typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
    }))
  }

  async function submitAssignment() {
    const targets = selectedAssignmentTargets(assignmentTargetOptions, assignmentTargetValues)
    if (!targets.length) {
      message.error('请选择目标店铺')
      return
    }
    setAssigning(true)
    try {
      let assignedLineCount = 0
      if (targets.length === 1 && isConsumableTarget(targets[0])) {
        const result = await assignAli1688HistoricalOrderLines({
          targetType: 'CONSUMABLE',
          lines: selectedProductLineRows.map((row) => ({
            itemId: row.item?.id || ''
          }))
        })
        assignedLineCount += result.assignedLineCount
      } else if (selectedProductLineRows.length === 1) {
        const row = selectedProductLineRows[0]
        if (!row) {
          message.error('请选择要分配的货品行')
          return
        }
        for (const target of targets) {
          const quantity = singleLineTargetQuantities[target.value] || 0
          const result = await assignAli1688HistoricalOrderLines({
            targetType: 'STORE_SITE',
            targetStoreCode: target.targetStoreCode,
            targetSiteCode: target.targetSiteCode,
            lines: [{ itemId: row.item?.id || '', quantity }]
          })
          assignedLineCount += result.assignedLineCount
        }
      } else {
        const target = targets[0]
        const result = await assignAli1688HistoricalOrderLines({
          targetType: 'STORE_SITE',
          targetStoreCode: target.targetStoreCode,
          targetSiteCode: target.targetSiteCode,
          lines: selectedProductLineRows.map((row) => ({
            itemId: row.item?.id || '',
            quantity: assignmentMaxQuantity(row)
          }))
        })
        assignedLineCount += result.assignedLineCount
      }
      message.success(`已分配 ${assignedLineCount} 条货品`)
      setAssignmentModalOpen(false)
      setSelectedLineKeys([])
      await loadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '分配 1688 历史订单货品失败')
    } finally {
      setAssigning(false)
    }
  }

  async function loadAssignmentRecords(itemId: string) {
    setAssignmentRecordsLoading(true)
    try {
      const records = await loadAli1688HistoricalOrderItemAssignments(itemId)
      setAssignmentRecords(records)
      setAssignmentRecordQuantities(buildAssignmentRecordQuantityState(records))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 1688 分配记录失败')
      setAssignmentRecords([])
      setAssignmentRecordQuantities({})
    } finally {
      setAssignmentRecordsLoading(false)
    }
  }

  function updateAssignmentRecordQuantity(assignmentId: number | undefined, value: number | string | null) {
    if (!assignmentId) {
      return
    }
    const parsed = typeof value === 'string' ? Number(value) : value
    setAssignmentRecordQuantities((current) => ({
      ...current,
      [assignmentId]: typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
    }))
  }

  async function submitAssignmentRecordAdjustment(record: Ali1688HistoricalOrderAssignmentRecord) {
    if (!record.assignmentId || !selectedDetailItem?.id) {
      return
    }
    const quantity = assignmentRecordQuantities[record.assignmentId]
    if (!quantity || quantity <= 0) {
      message.error('请填写调整后的分配数量')
      return
    }
    setAssignmentRecordUpdatingId(record.assignmentId)
    try {
      await adjustAli1688HistoricalOrderAssignment(record.assignmentId, { quantity })
      message.success('分配记录已调整')
      await loadAssignmentRecords(selectedDetailItem.id)
      await loadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '调整 1688 分配记录失败')
    } finally {
      setAssignmentRecordUpdatingId(undefined)
    }
  }

  async function submitAssignmentRecordRevoke(record: Ali1688HistoricalOrderAssignmentRecord) {
    if (!record.assignmentId || !selectedDetailItem?.id) {
      return
    }
    setAssignmentRecordUpdatingId(record.assignmentId)
    try {
      await revokeAli1688HistoricalOrderAssignment(record.assignmentId)
      message.success('分配记录已撤回')
      await loadAssignmentRecords(selectedDetailItem.id)
      await loadWorkbench(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '撤回 1688 分配记录失败')
    } finally {
      setAssignmentRecordUpdatingId(undefined)
    }
  }

  function renderAssignmentRecords() {
    return (
      <section className="ali1688-assignment-records" aria-label="分配记录">
        <Text strong>分配记录</Text>
        <Spin spinning={assignmentRecordsLoading}>
          <List
            size="small"
            dataSource={assignmentRecords}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无分配记录" /> }}
            renderItem={(record) => {
              const targetLabel = assignmentRecordTargetLabel(record)
              const disabled = record.status !== 'active'
              const consumableRecord = record.targetType === 'CONSUMABLE'
              return (
                <List.Item
                  actions={[
                    consumableRecord ? null : (
                      <InputNumber
                        key="quantity"
                        aria-label={`调整数量 ${targetLabel}`}
                        min={1}
                        value={
                          record.assignmentId
                            ? assignmentRecordQuantities[record.assignmentId] ?? record.assignedQuantity
                            : record.assignedQuantity
                        }
                        disabled={disabled}
                        onChange={(value) => updateAssignmentRecordQuantity(record.assignmentId, value)}
                      />
                    ),
                    consumableRecord ? null : (
                      <Button
                        key="adjust"
                        loading={assignmentRecordUpdatingId === record.assignmentId}
                        disabled={disabled}
                        onClick={() => void submitAssignmentRecordAdjustment(record)}
                      >
                        调整 {targetLabel}
                      </Button>
                    ),
                    <Button
                      key="revoke"
                      danger
                      loading={assignmentRecordUpdatingId === record.assignmentId}
                      disabled={disabled}
                      onClick={() => void submitAssignmentRecordRevoke(record)}
                    >
                      撤回 {targetLabel}
                    </Button>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space size={8} wrap>
                        <Text>{targetLabel}</Text>
                        <Tag color={record.status === 'active' ? 'processing' : 'default'}>
                          {assignmentRecordStatusText(record.status)}
                        </Tag>
                        <Text type="secondary">数量 {record.assignedQuantity ?? 0}</Text>
                      </Space>
                    }
                    description={
                      <Space size={8} wrap>
                        <Text type="secondary">创建 {record.createdBy ?? '-'} · {record.createdAt || '-'}</Text>
                        <Text type="secondary">更新 {record.updatedBy ?? '-'} · {record.updatedAt || '-'}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )
            }}
          />
        </Spin>
      </section>
    )
  }
}

function withStoreScope(
  query: Ali1688HistoricalOrderQuery,
  storeScopeQuery: Pick<Ali1688HistoricalOrderQuery, 'storeCode' | 'siteCode'>
) {
  return {
    ...query,
    ...storeScopeQuery
  }
}

function assignmentFilterQuery(
  assignmentFilter?: string
): Pick<Ali1688HistoricalOrderQuery, 'assignmentState' | 'assignmentTargetStoreCode' | 'assignmentTargetSiteCode'> {
  if (assignmentFilter === 'state:unassigned') {
    return { assignmentState: 'unassigned' }
  }
  if (assignmentFilter === 'state:consumable') {
    return { assignmentState: 'consumable' }
  }
  if (assignmentFilter?.startsWith('target:')) {
    const target = parseAssignmentTargetValue(assignmentFilter.slice('target:'.length))
    return {
      assignmentTargetStoreCode: target.targetStoreCode || undefined,
      assignmentTargetSiteCode: target.targetSiteCode || undefined
    }
  }
  return {}
}

function filterProductLineRowsByAssignment(rows: ProductLineRow[], assignmentFilter?: string) {
  if (!assignmentFilter) {
    return rows
  }
  if (assignmentFilter === 'state:unassigned') {
    return rows.filter((row) => row.item?.assignmentStatus === 'unassigned')
  }
  if (assignmentFilter === 'state:consumable') {
    return rows.filter((row) =>
      parseAssignmentBreakdownTargets(row.item?.assignmentBreakdownText).some((entry) => entry.targetType === 'CONSUMABLE')
    )
  }
  if (assignmentFilter.startsWith('target:')) {
    const target = parseAssignmentTargetValue(assignmentFilter.slice('target:'.length))
    if (!target.targetStoreCode) {
      return rows
    }
    return rows.filter((row) =>
      parseAssignmentBreakdownTargets(row.item?.assignmentBreakdownText).some((entry) =>
        entry.targetStoreCode === target.targetStoreCode &&
        (!target.targetSiteCode || entry.targetSiteCode === target.targetSiteCode)
      )
    )
  }
  return rows
}

function buildProductLineRows(orders: Ali1688HistoricalOrderRow[]): ProductLineRow[] {
  return orders.flatMap((order, orderIndex) => {
    if (!order.items?.length) {
      return [{
        lineKey: `${order.id || order.orderNo || 'order'}:${orderIndex}:empty`,
        order,
        lineNo: 1
      }]
    }
    return order.items.map((item, index) => ({
      lineKey: [
        order.id || order.orderNo || 'order',
        orderIndex,
        item.id || item.offerId || 'item',
        item.assignmentId || 'assignment',
        index,
        item.assignmentBreakdownText || item.assignmentStatus || 'raw',
        item.quantity ?? 'missing'
      ].join(':'),
      order,
      item,
      lineNo: index + 1
    }))
  })
}

function buildAssignmentTargetOptions(
  availableStores: AssignmentTargetStore[] | undefined,
  fallbackStoreCode?: string,
  fallbackSiteCode?: string
): AssignmentTargetOption[] {
  const sourceStores = availableStores?.length
    ? availableStores
    : fallbackStoreCode
      ? [{ storeCode: fallbackStoreCode, projectCode: fallbackStoreCode, site: fallbackSiteCode }]
      : []
  const seen = new Set<string>()
  const options: AssignmentTargetOption[] = [{
    value: CONSUMABLE_ASSIGNMENT_VALUE,
    label: '耗材（共用）',
    targetType: 'CONSUMABLE'
  }]
  sourceStores.forEach((store) => {
    const targetStoreCode = (store.projectCode || store.storeCode || '').trim()
    if (!targetStoreCode) {
      return
    }
    const targetSiteCode = (store.site || '').trim() || undefined
    const value = assignmentTargetValue(targetStoreCode, targetSiteCode)
    if (seen.has(value)) {
      return
    }
    seen.add(value)
    options.push({
      value,
      label: compactJoin([store.projectName || store.projectCode || store.storeCode || targetStoreCode, targetSiteCode], ' '),
      targetType: 'STORE_SITE',
      targetStoreCode,
      targetSiteCode
    })
  })
  return options
}

function assignmentTargetValue(targetStoreCode: string, targetSiteCode?: string) {
  return targetSiteCode ? `${targetStoreCode}::${targetSiteCode}` : targetStoreCode
}

function parseAssignmentTargetValue(value: string) {
  if (value === CONSUMABLE_ASSIGNMENT_VALUE) {
    return {
      targetType: 'CONSUMABLE' as const,
      targetStoreCode: '',
      targetSiteCode: undefined
    }
  }
  const [targetStoreCode, targetSiteCode] = value.split('::')
  return {
    targetType: 'STORE_SITE' as const,
    targetStoreCode: targetStoreCode?.trim() || '',
    targetSiteCode: targetSiteCode?.trim() || undefined
  }
}

function isConsumableTarget(target?: AssignmentTargetOption) {
  return target?.targetType === 'CONSUMABLE'
}

function selectedAssignmentTargets(
  options: AssignmentTargetOption[],
  targetValues: string[]
) {
  const targetValueSet = new Set(targetValues)
  return options.filter((option) => targetValueSet.has(option.value))
}

function buildAssignmentRecordQuantityState(records: Ali1688HistoricalOrderAssignmentRecord[]) {
  return records.reduce<Record<string, number | null>>((current, record) => {
    if (record.assignmentId && record.status === 'active') {
      current[record.assignmentId] = record.assignedQuantity ?? null
    }
    return current
  }, {})
}

function assignmentRecordTargetLabel(record: Ali1688HistoricalOrderAssignmentRecord) {
  if (record.targetType === 'CONSUMABLE') {
    return '耗材（共用）'
  }
  const siteCode = record.targetSiteCode && record.targetSiteCode !== '*'
    ? record.targetSiteCode
    : undefined
  return compactJoin([record.targetStoreCode, siteCode], ' · ') || `分配 ${record.assignmentId || ''}`.trim()
}

function assignmentRecordStatusText(status?: string) {
  if (status === 'revoked') {
    return '已撤回'
  }
  if (status === 'active') {
    return '有效'
  }
  return status || '未知'
}

function isAssignableProductLine(row: ProductLineRow) {
  if (!row.item?.id) {
    return false
  }
  if (row.item.assignmentStatus === 'quantity_missing') {
    return false
  }
  return assignmentMaxQuantity(row) > 0
}

function canLinkProductLine(row: ProductLineRow) {
  return Boolean(
    row.item?.assignmentId &&
    row.item.assignmentStatus === 'assigned' &&
    row.item.assignmentTargetType !== 'CONSUMABLE' &&
    row.item.assignmentTargetStoreCode
  )
}

function canRoleMutateProductLinks(roleName?: string) {
  const normalizedRoleName = roleName?.trim()
  if (!normalizedRoleName) {
    return true
  }
  return ['老板', '运营主管', '运营管理', '运营'].includes(normalizedRoleName)
}

function productLinkTargetLabel(item?: Ali1688HistoricalOrderItem) {
  if (!item?.assignmentTargetStoreCode) {
    return undefined
  }
  const siteCode = item.assignmentTargetSiteCode && item.assignmentTargetSiteCode !== '*'
    ? item.assignmentTargetSiteCode
    : undefined
  return compactJoin([item.assignmentTargetStoreCode, siteCode], ' · ')
}

function filterProductLinkCandidates(products: Ali1688HistoricalOrderProductLinkCandidate[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  return products.filter((product) => {
    if (!normalizedKeyword) {
      return true
    }
    return [
      product.skuParent,
      product.partnerSku,
      product.pskuCode,
      product.offerCode,
      product.productTitle
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword)
  })
}

function productLinkEmptyText(linkStatus: 'unlinked' | 'linked') {
  return linkStatus === 'linked' ? '当前筛选下没有已关联商品' : '当前筛选下没有未关联商品'
}

function assignmentMaxQuantity(row: ProductLineRow) {
  const remaining = row.item?.remainingQuantity
  if (remaining !== undefined && remaining !== null) {
    return Math.max(0, remaining)
  }
  return Math.max(0, row.item?.quantity ?? 0)
}

function canSubmitAssignment(
  rows: ProductLineRow[],
  targetValues: string[],
  targetQuantities: Record<string, number | null>
) {
  if (!targetValues.length || !rows.length) {
    return false
  }
  if (rows.length === 1) {
    const row = rows[0]
    if (!row?.item?.id) {
      return false
    }
    const hasConsumableTarget = targetValues.includes(CONSUMABLE_ASSIGNMENT_VALUE)
    if (hasConsumableTarget) {
      return targetValues.length === 1 && assignmentMaxQuantity(row) > 0
    }
    const maxQuantity = assignmentMaxQuantity(row)
    const totalQuantity = targetValues.reduce((sum, targetValue) => {
      const quantity = targetQuantities[targetValue]
      return sum + (typeof quantity === 'number' ? quantity : 0)
    }, 0)
    return (
      maxQuantity > 0 &&
      totalQuantity > 0 &&
      totalQuantity <= maxQuantity &&
      targetValues.every((targetValue) => {
        const quantity = targetQuantities[targetValue]
        return typeof quantity === 'number' && quantity > 0 && quantity <= maxQuantity
      })
    )
  }
  return targetValues.length === 1 && rows.every((row) => Boolean(row.item?.id) && assignmentMaxQuantity(row) > 0)
}

function renderProductCell(
  row: ProductLineRow,
  assignmentTargetOptions: AssignmentTargetOption[],
  productLinkControls: ProductLinkActionControls
) {
  const item = row.item
  const title = item?.title || '未返回'
  return (
    <div className="ali1688-product-line-cell">
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
        {renderProductLinkActions(row, productLinkControls)}
        <div className="ali1688-product-line-missing">
          {renderMissingFields(mergedMissingFields(row.order.missingFields, item?.missingFields))}
        </div>
      </div>
    </div>
  )
}

function renderProductLinkActions(row: ProductLineRow, controls: ProductLinkActionControls) {
  const item = row.item
  const hasLinkState = Boolean(item?.productLink?.skuParent)
  const canShowLinkAction = controls.canMutateProductLinks && canLinkProductLine(row)
  const canShowUnlinkAction = controls.canMutateProductLinks && hasLinkState && item?.assignmentId
  if (!hasLinkState && !canShowLinkAction) {
    return null
  }

  return (
    <Space size={[6, 4]} wrap className="ali1688-product-link-actions">
      {renderProductLinkState(item)}
      {canShowLinkAction ? (
        <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => void controls.onOpenProductLinkModal(row)}>
          {hasLinkState ? '改关联' : '商品关联'}
        </Button>
      ) : null}
      {canShowUnlinkAction ? (
        <Button
          type="link"
          size="small"
          danger
          loading={controls.productLinkUnlinkingAssignmentId === item?.assignmentId}
          onClick={() => void controls.onSubmitProductUnlink(item?.assignmentId)}
        >
          解除关联
        </Button>
      ) : null}
    </Space>
  )
}

function renderProductLinkState(item: Ali1688HistoricalOrderItem | undefined) {
  if (!item?.productLink?.skuParent) {
    return null
  }
  return (
    <Text className="ali1688-product-link-state">
      {item.productLink.displayText || `已关联: ${item.productLink.skuParent}`}
    </Text>
  )
}

function renderSupplierCell(order: Ali1688HistoricalOrderRow) {
  return (
    <div className="ali1688-supplier-cell">
      <Text className="ali1688-supplier-name">{labeledValue('供应商', order.supplierName || '未返回')}</Text>
      {order.sellerMemberName ? <Text type="secondary">{labeledValue('卖家', order.sellerMemberName)}</Text> : null}
      {order.buyerCompanyName ? <Text type="secondary">{labeledValue('买家', order.buyerCompanyName)}</Text> : null}
    </div>
  )
}

function renderPurchaseCell(item: Ali1688HistoricalOrderItem | undefined, order: Ali1688HistoricalOrderRow) {
  return (
    <div className="ali1688-purchase-cell">
      <Text strong>{labeledValue('订单总价', order.goodsTotalText || order.amountText || '未返回')}</Text>
      <Text type="secondary">{labeledValue('运费', order.freightText || '未返回')}</Text>
      <Text type="secondary">{labeledValue('涨价/折扣', order.adjustmentText || '未返回')}</Text>
      <Text type="secondary">{labeledValue('实付款', order.paidAmountText || order.amountText || '未返回')}</Text>
      <Text type="secondary">{labeledValue('数量', quantityText(item))}</Text>
      <Text type="secondary">{labeledValue('订单价', item?.unitPriceText || '未返回')}</Text>
    </div>
  )
}

function renderLogisticsCell(item: Ali1688HistoricalOrderItem | undefined, order: Ali1688HistoricalOrderRow) {
  return (
    <div className="ali1688-logistics-cell">
      <Text>{labeledValue('物流', item?.logisticsCompany || order.logisticsStatus || '未返回')}</Text>
      {item?.trackingNo ? <Text type="secondary">{item.trackingNo}</Text> : null}
    </div>
  )
}

function renderOrderContextCell(order: Ali1688HistoricalOrderRow, item?: Ali1688HistoricalOrderItem) {
  return (
    <div className="ali1688-order-context-cell">
      <Text className="ali1688-order-no">{labeledValue('订单号', order.orderNo || '未返回')}</Text>
      <Space size={4} wrap className="ali1688-order-context-tags">
        {item?.offerId ? <Tag>Offer {item.offerId}</Tag> : null}
        {item?.skuId ? <Tag>SKU {item.skuId}</Tag> : null}
      </Space>
      <Text type="secondary">{labeledValue('下单时间', order.orderTime || '未返回')}</Text>
      <Tag color={order.orderStatus ? 'processing' : 'default'}>{order.orderStatus || '状态未返回'}</Tag>
    </div>
  )
}

function labeledValue(label: string, value?: ReactNode) {
  return (
    <>
      <span className="ali1688-field-label">{label}: </span>
      {displayValue(value)}
    </>
  )
}

function findSelectedDetailItem(order: Ali1688HistoricalOrderDetail, selectedLineItemId?: string) {
  if (!order.items?.length) {
    return undefined
  }
  if (!selectedLineItemId) {
    return order.items[0]
  }
  return order.items.find((item) => item.id === selectedLineItemId) || order.items[0]
}

function renderInfoGrid(fields: Array<{ label: string; value?: ReactNode }>) {
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

function displayValue(value?: ReactNode) {
  return value === undefined || value === null || value === '' ? '未返回' : value
}

function mergedMissingFields(...fieldGroups: Array<string[] | undefined>) {
  const seen = new Set<string>()
  fieldGroups.flatMap((fields) => fields || []).forEach((field) => {
    if (field?.trim()) {
      seen.add(field)
    }
  })
  return Array.from(seen)
}

function quantityText(item?: Ali1688HistoricalOrderItem) {
  if (!item || item.quantity === undefined || item.quantity === null) {
    return '数量未返回'
  }
  return `${item.quantity}${item.unit || ''}`
}

function renderAssignmentState(
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

function assignmentTargetDisplayText(
  assignmentBreakdownText: string | undefined,
  assignmentTargetOptions: AssignmentTargetOption[]
) {
  const entries = parseAssignmentBreakdownTargets(assignmentBreakdownText)
  const labels = entries
    .map((entry) => {
      if (entry.targetType === 'CONSUMABLE') {
        return '耗材'
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

function parseAssignmentBreakdownTargets(assignmentBreakdownText?: string) {
  return (assignmentBreakdownText || '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const tokens = part.split(/\s+/).filter(Boolean)
      if (tokens[0] === '耗材' || tokens[0] === 'CONSUMABLE') {
        return {
          targetType: 'CONSUMABLE' as const,
          targetStoreCode: 'CONSUMABLE',
          targetSiteCode: undefined
        }
      }
      if (tokens.length >= 3 && /^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
        return {
          targetType: 'STORE_SITE' as const,
          targetStoreCode: tokens[0],
          targetSiteCode: tokens[1] === '*' ? undefined : tokens[1]
        }
      }
      if (tokens.length >= 2 && /^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
        return {
          targetType: 'STORE_SITE' as const,
          targetStoreCode: tokens[0],
          targetSiteCode: undefined
        }
      }
      return {
        targetType: 'STORE_SITE' as const,
        targetStoreCode: tokens[0] || '',
        targetSiteCode: tokens[1] === '*' ? undefined : tokens[1]
      }
    })
    .filter((entry) => entry.targetStoreCode)
}

function assignmentSummaryText(item?: Ali1688HistoricalOrderItem) {
  if (!item || item.assignmentStatus === 'quantity_missing') {
    return undefined
  }
  const assigned = item.assignedQuantity ?? 0
  if (item.remainingQuantity !== undefined && item.remainingQuantity !== null) {
    return `已分配 ${assigned} / 剩余 ${item.remainingQuantity}`
  }
  if (item.originalQuantity !== undefined && item.originalQuantity !== null) {
    return `已分配 ${assigned} / 原始 ${item.originalQuantity}`
  }
  return undefined
}

function assignmentStatusLabel(item: Ali1688HistoricalOrderItem) {
  if (item.assignmentStatusLabel) {
    return item.assignmentStatusLabel
  }
  if (item.assignmentStatus === 'quantity_missing' || item.quantity === null) {
    return '数量未返回'
  }
  if (item.assignmentStatus === 'assigned') {
    return '已分配'
  }
  if (item.assignmentStatus === 'partially_assigned') {
    return '部分分配'
  }
  return '未分配'
}

function compactJoin(values: Array<string | undefined>, separator: string) {
  return values.filter((value): value is string => Boolean(value?.trim())).join(separator)
}

const missingFieldLabels: Record<string, string> = {
  amount: '金额',
  logistics: '物流',
  supplier: '供应商',
  sku: '规格',
  image: '图片',
  sourceLink: '原始链接'
}

const missingFieldOrder = ['amount', 'logistics', 'supplier', 'sku', 'image', 'sourceLink']

function renderMissingFields(fields?: string[]) {
  if (!fields?.length) {
    return null
  }
  const labels = [...fields]
    .sort((left, right) => missingFieldOrder.indexOf(left) - missingFieldOrder.indexOf(right))
    .map((field) => missingFieldLabels[field] || field)
  return (
    <Tooltip title={labels.join(' / ')} placement="topLeft">
      <Text type="secondary" className="ali1688-missing-fields">未返回信息</Text>
    </Tooltip>
  )
}

function syncStatusText(status?: string) {
  if (status === 'success') {
    return '同步成功'
  }
  if (status === 'partial_success') {
    return '部分成功'
  }
  if (status === 'running') {
    return '同步中'
  }
  if (status === 'failed') {
    return '同步失败'
  }
  return '未开始'
}

function importStatusText(status?: string) {
  if (status === 'committed' || status === 'success') {
    return '导入完成'
  }
  if (status === 'preview_ready') {
    return '预览通过'
  }
  if (status === 'validation_failed') {
    return '校验失败'
  }
  if (status === 'failed') {
    return '导入失败'
  }
  return status || '未知'
}

function importStatusColor(status?: string) {
  if (status === 'committed' || status === 'success') {
    return 'success'
  }
  if (status === 'validation_failed' || status === 'failed') {
    return 'error'
  }
  if (status === 'preview_ready') {
    return 'processing'
  }
  return 'default'
}
