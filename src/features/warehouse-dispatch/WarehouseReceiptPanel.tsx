import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, Input, Segmented, Select, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { PurchaseReceiptItem, PurchaseReceiptOrder, WarehouseSiteCode } from './types'
import {
  buildReceiptDetailScopeOptions,
  formatReceiptQuantity,
  receiptOrderBusinessScopeKey,
  receiptOrderDisplayStoreName,
  receiptProductBusinessScopeKey,
  receiptRemainingQuantity,
  summarizeReceiptOrder
} from './receiptDomain'
import {
  renderReceiptItemStatus,
  renderReceiptOrderSummary,
  renderReceiptQuickFilters,
  renderReceiptStatus,
  renderTransportMode,
  renderWarehouseProductCell
} from './WarehouseDispatchSharedView'
import type { useReceiptWorkspace } from './useReceiptWorkspace'
import {
  RECEIPT_ITEM_TABLE_PAGINATION,
  RECEIPT_ORDER_TABLE_PAGINATION,
  SITE_LABELS
} from './workbenchModels'
import { sum } from './workbenchUtils'

const { Text } = Typography

type WarehouseReceiptPanelProps = {
  workspace: ReturnType<typeof useReceiptWorkspace>
  dataLoading: boolean
  dataError?: string
}

export function WarehouseReceiptPanel({ workspace, dataLoading, dataError }: WarehouseReceiptPanelProps) {
  const orderColumns: ColumnsType<PurchaseReceiptOrder> = [
    {
      title: '仓库单',
      dataIndex: 'title',
      render: (_, order) => (
        <div className="warehouse-dispatch-receipt-order-main">
          <Text strong>{order.title || order.orderNo}</Text>
          <Text type="secondary">{order.orderNo} · {order.createdAt}</Text>
        </div>
      )
    },
    { title: '店铺', dataIndex: 'storeName', render: (_, order) => receiptOrderDisplayStoreName(order) },
    { title: '商品', render: (_, order) => workspace.visibleSummaries.get(order.id)?.pskuCount
      ?? summarizeReceiptOrder(order).pskuCount },
    { title: '应收', render: (_, order) => workspace.visibleSummaries.get(order.id)?.expectedQty
      ?? summarizeReceiptOrder(order).expectedQty },
    { title: '已收', render: (_, order) => workspace.visibleSummaries.get(order.id)?.receivedQty
      ?? summarizeReceiptOrder(order).receivedQty },
    { title: '未收', render: (_, order) => formatReceiptQuantity(
      sum(order.items.map((item) => receiptRemainingQuantity(item)))
    ) },
    { title: '状态', render: (_, order) => renderReceiptStatus(
      workspace.visibleSummaries.get(order.id)?.status ?? summarizeReceiptOrder(order).status
    ) },
    {
      title: '操作',
      width: 108,
      render: (_, order) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={(event) => {
          event.stopPropagation()
          workspace.openDetail(order)
        }}>
          查看详情
        </Button>
      )
    }
  ]

  return (
    <>
      <div className="warehouse-dispatch-panel">
        <div className="warehouse-dispatch-toolbar warehouse-dispatch-receipt-toolbar">
          <div className="warehouse-dispatch-toolbar-left">
            <Input className="warehouse-dispatch-search" allowClear prefix={<SearchOutlined />}
              placeholder="搜索仓库单 / 采购单 / PSKU / 商品" value={workspace.keyword}
              onChange={(event) => workspace.setKeyword(event.target.value)} />
            <Select className="warehouse-dispatch-filter-select warehouse-dispatch-store-filter"
              value={workspace.storeFilter}
              options={[{ label: '全部店铺', value: 'all' }, ...workspace.storeOptions]}
              onChange={workspace.setStoreFilter} />
            <Select className="warehouse-dispatch-filter-select warehouse-dispatch-site-filter"
              value={workspace.siteFilter}
              options={[{ label: '全部站点', value: 'all' }, ...workspace.siteOptions]}
              onChange={workspace.setSiteFilter} />
            <Segmented className="warehouse-dispatch-receipt-scope" size="small"
              value={workspace.scopeFilter}
              options={[
                { label: `待处理 ${workspace.totalSummary.receiptTodoOrderCount}`, value: 'todo' },
                { label: `全部 ${workspace.totalSummary.orderCount}`, value: 'all' }
              ]}
              onChange={workspace.setScopeFilter} />
            {renderReceiptQuickFilters(workspace.filteredSummaries)}
            {dataError ? <Tag color="red">{dataError}</Tag> : null}
          </div>
        </div>
        <Table rowKey={receiptOrderBusinessScopeKey} size="small" columns={orderColumns}
          dataSource={workspace.visibleOrders} loading={dataLoading}
          pagination={RECEIPT_ORDER_TABLE_PAGINATION} rowClassName="warehouse-dispatch-clickable-row"
          onRow={(order) => ({ onClick: () => workspace.openDetail(order) })} />
      </div>
      <WarehouseReceiptDetail workspace={workspace} />
    </>
  )
}

