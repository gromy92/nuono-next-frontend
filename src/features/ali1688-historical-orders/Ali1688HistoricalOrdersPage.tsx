import { HistoryOutlined, KeyOutlined, LinkOutlined, ReloadOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Avatar, Button, DatePicker, Drawer, Empty, Input, InputNumber, List, Modal, Pagination, Segmented, Select, Space, Spin, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd'
import type { Dayjs } from 'dayjs'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  adjustAli1688HistoricalOrderAssignment,
  assignAli1688HistoricalOrderLineBatches,
  assignAli1688HistoricalOrderLines,
  deleteAli1688HistoricalOrder,
  linkAli1688HistoricalOrderProduct,
  linkAli1688HistoricalOrderProductBatch,
  loadAli1688HistoricalOrderProductLinkCandidates,
  loadAli1688ExcelImportBatchDetail,
  loadAli1688ExcelImportBatches,
  loadAli1688HistoricalOrderDetail,
  loadAli1688HistoricalOrderItemAssignments,
  loadAli1688HistoricalOrderWorkbench,
  revokeAli1688HistoricalOrderAssignment,
  runInitialAli1688HistoricalOrderSync,
  runManualAli1688HistoricalOrderRefresh,
  startAli1688OpenApiAuthorization,
  unlinkAli1688HistoricalOrderProduct
} from './api'
import { Ali1688AuthorizationModal } from './components/Ali1688AuthorizationModal'
import { Ali1688ExcelImportModal } from './components/Ali1688ExcelImportModal'
import type {
  Ali1688ExcelImportBatch,
  Ali1688ExcelImportBatchDetail,
  Ali1688HistoricalOrderAssignmentRequest,
  Ali1688HistoricalOrderAssignmentRecord,
  Ali1688HistoricalOrderDetail,
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderProductLink,
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
  productLinkFilter?: string
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
  onOpenProductActionModal: (row: ProductLineRow) => void | Promise<void>
}

