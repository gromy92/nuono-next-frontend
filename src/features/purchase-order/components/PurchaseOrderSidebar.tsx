import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, TruckOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, Empty, Input, Progress, Tag, Tooltip, Typography } from 'antd'
import type { PurchaseOrder } from '../types'
import {
  emptySummary,
  isOrderAvailableForShippingMerge,
  isSubmittedOrder
} from '../model/purchaseOrderSummaryModel'
import { ORDER_STATUS_META } from '../model/purchaseOrderUiMeta'
import type { OrderSummary } from '../model/purchaseOrderViewTypes'

const { Text } = Typography

type PurchaseOrderSidebarProps = {
  keyword: string
  setKeyword: (keyword: string) => void
  createDisabled: boolean
  actionKey?: string
  orders: PurchaseOrder[]
  orderSummaries: Map<string, OrderSummary>
  selectedOrder?: PurchaseOrder
  shippingMergeMode: boolean
  selectedShippingMergeOrderIds: string[]
  shippingMergeAssignedOrderIdSet: Set<string>
  shippingMergeAssignmentLoading: boolean
  shippingMergeErrorMessage?: string
  availableShippingMergeOrders: PurchaseOrder[]
  selectedShippingMergeOrders: PurchaseOrder[]
  selectedShippingMergeTotalQuantity: number
  openCreateOrderModal: () => void
  openShippingMergeMode: () => Promise<void>
  closeShippingMergeMode: () => void
  handleSelectAllVisibleSubmittedOrders: () => void
  handleClearShippingMergeSelection: () => void
  handleToggleShippingMergeOrder: (order: PurchaseOrder, checked: boolean) => void
  handleCreateShippingOrderFromSelection: () => Promise<void>
  handleSelectOrder: (order: PurchaseOrder) => void
  openEditOrderModal: (order: PurchaseOrder) => void
  setDeleteTargetOrder: (order: PurchaseOrder) => void
}