function WarehouseReceiptDetail({ workspace }: { workspace: ReturnType<typeof useReceiptWorkspace> }) {
  const columns: ColumnsType<PurchaseReceiptItem> = [
    { title: '商品', width: 360, render: (_, item) => renderWarehouseProductCell({
      psku: item.psku, title: item.title, imageUrl: item.imageUrl
    }) },
    {
      title: '来源采购单',
      width: 170,
      render: (_, item) => (
        <div className="warehouse-dispatch-receipt-source">
          <Text strong>{item.purchaseOrderTitle || item.orderNo || '-'}</Text>
          <Text className="warehouse-dispatch-receipt-source-date" type="secondary">{item.orderNo || '-'}</Text>
        </div>
      )
    },
    {
      title: '计划',
      width: 130,
      render: (_, item) => (
        <span><Tag>{SITE_LABELS[item.siteCode]}</Tag>{renderTransportMode(item.transportMode)}</span>
      )
    },
    { title: '应收', width: 84, align: 'right', render: (_, item) => (
      <span className="warehouse-dispatch-receipt-quantity">{formatReceiptQuantity(item.expectedQty)}</span>
    ) },
    { title: '已收', width: 84, align: 'right', render: (_, item) => (
      <span className="warehouse-dispatch-receipt-quantity is-received">{formatReceiptQuantity(item.receivedQty)}</span>
    ) },
    { title: '未收', width: 84, align: 'right', render: (_, item) => (
      <span className="warehouse-dispatch-receipt-quantity is-remaining">
        {formatReceiptQuantity(receiptRemainingQuantity(item))}
      </span>
    ) },
    { title: '状态', width: 104, render: (_, item) => renderReceiptItemStatus(item) }
  ]
  return (
    <Drawer title={workspace.selectedOrder
      ? `${workspace.selectedOrder.title || workspace.selectedOrder.orderNo} 收货详情`
      : '收货详情'}
      open={workspace.detailOpen} width={1080} onClose={() => workspace.setDetailOpen(false)}>
      {workspace.selectedOrder ? (
        <div className="warehouse-dispatch-receipt-detail">
          {renderReceiptOrderSummary(workspace.selectedOrder, workspace.selectedSummary)}
          <div className="warehouse-dispatch-receipt-detail-toolbar">
            <Segmented value={workspace.detailScopeFilter}
              options={buildReceiptDetailScopeOptions(workspace.selectedOrder.items)}
              onChange={workspace.setDetailScopeFilter} />
            <Input className="warehouse-dispatch-receipt-detail-search" allowClear prefix={<SearchOutlined />}
              placeholder="搜索 PSKU / 商品 / 采购单" value={workspace.detailKeyword}
              onChange={(event) => workspace.setDetailKeyword(event.target.value)} />
          </div>
          <Table<PurchaseReceiptItem> rowKey={receiptProductBusinessScopeKey} size="small" columns={columns}
            dataSource={workspace.detailItems} pagination={RECEIPT_ITEM_TABLE_PAGINATION}
            scroll={{ x: 1020 }} locale={{ emptyText: <Empty description="没有符合条件的收货明细" /> }} />
        </div>
      ) : <Empty description="未找到收货详情" />}
    </Drawer>
  )
}