type ProductLinkStatusFilter = 'all' | 'unlinked' | 'linked'

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
  const [assignmentTargetQuantities, setAssignmentTargetQuantities] = useState<Record<string, number | null>>({})
  const [assigning, setAssigning] = useState(false)
  const [assignmentRecords, setAssignmentRecords] = useState<Ali1688HistoricalOrderAssignmentRecord[]>([])
  const [assignmentRecordsLoading, setAssignmentRecordsLoading] = useState(false)
  const [assignmentRecordQuantities, setAssignmentRecordQuantities] = useState<Record<string, number | null>>({})
  const [assignmentRecordUpdatingId, setAssignmentRecordUpdatingId] = useState<number>()
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<Ali1688HistoricalOrderRow | null>(null)
  const [deleteOrderReason, setDeleteOrderReason] = useState('不属于任何店铺')
  const [deleteOrderSubmitting, setDeleteOrderSubmitting] = useState(false)
  const [productLinkRow, setProductLinkRow] = useState<ProductLineRow | null>(null)
  const [productLinkRows, setProductLinkRows] = useState<ProductLineRow[]>([])
  const [productLinkCandidates, setProductLinkCandidates] = useState<Ali1688HistoricalOrderProductLinkCandidate[]>([])
  const [productLinkStatusFilter, setProductLinkStatusFilter] = useState<ProductLinkStatusFilter>('all')
  const [productLinkSearch, setProductLinkSearch] = useState('')
  const [selectedProductCandidate, setSelectedProductCandidate] = useState<Ali1688HistoricalOrderProductLinkCandidate | null>(null)
  const [productLinkLoading, setProductLinkLoading] = useState(false)
  const [productLinkSubmitting, setProductLinkSubmitting] = useState(false)
  const [productLinkUnlinkingAssignmentId, setProductLinkUnlinkingAssignmentId] = useState<number>()
  const didMountFilters = useRef(false)
  const productLinkCandidateRequestSeq = useRef(0)
  const productLineRows = useMemo(() => buildProductLineRows(workbench.orders || []), [workbench.orders])
  const assignmentFilteredProductLineRows = useMemo(
    () => filterProductLineRowsByAssignment(productLineRows, filters.assignmentFilter),
    [filters.assignmentFilter, productLineRows]
  )
  const visibleProductLineRows = useMemo(
    () => filterProductLineRowsByProductLink(assignmentFilteredProductLineRows, filters.productLinkFilter),
    [assignmentFilteredProductLineRows, filters.productLinkFilter]
  )
  const filteredProductLinkCandidates = useMemo(
    () => filterProductLinkCandidates(productLinkCandidates, productLinkSearch),
    [productLinkCandidates, productLinkSearch]
  )
  const selectedProductLineRows = useMemo(
    () => visibleProductLineRows.filter((row) => selectedLineKeys.includes(row.lineKey)),
    [selectedLineKeys, visibleProductLineRows]
  )
  const canMutateProductLinks = canRoleMutateProductLinks(operatorRoleName)
  const canBatchActOnSelectedLines = selectedProductLineRows.length > 0
    && selectedProductLineRows.every(isSelectableProductLine)
  const assignmentTargetOptions = useMemo(
    () => buildAssignmentTargetOptions(availableStores, storeCode, siteCode),
    [availableStores, siteCode, storeCode]
  )
  const selectedAssignmentTargetOptions = selectedAssignmentTargets(assignmentTargetOptions, assignmentTargetValues)
  const actionProductLineRows = productLinkRows
  const canAssignActionProductRows = actionProductLineRows.length > 0
    && actionProductLineRows.every(isAssignableProductLine)
  const canLinkActionProductRows = canBatchLinkProductLines(actionProductLineRows)
  const canContinueAssignmentToProductLink = canMutateProductLinks
    && canSubmitAssignment(actionProductLineRows, assignmentTargetValues, assignmentTargetQuantities)
    && selectedAssignmentTargetOptions.length === 1
    && !isConsumableTarget(selectedAssignmentTargetOptions[0])
  const selectedDetailItem = selectedOrder
    ? findSelectedDetailItem(selectedOrder, selectedLineItemId)
    : undefined

  async function loadWorkbench(nextQuery: Ali1688HistoricalOrderQuery = query) {
    setLoading(true)
    try {
      setQuery(nextQuery)
      const nextWorkbench = await loadAli1688HistoricalOrderWorkbench(nextQuery)
      setWorkbench(nextWorkbench)
      return nextWorkbench
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 1688 历史订单失败')
      setWorkbench(EMPTY_WORKBENCH)
      return EMPTY_WORKBENCH
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkbench({
      page: 1,
      pageSize: query.pageSize || 20
    })
  }, [])

  useEffect(() => {
    if (!didMountFilters.current) {
      didMountFilters.current = true
      return
    }
    const timeoutId = window.setTimeout(() => {
      setSelectedLineKeys([])
      void loadWorkbench(buildQueryFromFilters())
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [filters])

  useEffect(() => {
    if (!productLinkRow || !canLinkActionProductRows || !canMutateProductLinks) {
      return undefined
    }
    const timeoutId = window.setTimeout(() => {
      void loadProductLinkCandidatesForRow(productLinkRow, productLinkStatusFilter, productLinkSearch)
    }, productLinkSearch.trim() ? 250 : 0)
    return () => window.clearTimeout(timeoutId)
  }, [productLinkSearch])

  const showAuthorizeButton = workbench.roleCapabilities?.canAuthorize
  const canTriggerSync = workbench.roleCapabilities?.canTriggerSync
  const hasSyncedOrders = (workbench.syncSummary?.totalOrderCount ?? 0) > 0
  const paginationCurrent = workbench.pagination?.page || 1
  const paginationPageSize = workbench.pagination?.pageSize || 20
  const paginationTotal = Math.max(workbench.pagination?.total || 0, visibleProductLineRows.length)

  return (
    <section className="ali1688-historical-orders-page" data-testid="ali1688-historical-orders-page">
      <section className="ali1688-historical-orders-controls ali1688-historical-orders-filters" aria-label="1688 历史订单操作与筛选">
        <div className="ali1688-historical-orders-query">
          <Input
            className="ali1688-historical-orders-keyword-input"
            allowClear
            placeholder="订单号 / 商品 / offerId / SKU / 货号"
            value={filters.keyword}
            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
          />
          <RangePicker
            allowClear
            value={filters.placedRange}
            onChange={(value) => setFilters((current) => ({ ...current, placedRange: value }))}
            placeholder={['下单开始', '下单结束']}
            format="YYYY-MM-DD"
          />
          <Select
            aria-label="分配店铺"
            allowClear
            placeholder="分配店铺"
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
          <Select
            aria-label="商品关联"
            allowClear
            placeholder="商品关联"
            value={filters.productLinkFilter}
            onChange={(value) => setFilters((current) => ({ ...current, productLinkFilter: value }))}
            options={[
              { label: '已关联', value: 'linked' },
              { label: '未关联', value: 'unlinked' }
            ]}
            style={{ width: 140 }}
          />
          <Input
            className="ali1688-historical-orders-supplier-input"
            aria-label="供应商"
            allowClear
            placeholder="供应商"
            value={filters.supplierKeyword}
            onChange={(event) => setFilters((current) => ({ ...current, supplierKeyword: event.target.value }))}
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
            disabled={!canBatchActOnSelectedLines}
            onClick={() => void openProductActionModalForRows(selectedProductLineRows)}
          >
            批量分配/关联
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
              disabled: !isSelectableProductLine(row),
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
              render: (_, row) => renderProductCell(
                row,
                assignmentTargetOptions,
                {
                  canMutateProductLinks,
                  onOpenProductActionModal: openProductActionModal
                }
              )
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
          pagination={false}
        />
        {paginationTotal > 0 ? (
          <Pagination
            className="ali1688-historical-orders-pagination"
            current={paginationCurrent}
            pageSize={paginationPageSize}
            total={paginationTotal}
            showSizeChanger={false}
            showTotal={(total) => `共 ${total} 条货品行`}
            onChange={(page, pageSize) => {
              void loadWorkbench({ ...query, page, pageSize })
            }}
          />
        ) : null}
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
                        { label: '订单状态', value: orderStatusText(selectedOrder.orderStatus) },
                        { label: '创建时间', value: selectedOrder.orderTime },
                        { label: '付款时间', value: selectedOrder.paidAt },
                        { label: '买家公司', value: selectedOrder.buyerCompanyName },
                        { label: '买家会员', value: selectedOrder.buyerMemberName },
                        { label: '卖家公司', value: selectedOrder.supplierName },
                        { label: '卖家会员', value: selectedOrder.sellerMemberName },
                        { label: '货品总价', value: orderMoneyText(selectedOrder.goodsTotalText) },
                        { label: '运费', value: selectedOrder.freightText },
                        { label: '实付款', value: orderMoneyText(selectedOrder.paidAmountText || selectedOrder.amountText) },
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
        title="分配/关联"
        open={assignmentModalOpen}
        onCancel={closeActionModal}
        footer={renderActionModalFooter()}
        width={1180}
        destroyOnClose
      >
        <Space direction="vertical" size={14} className="ali1688-assignment-modal ali1688-product-action-modal">
          {canAssignActionProductRows ? (
            <>
              <Text type="secondary">
                {actionProductLineRows.length === 1
                  ? '单个货品可拆分到多个店铺，请为每个店铺填写数量。'
                  : '多选货品可拆分到多个店铺，请为每个店铺和货品填写数量。'}
              </Text>
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
              {selectedAssignmentTargetOptions.some(isConsumableTarget) ? (
                <List
                  size="small"
                  dataSource={actionProductLineRows}
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
                <Table
                  className="ali1688-assignment-matrix"
                  size="small"
                  pagination={false}
                  rowKey={(row) => row.lineKey}
                  dataSource={actionProductLineRows}
                  columns={[
                    {
                      title: '商品',
                      key: 'product',
                      width: 360,
                      render: (_, row: ProductLineRow) => (
                        <Space direction="vertical" size={2} className="ali1688-assignment-product-cell">
                          <Text strong className="ali1688-assignment-product-title">{row.item?.title || '未返回'}</Text>
                          <Text type="secondary">{compactJoin([`剩余 ${assignmentMaxQuantity(row)}`, row.order.orderNo], ' · ')}</Text>
                        </Space>
                      )
                    },
                    ...selectedAssignmentTargetOptions.map((target) => ({
                      title: target.label,
                      key: target.value,
                      width: 150,
                      render: (_: unknown, row: ProductLineRow) => (
                        <InputNumber
                          aria-label={`分配数量 ${target.label} ${row.item?.title || '未返回'}`}
                          min={0}
                          max={assignmentMaxQuantity(row)}
                          value={assignmentTargetQuantities[assignmentQuantityKey(target.value, row)]}
                          onChange={(value) => updateAssignmentTargetQuantity(target.value, row, value)}
                        />
                      )
                    }))
                  ]}
                  scroll={{ x: Math.max(520, 360 + selectedAssignmentTargetOptions.length * 150) }}
                />
              )}
            </>
          ) : null}
          {canMutateProductLinks ? renderProductLinkEditor() : null}
        </Space>
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
        onConfirm={() => void confirmOpenApiAuthorization()}
      />
      <Ali1688ExcelImportModal
        open={excelImportModalOpen}
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

  async function confirmOpenApiAuthorization() {
    setAuthorizationSubmitting(true)
    const authorizationWindow = window.open('about:blank', '_blank')
    try {
      const start = await startAli1688OpenApiAuthorization()
      if (!start.configured || !start.authorizationUrl) {
        authorizationWindow?.close()
        message.warning(start.message || '1688 OpenAPI 尚未配置，暂时不能发起真实授权')
        return
      }
      if (authorizationWindow) {
        authorizationWindow.location.href = start.authorizationUrl
      } else {
        message.warning('浏览器拦截了授权窗口，请允许弹窗后重试')
        return
      }
      setAuthorizationModalOpen(false)
      message.success('已打开 1688 授权页，完成后返回系统刷新订单')
    } catch (error) {
      authorizationWindow?.close()
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
      ...productLinkFilterQuery(filters.productLinkFilter),
      page: 1,
      pageSize: workbench.pagination?.pageSize || 20
    }
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
      setSelectedOrder(await loadAli1688HistoricalOrderDetail(row.order.id))
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
      setImportBatches(await loadAli1688ExcelImportBatches())
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
      setImportBatchDetail(await loadAli1688ExcelImportBatchDetail(batchId))
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

  async function openProductActionModal(row: ProductLineRow) {
    await openProductActionModalForRows([row])
  }

  async function openProductActionModalForRows(rows: ProductLineRow[]) {
    if (!rows.length) {
      message.warning('请选择要处理的货品行')
      return
    }
    if (!rows.every(isSelectableProductLine)) {
      message.warning('当前货品行没有可分配或可关联的内容')
      return
    }
    const primaryRow = rows[0]
    const defaultLinkStatus: ProductLinkStatusFilter = 'all'
    setProductLinkRow(primaryRow)
    setProductLinkRows(rows)
    setProductLinkStatusFilter(defaultLinkStatus)
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    setProductLinkCandidates([])
    setAssignmentTargetValues([])
    setAssignmentTargetQuantities({})
    setAssignmentModalOpen(true)
    if (canMutateProductLinks && canBatchLinkProductLines(rows)) {
      await loadProductLinkCandidatesForRow(primaryRow, defaultLinkStatus, '')
    }
  }

  async function changeProductLinkStatusFilter(linkStatus: ProductLinkStatusFilter) {
    setProductLinkStatusFilter(linkStatus)
    setProductLinkSearch('')
    setSelectedProductCandidate(null)
    if (productLinkRow) {
      await loadProductLinkCandidatesForRow(productLinkRow, linkStatus, '')
    }
  }

  async function loadProductLinkCandidatesForRow(row: ProductLineRow, linkStatus: ProductLinkStatusFilter, keyword?: string) {
    const assignmentId = row.item?.assignmentId
    if (!assignmentId) {
      return
    }
    const requestSeq = productLinkCandidateRequestSeq.current + 1
    productLinkCandidateRequestSeq.current = requestSeq
    const trimmedKeyword = keyword?.trim()
    setProductLinkLoading(true)
    try {
      const candidates = await loadAli1688HistoricalOrderProductLinkCandidates({
        assignmentId,
        ...(linkStatus === 'all' ? {} : { linkStatus }),
        ...(trimmedKeyword ? { keyword: trimmedKeyword } : {})
      })
      if (requestSeq === productLinkCandidateRequestSeq.current) {
        setProductLinkCandidates(candidates)
      }
    } catch (error) {
      if (requestSeq === productLinkCandidateRequestSeq.current) {
        message.error(error instanceof Error ? error.message : '读取商品关联候选失败')
        setProductLinkCandidates([])
      }
    } finally {
      if (requestSeq === productLinkCandidateRequestSeq.current) {
        setProductLinkLoading(false)
      }
    }
  }

  function resetProductLinkState() {
    setProductLinkRow(null)
    setProductLinkRows([])
    setProductLinkStatusFilter('all')
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
    const assignmentIds = productLinkRows
      .map((row) => row.item?.assignmentId)
      .filter((assignmentId): assignmentId is number => Boolean(assignmentId))
    if (!assignmentIds.length || !selectedProductCandidate?.skuParent) {
      message.error('请选择要关联的商品')
      return
    }
    setProductLinkSubmitting(true)
    try {
      const linkRequests = assignmentIds.map((assignmentId) => ({
        assignmentId,
        skuParent: selectedProductCandidate.skuParent,
        partnerSku: selectedProductCandidate.partnerSku,
        pskuCode: selectedProductCandidate.pskuCode,
        productTitle: selectedProductCandidate.productTitle,
        productImageUrl: selectedProductCandidate.productImageUrl
      }))
      if (linkRequests.length === 1) {
        await linkAli1688HistoricalOrderProduct(linkRequests[0])
      } else {
        await linkAli1688HistoricalOrderProductBatch({ links: linkRequests })
      }
      message.success(assignmentIds.length > 1 ? `已关联 ${assignmentIds.length} 条货品` : '商品关联已保存')
      closeActionModal()
      setSelectedLineKeys([])
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
      return false
    }
    if (!assignmentId) {
      return false
    }
    setProductLinkUnlinkingAssignmentId(assignmentId)
    try {
      await unlinkAli1688HistoricalOrderProduct(assignmentId)
      message.success('商品关联已解除')
      await loadWorkbench(query)
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '解除商品关联失败')
      return false
    } finally {
      setProductLinkUnlinkingAssignmentId(undefined)
    }
  }

  async function submitProductUnlinkFromModal(assignmentId?: number) {
    if (await submitProductUnlink(assignmentId)) {
      closeActionModal()
    }
  }

  async function submitDeleteOrder() {
    if (!deleteOrderTarget?.id) {
      return
    }
    setDeleteOrderSubmitting(true)
    try {
      await deleteAli1688HistoricalOrder(deleteOrderTarget.id, {
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

  function updateAssignmentTargetValues(values: string[]) {
    const nextValues = values.includes(CONSUMABLE_ASSIGNMENT_VALUE)
      ? [CONSUMABLE_ASSIGNMENT_VALUE]
      : values
    setAssignmentTargetValues(nextValues)
    setAssignmentTargetQuantities(() => {
      if (nextValues.includes(CONSUMABLE_ASSIGNMENT_VALUE)) {
        return {}
      }
      return buildAutoAssignmentTargetQuantities(actionProductLineRows, nextValues)
    })
  }

  function updateAssignmentTargetQuantity(targetValue: string, row: ProductLineRow, value: number | string | null) {
    const parsed = typeof value === 'string' ? Number(value) : value
    setAssignmentTargetQuantities((current) => adjustAssignmentTargetQuantities(
      current,
      assignmentTargetValues,
      targetValue,
      row,
      typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
    ))
  }

  async function submitAssignment(options: { keepOpenForLink?: boolean } = {}) {
    const targets = selectedAssignmentTargets(assignmentTargetOptions, assignmentTargetValues)
    if (!targets.length) {
      message.error('请选择目标店铺')
      return
    }
    const rowsToAssign = actionProductLineRows
    setAssigning(true)
    try {
      const assignmentRequests: Ali1688HistoricalOrderAssignmentRequest[] = []
      if (targets.length === 1 && isConsumableTarget(targets[0])) {
        assignmentRequests.push({
          targetType: 'CONSUMABLE',
          lines: rowsToAssign.map((row) => ({
            itemId: row.item?.id || ''
          }))
        })
      } else {
        for (const target of targets) {
          const lines = rowsToAssign
            .map((row) => ({
              itemId: row.item?.id || '',
              quantity: assignmentTargetQuantities[assignmentQuantityKey(target.value, row)] || 0
            }))
            .filter((line) => line.itemId && line.quantity > 0)
          if (!lines.length) {
            continue
          }
          assignmentRequests.push({
            targetType: 'STORE_SITE',
            targetStoreCode: target.targetStoreCode,
            targetSiteCode: target.targetSiteCode,
            lines
          })
        }
      }
      if (!assignmentRequests.length) {
        message.error('请填写分配数量')
        return
      }
      const result = assignmentRequests.length === 1
        ? await assignAli1688HistoricalOrderLines(assignmentRequests[0])
        : await assignAli1688HistoricalOrderLineBatches({ assignments: assignmentRequests })
      const assignedLineCount = result.assignedLineCount
      message.success(`已分配 ${assignedLineCount} 条货品`)
      const nextWorkbench = await loadWorkbench(query)
      if (options.keepOpenForLink) {
        const nextRows = findLinkableRowsAfterAssignment(nextWorkbench, rowsToAssign)
        setProductLinkRows(nextRows)
        setProductLinkRow(nextRows[0] || rowsToAssign[0] || null)
        setAssignmentTargetValues([])
        setAssignmentTargetQuantities({})
        setSelectedProductCandidate(null)
        setProductLinkCandidates([])
        if (canBatchLinkProductLines(nextRows) && nextRows[0]) {
          await loadProductLinkCandidatesForRow(nextRows[0], productLinkStatusFilter, '')
        } else {
          message.warning('分配已保存，请在列表刷新后重新打开商品关联')
        }
      } else {
        closeActionModal()
        setSelectedLineKeys([])
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '分配 1688 历史订单货品失败')
    } finally {
      setAssigning(false)
    }
  }

  function closeActionModal() {
    setAssignmentModalOpen(false)
    setAssignmentTargetValues([])
    setAssignmentTargetQuantities({})
    resetProductLinkState()
  }

  function renderActionModalFooter() {
    const footerButtons: ReactNode[] = [
      <Button key="cancel" onClick={closeActionModal}>
        取消
      </Button>
    ]
    if (canAssignActionProductRows) {
      footerButtons.push(
        <Button
          key="assign"
          type={canMutateProductLinks ? 'default' : 'primary'}
          loading={assigning}
          disabled={!canSubmitAssignment(actionProductLineRows, assignmentTargetValues, assignmentTargetQuantities)}
          onClick={() => void submitAssignment()}
        >
          确认分配
        </Button>
      )
    }
    if (canAssignActionProductRows && canMutateProductLinks) {
      footerButtons.push(
        <Button
          key="assign-and-link"
          type={canLinkActionProductRows ? 'default' : 'primary'}
          loading={assigning}
          disabled={!canContinueAssignmentToProductLink}
          onClick={() => void submitAssignment({ keepOpenForLink: true })}
        >
          保存分配并继续关联
        </Button>
      )
    }
    if (canMutateProductLinks && canLinkActionProductRows) {
      footerButtons.push(
        <Button
          key="link"
          type="primary"
          loading={productLinkSubmitting}
          disabled={!selectedProductCandidate}
          onClick={() => void submitProductLink()}
        >
          确认关联
        </Button>
      )
    }
    return footerButtons
  }

  function renderProductLinkEditor() {
    return (
      <div className="ali1688-product-link-modal">
        <section className="ali1688-product-link-source">
          {productLinkRows.length > 1 ? (
            <Space direction="vertical" size={8}>
              <Text strong>已选 {productLinkRows.length} 条货品行</Text>
              {renderInfoGrid([
                { label: '分配店铺', value: productLinkTargetLabel(productLinkRows[0]?.item) },
                { label: '关联方式', value: canLinkActionProductRows ? '批量关联到同一个店铺商品' : '保存分配后批量关联' }
              ])}
              <List
                size="small"
                dataSource={productLinkRows}
                renderItem={(row) => (
                  <List.Item>
                    <Text>{row.item?.title || '未返回'}</Text>
                    <Text type="secondary">{compactJoin([row.order.orderNo, quantityText(row.item)], ' · ')}</Text>
                  </List.Item>
                )}
              />
            </Space>
          ) : (
            <>
              <Text strong>{productLinkRow?.item?.title || '未返回'}</Text>
              {renderInfoGrid([
                { label: '规格', value: compactJoin([productLinkRow?.item?.skuText, productLinkRow?.item?.modelText], ' / ') },
                { label: '货号', value: productLinkRow?.item?.productCode || productLinkRow?.item?.singleProductCode },
                { label: '供应商', value: productLinkRow?.order.supplierName },
                { label: '数量', value: quantityText(productLinkRow?.item) },
                { label: '分配店铺', value: productLinkTargetLabel(productLinkRow?.item) },
                { label: '当前关联', value: productLinkDisplayText(productLinkRow?.item?.productLink) }
              ])}
              {canMutateProductLinks && productLinkRow?.item?.productLink?.skuParent && productLinkRow.item.assignmentId ? (
                <Button
                  danger
                  size="small"
                  loading={productLinkUnlinkingAssignmentId === productLinkRow.item.assignmentId}
                  onClick={() => void submitProductUnlinkFromModal(productLinkRow.item?.assignmentId)}
                >
                  解除关联
                </Button>
              ) : null}
            </>
          )}
        </section>
        <section className="ali1688-product-link-candidates">
          {canLinkActionProductRows ? (
            <>
              <div className="ali1688-product-link-filter">
                <Input.Search
                  allowClear
                  aria-label="搜索商品"
                  placeholder="搜索 SKU Parent / Partner SKU / PSKU / 标题"
                  value={productLinkSearch}
                  onChange={(event) => {
                    setSelectedProductCandidate(null)
                    setProductLinkSearch(event.target.value)
                  }}
                  onSearch={(value) => {
                    setSelectedProductCandidate(null)
                    setProductLinkSearch(value)
                  }}
                />
                <Segmented
                  value={productLinkStatusFilter}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '未关联', value: 'unlinked' },
                    { label: '已关联', value: 'linked' }
                  ]}
                  onChange={(value) => void changeProductLinkStatusFilter(value as ProductLinkStatusFilter)}
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
            </>
          ) : (
            <Alert
              type="info"
              showIcon
              message="保存分配后选择店铺商品。"
              description="商品候选会按分配后的店铺和站点加载。"
            />
          )}
        </section>
      </div>
    )
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

function productLinkFilterQuery(
  productLinkFilter?: string
): Pick<Ali1688HistoricalOrderQuery, 'productLinkState'> {
  if (productLinkFilter === 'linked' || productLinkFilter === 'unlinked') {
    return { productLinkState: productLinkFilter }
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

function filterProductLineRowsByProductLink(rows: ProductLineRow[], productLinkFilter?: string) {
  if (!productLinkFilter) {
    return rows
  }
  if (productLinkFilter === 'linked') {
    return rows.filter((row) => Boolean(row.item?.productLink?.skuParent))
  }
  if (productLinkFilter === 'unlinked') {
    return rows.filter((row) => canLinkProductLine(row) && !row.item?.productLink?.skuParent)
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

function isSelectableProductLine(row: ProductLineRow) {
  return isAssignableProductLine(row) || canLinkProductLine(row)
}

function canLinkProductLine(row: ProductLineRow) {
  return Boolean(
    row.item?.assignmentId &&
    row.item.assignmentStatus === 'assigned' &&
    row.item.assignmentTargetType !== 'CONSUMABLE' &&
    row.item.assignmentTargetStoreCode
  )
}

function canBatchLinkProductLines(rows: ProductLineRow[]) {
  if (!rows.length || !rows.every(canLinkProductLine)) {
    return false
  }
  const first = rows[0]?.item
  if (!first?.assignmentTargetStoreCode) {
    return false
  }
  return rows.every((row) =>
    row.item?.assignmentTargetStoreCode === first.assignmentTargetStoreCode &&
    (row.item?.assignmentTargetSiteCode || '') === (first.assignmentTargetSiteCode || '')
  )
}

function canOpenProductLinkActionForRows(rows: ProductLineRow[]) {
  if (!rows.length) {
    return false
  }
  if (canBatchLinkProductLines(rows)) {
    return true
  }
  return rows.every(isAssignableProductLine)
}

function findLinkableRowsAfterAssignment(
  workbench: Ali1688HistoricalOrderWorkbench,
  sourceRows: ProductLineRow[]
) {
  const sourceItemIds = new Set(
    sourceRows
      .map((row) => row.item?.id)
      .filter((itemId): itemId is string => Boolean(itemId))
  )
  if (!sourceItemIds.size) {
    return []
  }
  return buildProductLineRows(workbench.orders || [])
    .filter((row) => sourceItemIds.has(row.item?.id || '') && canLinkProductLine(row))
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

function productLinkEmptyText(linkStatus: ProductLinkStatusFilter) {
  if (linkStatus === 'linked') {
    return '当前筛选下没有已关联商品'
  }
  if (linkStatus === 'unlinked') {
    return '当前筛选下没有未关联商品'
  }
  return '当前店铺暂无可关联商品'
}

function assignmentMaxQuantity(row: ProductLineRow) {
  const remaining = row.item?.remainingQuantity
  if (remaining !== undefined && remaining !== null) {
    return Math.max(0, remaining)
  }
  return Math.max(0, row.item?.quantity ?? 0)
}

function assignmentQuantityKey(targetValue: string, row: ProductLineRow) {
  return `${targetValue}::${row.lineKey}`
}

function buildAutoAssignmentTargetQuantities(
  rows: ProductLineRow[],
  targetValues: string[]
) {
  if (!targetValues.length) {
    return {}
  }
  return rows.reduce<Record<string, number | null>>((next, row) => {
    const maxQuantity = assignmentMaxQuantity(row)
    targetValues.forEach((targetValue, index) => {
      const key = assignmentQuantityKey(targetValue, row)
      next[key] = autoDistributedAssignmentQuantity(maxQuantity, targetValues.length, index)
    })
    return keepAssignmentRowWithinLimit(next, targetValues, row)
  }, {})
}

function autoDistributedAssignmentQuantity(maxQuantity: number, targetCount: number, targetIndex: number) {
  if (targetCount <= 1) {
    return maxQuantity
  }
  const baseQuantity = Math.floor(maxQuantity / targetCount)
  const remainder = maxQuantity % targetCount
  return baseQuantity + (targetIndex < remainder ? 1 : 0)
}

function adjustAssignmentTargetQuantities(
  current: Record<string, number | null>,
  targetValues: string[],
  targetValue: string,
  row: ProductLineRow,
  value: number | null
) {
  const maxQuantity = assignmentMaxQuantity(row)
  const next = {
    ...current,
    [assignmentQuantityKey(targetValue, row)]: value === null ? null : Math.min(Math.max(0, value), maxQuantity)
  }
  return keepAssignmentRowWithinLimit(next, targetValues, row, targetValue)
}

function keepAssignmentRowWithinLimit(
  quantities: Record<string, number | null>,
  targetValues: string[],
  row: ProductLineRow,
  changedTargetValue?: string
) {
  const maxQuantity = assignmentMaxQuantity(row)
  let overflow = assignmentRowTotalQuantity(quantities, targetValues, row) - maxQuantity
  if (overflow <= 0) {
    return quantities
  }
  const adjustableTargets = targetValues.filter((targetValue) => targetValue !== changedTargetValue).reverse()
  adjustableTargets.forEach((targetValue) => {
    if (overflow <= 0) {
      return
    }
    const key = assignmentQuantityKey(targetValue, row)
    const currentQuantity = quantities[key] || 0
    const reduction = Math.min(currentQuantity, overflow)
    quantities[key] = currentQuantity - reduction
    overflow -= reduction
  })
  return quantities
}

function assignmentRowTotalQuantity(
  quantities: Record<string, number | null>,
  targetValues: string[],
  row: ProductLineRow
) {
  return targetValues.reduce((sum, targetValue) => {
    const quantity = quantities[assignmentQuantityKey(targetValue, row)]
    return sum + (typeof quantity === 'number' ? quantity : 0)
  }, 0)
}

function canSubmitAssignment(
  rows: ProductLineRow[],
  targetValues: string[],
  targetQuantities: Record<string, number | null>
) {
  if (!targetValues.length || !rows.length) {
    return false
  }
  if (!rows.every((row) => Boolean(row.item?.id))) {
    return false
  }
  const hasConsumableTarget = targetValues.includes(CONSUMABLE_ASSIGNMENT_VALUE)
  if (hasConsumableTarget) {
    return targetValues.length === 1 && rows.every((row) => assignmentMaxQuantity(row) > 0)
  }
  return rows.every((row) => {
    const maxQuantity = assignmentMaxQuantity(row)
    const totalQuantity = assignmentRowTotalQuantity(targetQuantities, targetValues, row)
    return (
      maxQuantity > 0 &&
      totalQuantity > 0 &&
      totalQuantity <= maxQuantity &&
      targetValues.every((targetValue) => {
        const quantity = targetQuantities[assignmentQuantityKey(targetValue, row)]
        return quantity === null || quantity === undefined || (typeof quantity === 'number' && quantity >= 0 && quantity <= maxQuantity)
      })
    )
  })
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

function productLineImageClassName(item?: Ali1688HistoricalOrderItem) {
  const classNames = ['ali1688-product-line-image']
  if (item?.productLink?.skuParent) {
    classNames.push('ali1688-product-line-image--product-linked')
  } else if (isAssignedToStore(item)) {
    classNames.push('ali1688-product-line-image--store-linked')
  }
  return classNames.join(' ')
}

function isAssignedToStore(item?: Ali1688HistoricalOrderItem) {
  return Boolean(
    item?.assignmentTargetStoreCode &&
    item.assignmentTargetType !== 'CONSUMABLE'
  )
}

function renderProductLineActions(row: ProductLineRow, controls: ProductLinkActionControls) {
  const item = row.item
  const hasLinkState = Boolean(item?.productLink?.skuParent)
  const canOpenAction = isAssignableProductLine(row)
    || (controls.canMutateProductLinks && canOpenProductLinkActionForRows([row]))
  if (!hasLinkState && !canOpenAction) {
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

  return (
    <Space size={[6, 4]} wrap className="ali1688-product-link-actions">
      {renderProductLinkState(item)}
      {actionButton}
    </Space>
  )
}

function renderProductLinkState(item: Ali1688HistoricalOrderItem | undefined) {
  if (!item?.productLink?.skuParent) {
    return null
  }
  return (
    <Text className="ali1688-product-link-state">
      {productLinkDisplayText(item.productLink)}
    </Text>
  )
}

function productLinkDisplayText(productLink?: Ali1688HistoricalOrderProductLink) {
  if (!productLink?.skuParent) {
    return undefined
  }
  return `已关联: ${productLink.partnerSku || productLink.skuParent || productLink.pskuCode}`
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
      <Text strong>{labeledValue('订单总价', orderMoneyText(order.goodsTotalText || order.amountText))}</Text>
      <Text type="secondary">{labeledValue('运费', order.freightText || '未返回')}</Text>
      <Text type="secondary">{labeledValue('实付款', orderMoneyText(order.paidAmountText || order.amountText))}</Text>
      <Text type="secondary">{labeledValue('数量', quantityText(item))}</Text>
    </div>
  )
}

function renderLogisticsCell(item: Ali1688HistoricalOrderItem | undefined, order: Ali1688HistoricalOrderRow) {
  return (
    <div className="ali1688-logistics-cell">
      <Text>{labeledValue('物流', item?.logisticsCompany || order.logisticsStatus || '未返回')}</Text>
      {item?.trackingNo ? <Text type="secondary">{item.trackingNo}</Text> : null}
      {renderMissingFields(mergedMissingFields(order.missingFields, item?.missingFields))}
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
      <Tag color={order.orderStatus ? 'processing' : 'default'}>{orderStatusText(order.orderStatus)}</Tag>
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

function orderMoneyText(value?: string | number | null) {
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

function orderStatusText(status?: string) {
  const normalized = status?.trim()
  if (!normalized) {
    return '状态未返回'
  }
  const statusMap: Record<string, string> = {
    waitbuyerpay: '等待买家付款',
    waitsellersend: '等待卖家发货',
    waitbuyerreceive: '等待买家收货',
    waitbuyerconfirmgoods: '等待买家确认收货',
    waitlogisticstakein: '等待物流揽收',
    waitselleract: '等待卖家操作',
    success: '交易成功',
    cancel: '交易取消',
    canceled: '交易取消',
    terminate: '交易关闭',
    terminated: '交易关闭'
  }
  return statusMap[normalized.toLowerCase()] || normalized
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
