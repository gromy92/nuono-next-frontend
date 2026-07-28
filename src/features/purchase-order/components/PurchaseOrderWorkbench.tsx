import { PlusOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Empty, Tag, Typography } from 'antd'
import { PurchaseItemCard } from './PurchaseItemCard'
import type { PurchaseOrder, PurchaseOrderItem } from '../types'
import { ali1688HistoryEntriesForItem } from '../model/purchaseOrderAli1688Model'
import { allocationDisplayLabel } from '../model/purchaseOrderItemCommandModel'
import { itemIssues } from '../model/purchaseOrderIssueModel'
import {
  allocationFilterKey,
  formatAllocationQuantitySummary,
  formatOrderQuantitySummary,
  isSubmittedOrder
} from '../model/purchaseOrderSummaryModel'
import type {
  AllocationSummary,
  OrderSummary,
  ProductDataCompletionIssue,
  PurchaseItemFilterOption,
  PurchaseOrderAli1688HistoryEntry,
  PurchaseOrderIssueSummary
} from '../model/purchaseOrderViewTypes'

const { Text } = Typography

type PurchaseOrderWorkbenchProps = {
  selectedOrder?: PurchaseOrder
  selectedOrderSummary: OrderSummary
  selectedOrderAllocationSummary: AllocationSummary[]
  selectedOrderIssueSummary: PurchaseOrderIssueSummary
  itemFilterKey: string
  setItemFilterKey: (key: string) => void
  itemFilterOptions: PurchaseItemFilterOption[]
  activeItemFilter?: PurchaseItemFilterOption
  visibleOrderItems: PurchaseOrderItem[]
  actionKey?: string
  ali1688HistoryByKey: Record<string, PurchaseOrderAli1688HistoryEntry>
  ali1688HistoryLoading: boolean
  ali1688HistoryError?: string
  handleSubmitOrder: (order: PurchaseOrder) => void
  openAddItemsModal: (order: PurchaseOrder) => void
  openFirstProductDataIssue: (issue: ProductDataCompletionIssue) => void
  openEditItemModal: (order: PurchaseOrder, item: PurchaseOrderItem) => void
  setDeleteTargetItem: (target: { order: PurchaseOrder; item: PurchaseOrderItem }) => void
  openTop5: (item: PurchaseOrderItem, order: PurchaseOrder) => void
  openProductDataCompletionModal: (order: PurchaseOrder, item: PurchaseOrderItem, issue?: string) => void
}

