import {
  HistoryOutlined,
  KeyOutlined,
  ReloadOutlined,
  SyncOutlined,
  UploadOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Input,
  Pagination,
  Select,
  Spin,
  Table
} from 'antd'
import type { ProductLineRow } from '../model/pageTypes'
import type { Ali1688HistoricalOrderRow } from '../types'
import { isSelectableProductLine } from '../model/productLineEligibility'
import {
  renderLogisticsCell,
  renderOrderContextCell,
  renderPurchaseCell,
  renderSupplierCell
} from '../presentation/orderContextCells'
import { renderProductCell } from '../presentation/productCells'
import { syncStatusText } from '../presentation/orderText'
import type { useAli1688HistoricalOrdersWorkbench } from '../hooks/useAli1688HistoricalOrdersWorkbench'

const { RangePicker } = DatePicker

interface Ali1688HistoricalOrdersPanelProps {
  state: ReturnType<typeof useAli1688HistoricalOrdersWorkbench>
  openImportHistory: () => Promise<void>
  openProductActionModalForRows: (rows: ProductLineRow[]) => Promise<void>
  openProductActionModal: (row: ProductLineRow) => Promise<void>
  openDeleteOrderModal: (order: Ali1688HistoricalOrderRow) => void
}

export function Ali1688HistoricalOrdersPanel({
  state,
  openImportHistory,
  openProductActionModalForRows,
  openProductActionModal,
  openDeleteOrderModal
}: Ali1688HistoricalOrdersPanelProps) {
  const {
    workbench,
    loading,
    filters,
    setFilters,
    query,
    setAuthorizationModalOpen,
    setExcelImportModalOpen,
    setAuthorizationErrorMessage,
    syncing,
    selectedLineKeys,
    setSelectedLineKeys,
    visibleProductLineRows,
    selectedProductLineRows,
    assignmentTargetOptions,
    canMutateProductLinks,
    canBatchActOnSelectedLines,
    showAuthorizeButton,
    canTriggerSync,
    paginationCurrent,
    paginationPageSize,
    paginationTotal,
    loadWorkbench,
    runSyncAction
  } = state

  return (
    <>
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
              { label: '已下架', value: 'state:discontinued' },
              ...assignmentTargetOptions
                .filter((option) => option.targetType === 'STORE_SITE')
                .map((option) => ({ label: option.label, value: `target:${option.value}` }))
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
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={() => {
                setAuthorizationErrorMessage(undefined)
                setAuthorizationModalOpen(true)
              }}
            >
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
              同步历史订单
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
          scroll={{ x: 1240 }}
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
              width: 380,
              render: (_, row) => renderProductCell(row, assignmentTargetOptions, {
                canMutateProductLinks,
                canDeleteOrders: Boolean(showAuthorizeButton),
                onOpenProductActionModal: openProductActionModal,
                onOpenDeleteOrderModal: openDeleteOrderModal
              })
            },
            { title: '供应商', key: 'supplier', width: 260, render: (_, row) => renderSupplierCell(row.order) },
            { title: '采购', key: 'purchase', width: 230, render: (_, row) => renderPurchaseCell(row.item, row.order) },
            { title: '物流', key: 'logistics', width: 150, render: (_, row) => renderLogisticsCell(row.item, row.order) },
            { title: '订单', key: 'order', width: 220, render: (_, row) => renderOrderContextCell(row.order, row.item) }
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
            onChange={(page, pageSize) => void loadWorkbench({ ...query, page, pageSize })}
          />
        ) : null}
      </Spin>
    </>
  )
}