export function PurchaseOrderSidebar({
  keyword, setKeyword, createDisabled, actionKey, orders: visibleOrders, orderSummaries, selectedOrder,
  shippingMergeMode, selectedShippingMergeOrderIds, shippingMergeAssignedOrderIdSet,
  shippingMergeAssignmentLoading, shippingMergeErrorMessage, availableShippingMergeOrders,
  selectedShippingMergeOrders, selectedShippingMergeTotalQuantity, openCreateOrderModal,
  openShippingMergeMode, closeShippingMergeMode, handleSelectAllVisibleSubmittedOrders,
  handleClearShippingMergeSelection, handleToggleShippingMergeOrder,
  handleCreateShippingOrderFromSelection, handleSelectOrder,
  openEditOrderModal, setDeleteTargetOrder
}: PurchaseOrderSidebarProps) {
  return (
    <aside className="purchase-order-sidebar">
      <div className="purchase-order-sidebar-tools">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索采购单 / SKU"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="purchase-order-search"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateOrderModal} disabled={createDisabled}>
          新建采购单
        </Button>
      </div>
      {shippingMergeMode ? (
        <div className="purchase-order-shipping-merge-panel">
          <div className="purchase-order-shipping-merge-summary">
            <div>
              <Text strong>已选 {selectedShippingMergeOrders.length} 单</Text>
              <Text type="secondary"> / 可选 {availableShippingMergeOrders.length} 单</Text>
            </div>
            <Text type="secondary">{selectedShippingMergeTotalQuantity} 件</Text>
          </div>
          {shippingMergeErrorMessage ? (
            <Alert
              type="warning"
              showIcon
              message={shippingMergeErrorMessage}
              className="purchase-order-shipping-merge-alert"
            />
          ) : null}
          <div className="purchase-order-shipping-merge-actions">
            <Button size="small" onClick={closeShippingMergeMode}>
              取消
            </Button>
            <Button
              size="small"
              onClick={handleSelectAllVisibleSubmittedOrders}
              disabled={
                shippingMergeAssignmentLoading
                || !availableShippingMergeOrders.length
                || selectedShippingMergeOrders.length === availableShippingMergeOrders.length
              }
            >
              全选已封存
            </Button>
            <Button
              size="small"
              onClick={handleClearShippingMergeSelection}
              disabled={!selectedShippingMergeOrders.length}
            >
              清空
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<TruckOutlined />}
              disabled={shippingMergeAssignmentLoading || !selectedShippingMergeOrders.length}
              loading={actionKey === 'create-shipping-order-selection'}
              onClick={() => void handleCreateShippingOrderFromSelection()}
            >
              创建仓库单
            </Button>
          </div>
        </div>
      ) : (
        <Button
          block
          icon={<TruckOutlined />}
          className="purchase-order-shipping-link"
          loading={shippingMergeAssignmentLoading}
          onClick={() => void openShippingMergeMode()}
        >
          多选合并为仓库单
        </Button>
      )}
      {visibleOrders.length ? (
        visibleOrders.map((order) => {
          const summary = orderSummaries.get(order.id) || emptySummary()
          const meta = ORDER_STATUS_META[summary.status] || ORDER_STATUS_META.draft
          const submitted = isSubmittedOrder(order)
          const alreadyAssigned = shippingMergeAssignedOrderIdSet.has(order.id)
          const availableForShippingMerge = isOrderAvailableForShippingMerge(order, shippingMergeAssignedOrderIdSet)
          const selectedForShippingMerge = selectedShippingMergeOrderIds.includes(order.id)
          return (
            <article
              className={`purchase-order-card${shippingMergeMode ? ' is-merge-mode' : ''}${order.id === selectedOrder?.id ? ' is-active' : ''}${selectedForShippingMerge ? ' is-merge-selected' : ''}${shippingMergeMode && !availableForShippingMerge ? ' is-merge-disabled' : ''}`}
              key={order.id}
            >
              <div
                role="button"
                tabIndex={0}
                aria-pressed={order.id === selectedOrder?.id}
                className="purchase-order-card-select"
                onClick={() => handleSelectOrder(order)}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) {
                return
              }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleSelectOrder(order)
              }
            }}
              >
                {shippingMergeMode ? (
                  <div
                    className="purchase-order-merge-row"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      className="purchase-order-merge-checkbox"
                      checked={selectedForShippingMerge}
                      disabled={!availableForShippingMerge}
                      aria-label={`选择${order.title}`}
                      onChange={(event) => handleToggleShippingMergeOrder(order, event.target.checked)}
                    >
                      选择
                    </Checkbox>
                    <Tag color={availableForShippingMerge ? 'blue' : 'default'} className="purchase-order-merge-status">
                      {availableForShippingMerge ? '已封存可合并' : alreadyAssigned ? '已在仓库单' : '未封存不可合并'}
                    </Tag>
                  </div>
                ) : null}
                <div className="purchase-order-card-top">
                  <div className="purchase-order-card-titleline">
                    <Text strong ellipsis className="purchase-order-card-title">{order.title}</Text>
                    <Tooltip title={meta.label}>
                      <Tag icon={meta.icon} color={meta.color} className="purchase-order-status-tag" />
                    </Tooltip>
                  </div>
                  <div className="purchase-order-card-tools">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      aria-label="编辑采购单"
                      title="编辑采购单"
                      disabled={submitted}
                      className="purchase-order-card-icon-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        openEditOrderModal(order)
                      }}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label="删除采购单"
                      title="删除采购单"
                      disabled={submitted}
                      className="purchase-order-card-icon-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setDeleteTargetOrder(order)
                      }}
                    />
                  </div>
                </div>
                <div className="purchase-order-card-meta">
                  <span>{order.createdAt?.slice(5, 10) || order.orderNo}</span>
                  <span>商品 {summary.itemCount}</span>
                  <span>SKU {summary.skuCount}</span>
                  <span>{summary.totalQuantity} 件</span>
                  <span>{summary.progress}%</span>
                </div>
                <Progress percent={summary.progress} size="small" showInfo={false} />
              </div>
            </article>
          )
        })
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无采购单" />
      )}
    </aside>
  )
}