export function PurchaseOrderWorkbench({
  selectedOrder, selectedOrderSummary, selectedOrderAllocationSummary, selectedOrderIssueSummary,
  itemFilterKey, setItemFilterKey, itemFilterOptions, activeItemFilter, visibleOrderItems, actionKey,
  ali1688HistoryByKey, ali1688HistoryLoading, ali1688HistoryError, handleSubmitOrder,
  openAddItemsModal, openFirstProductDataIssue, openEditItemModal, setDeleteTargetItem,
  openTop5, openProductDataCompletionModal
}: PurchaseOrderWorkbenchProps) {
  return (
    <main className="purchase-order-workbench">
      <section className="purchase-order-items">
        {selectedOrder ? (
          <div className="purchase-order-detail-toolbar">
            <div className="purchase-order-detail-main">
              <div className="purchase-order-detail-summary">
                <Text strong ellipsis className="purchase-order-detail-title">{selectedOrder.title}</Text>
                <span>{formatOrderQuantitySummary(selectedOrderSummary)}</span>
              </div>
              {selectedOrderAllocationSummary.length ? (
                <div className="purchase-order-allocation-summary" aria-label="按站点和运输方式汇总">
                  <span className="purchase-order-allocation-summary-label">站点运输</span>
                  {selectedOrderAllocationSummary.map((allocation) => (
                    <button
                      type="button"
                      className={`purchase-site-chip purchase-order-summary-chip${itemFilterKey === allocationFilterKey(allocation.site, allocation.transportMode) ? ' is-active' : ''}`}
                      key={`${allocation.site}:${allocation.transportMode || 'UNSPECIFIED'}`}
                      onClick={() => setItemFilterKey(allocationFilterKey(allocation.site, allocation.transportMode))}
                    >
                      <span>{allocationDisplayLabel(allocation)}</span>
                      <strong>{formatAllocationQuantitySummary(allocation)}</strong>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="purchase-order-detail-actions">
              {isSubmittedOrder(selectedOrder) ? null : (
                <Button
                  size="small"
                  type="primary"
                  icon={<SendOutlined />}
                  loading={actionKey === `submit-order:${selectedOrder.id}`}
                  onClick={() => void handleSubmitOrder(selectedOrder)}
                >
                  封存采购单
                </Button>
              )}
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={isSubmittedOrder(selectedOrder)}
                onClick={() => openAddItemsModal(selectedOrder)}
              >
                添加商品
              </Button>
            </div>
          </div>
        ) : null}
        {selectedOrder ? (
          <div className="purchase-order-inspection-panel">
            <div className="purchase-order-filter-bar" data-testid="purchase-order-filter-bar">
              {itemFilterOptions.map((option) => (
                <Button
                  key={option.key}
                  size="small"
                  type={itemFilterKey === option.key ? 'primary' : 'default'}
                  onClick={() => setItemFilterKey(option.key)}
                >
                  {option.label} {option.count}
                </Button>
              ))}
              {activeItemFilter ? (
                <Text type="secondary" className="purchase-order-active-filter" data-testid="purchase-order-active-filter">
                  当前 {activeItemFilter.label}
                </Text>
              ) : null}
            </div>
            <div className="purchase-order-issue-summary" data-testid="purchase-order-issue-summary">
              {selectedOrderIssueSummary.issueItemCount ? (
                <>
                  {selectedOrderIssueSummary.missingImageCount ? (
                    <span>缺图片 {selectedOrderIssueSummary.missingImageCount}</span>
                  ) : null}
                  {selectedOrderIssueSummary.missingAllocationCount ? (
                    <span>无站点运输 {selectedOrderIssueSummary.missingAllocationCount}</span>
                  ) : null}
                  {selectedOrderIssueSummary.missingTransportCount ? (
                    <span>运输方式未指定 {selectedOrderIssueSummary.missingTransportCount}</span>
                  ) : null}
                  {selectedOrderIssueSummary.quantityIssueCount ? (
                    <span>数量异常 {selectedOrderIssueSummary.quantityIssueCount}</span>
                  ) : null}
                  {selectedOrderIssueSummary.missingProductSpecCount ? (
                    <button
                      type="button"
                      className="purchase-order-issue-action is-blocking"
                      onClick={() => openFirstProductDataIssue('产品规格缺失')}
                    >
                      产品规格缺失 {selectedOrderIssueSummary.missingProductSpecCount}
                    </button>
                  ) : null}
                  {selectedOrderIssueSummary.missingCartonSpecCount ? (
                    <button
                      type="button"
                      className="purchase-order-issue-action"
                      onClick={() => openFirstProductDataIssue('箱规缺失')}
                    >
                      箱规缺失 {selectedOrderIssueSummary.missingCartonSpecCount}
                    </button>
                  ) : null}
                  {selectedOrderIssueSummary.missingLogisticsAttributeCount ? (
                    <button
                      type="button"
                      className="purchase-order-issue-action is-blocking"
                      onClick={() => openFirstProductDataIssue('商品属性缺失')}
                    >
                      商品属性缺失 {selectedOrderIssueSummary.missingLogisticsAttributeCount}
                    </button>
                  ) : null}
                  {selectedOrderIssueSummary.collectionFailedCount ? (
                    <span>采集失败 {selectedOrderIssueSummary.collectionFailedCount}</span>
                  ) : null}
                </>
              ) : (
                <>
                  <Tag color="success">基础信息正常</Tag>
                  <span>产品规格和商品属性完整，箱规可按需维护</span>
                </>
              )}
            </div>
          </div>
        ) : null}
        {selectedOrder?.items?.length ? (
          <div className="purchase-item-list">
            {visibleOrderItems.length ? visibleOrderItems.map((item) => (
              <PurchaseItemCard
                key={item.id}
                item={item}
                issues={itemIssues(item)}
                editing={actionKey === `edit-item:${item.id}`}
                deleting={actionKey === `delete-item:${item.id}`}
                ali1688HistoryEntries={ali1688HistoryEntriesForItem(selectedOrder, item, ali1688HistoryByKey)}
                ali1688HistoryLoading={ali1688HistoryLoading}
                ali1688HistoryError={ali1688HistoryError}
                locked={isSubmittedOrder(selectedOrder)}
                onEdit={() => openEditItemModal(selectedOrder, item)}
                onDelete={() => setDeleteTargetItem({ order: selectedOrder, item })}
                onOpenTop5={() => openTop5(item, selectedOrder)}
                onIssueClick={(issue) => openProductDataCompletionModal(selectedOrder, item, issue)}
              />
            )) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前筛选没有商品。" />
            )}
          </div>
        ) : (
          <Empty description={selectedOrder ? '当前采购单还没有商品。' : '请选择或新建采购单。'} />
        )}
      </section>
    </main>
  )
}
