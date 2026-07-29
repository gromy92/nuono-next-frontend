import { Form, Spin } from 'antd'
import { useMemo } from 'react'
import type { AuthSession } from '../auth/session'
import { PurchaseOrderCreateItemModals } from './components/PurchaseOrderCreateItemModals'
import { PurchaseOrderEditDeleteModals } from './components/PurchaseOrderEditDeleteModals'
import { PurchaseOrderProductDataModal } from './components/PurchaseOrderProductDataModal'
import { PurchaseOrderSidebar } from './components/PurchaseOrderSidebar'
import { PurchaseOrderWorkbench } from './components/PurchaseOrderWorkbench'
import { usePurchaseOrderAli1688History } from './hooks/usePurchaseOrderAli1688History'
import { usePurchaseOrderDataState } from './hooks/usePurchaseOrderDataState'
import { usePurchaseOrderItemMutations } from './hooks/usePurchaseOrderItemMutations'
import { usePurchaseOrderMutations } from './hooks/usePurchaseOrderMutations'
import { usePurchaseOrderProductDataCompletion } from './hooks/usePurchaseOrderProductDataCompletion'
import { usePurchaseOrderProductSearch } from './hooks/usePurchaseOrderProductSearch'
import { usePurchaseOrderShippingMerge } from './hooks/usePurchaseOrderShippingMerge'
import { buildCreateStoreOptions, getCreateStoreSiteOptions } from './model/purchaseOrderStoreModel'
import { openPurchaseOrderTop5 } from './model/purchaseOrderNavigation'
import type {
  AddItemsFormValues,
  CreateOrderFormValues,
  ProductDataCompletionFormValues,
  UpdateItemFormValues,
  UpdateOrderFormValues
} from './model/purchaseOrderViewTypes'
import './PurchaseOrderPage.css'
type PurchaseOrderPageProps = {
  session?: AuthSession | null
  purchaseOrdersRevision?: number
  onPurchaseOrdersChanged?: () => void
}

export function PurchaseOrderPage({
  session,
  purchaseOrdersRevision,
  onPurchaseOrdersChanged
}: PurchaseOrderPageProps) {
  const [createOrderForm] = Form.useForm<CreateOrderFormValues>()
  const [editOrderForm] = Form.useForm<UpdateOrderFormValues>()
  const [addItemsForm] = Form.useForm<AddItemsFormValues>()
  const [editItemForm] = Form.useForm<UpdateItemFormValues>()
  const [productDataCompletionForm] = Form.useForm<ProductDataCompletionFormValues>()
  const {
    orders,
    setOrders,
    selectedOrderId,
    setSelectedOrderId,
    keyword,
    setKeyword,
    loading,
    actionKey,
    setActionKey,
    itemFilterKey,
    setItemFilterKey,
    selectedOrder,
    selectedOrderSummary,
    selectedOrderAllocationSummary,
    selectedOrderIssueSummary,
    itemFilterOptions,
    visibleOrderItems,
    activeItemFilter,
    orderSummaries,
    visibleOrders,
    loadOrders,
    notifyPurchaseOrdersChanged,
    replaceOrder
  } = usePurchaseOrderDataState({
    purchaseOrdersRevision,
    onPurchaseOrdersChanged
  })

  const storeCode = session?.currentStore?.storeCode
  const createStoreCode = Form.useWatch('storeCode', createOrderForm)
  const createStoreOptions = useMemo(() => buildCreateStoreOptions(session), [session])
  const createSiteOptions = useMemo(
    () => getCreateStoreSiteOptions(session, createStoreCode),
    [createStoreCode, session]
  )
  const {
    productAutoCompleteOptions,
    productSearchLoading,
    clearProductSearchOptions,
    handleProductSearch
  } = usePurchaseOrderProductSearch()
  const {
    ali1688HistoryByKey,
    ali1688HistoryLoading,
    ali1688HistoryError
  } = usePurchaseOrderAli1688History(selectedOrder)
  const {
    productDataCompletionTarget,
    productDataCompletionLoading,
    productDataCompletionError,
    openFirstProductDataIssue,
    openProductDataCompletionModal,
    closeProductDataCompletionModal,
    handleSaveProductDataCompletion
  } = usePurchaseOrderProductDataCompletion({
    session,
    selectedOrder,
    form: productDataCompletionForm,
    loadOrders,
    replaceOrder,
    setSelectedOrderId,
    setActionKey
  })
  const {
    addItemsOrder,
    editItemTarget,
    deleteTargetItem,
    addItemsErrorMessage,
    editItemErrorMessage,
    setDeleteTargetItem,
    openAddItemsModal,
    closeAddItemsModal,
    openEditItemModal,
    closeEditItemModal,
    handleAddItemsToOrder,
    handleUpdateItem,
    handleDeleteItem,
    closeOrderItemModals
  } = usePurchaseOrderItemMutations({
    session,
    orders,
    addItemsForm,
    editItemForm,
    clearProductSearchOptions,
    replaceOrder,
    notifyPurchaseOrdersChanged,
    setSelectedOrderId,
    setActionKey
  })
  const {
    createModalOpen,
    editOrderTarget,
    deleteTargetOrder,
    createErrorMessage,
    setDeleteTargetOrder,
    openCreateOrderModal,
    handleCreateStoreChange,
    closeCreateOrderModal,
    openEditOrderModal,
    closeEditOrderModal,
    handleCreateOrder,
    handleSaveOrderHeader,
    handleSubmitOrder,
    handleDeleteOrder
  } = usePurchaseOrderMutations({
    session,
    storeCode,
    createOrderForm,
    editOrderForm,
    clearProductSearchOptions,
    replaceOrder,
    notifyPurchaseOrdersChanged,
    selectedOrderId,
    onOrderDeleted: closeOrderItemModals,
    setOrders,
    setSelectedOrderId,
    setActionKey
  })

  const {
    shippingMergeMode,
    selectedShippingMergeOrderIds,
    shippingMergeAssignedOrderIdSet,
    shippingMergeAssignmentLoading,
    shippingMergeErrorMessage,
    availableShippingMergeOrders,
    selectedShippingMergeOrders,
    selectedShippingMergeTotalQuantity,
    openShippingMergeMode,
    closeShippingMergeMode,
    handleSelectAllVisibleSubmittedOrders,
    handleClearShippingMergeSelection,
    handleToggleShippingMergeOrder,
    handleSelectOrder,
    handleCreateShippingOrderFromSelection
  } = usePurchaseOrderShippingMerge({
    orders,
    visibleOrders,
    selectedOrder,
    setActionKey,
    setSelectedOrderId
  })

  return (
    <div className="purchase-order-page" data-testid="purchase-order-page">
      <Spin spinning={loading}>
        <div className="purchase-order-layout">
          <PurchaseOrderSidebar
            keyword={keyword}
            setKeyword={setKeyword}
            createDisabled={!createStoreOptions.length}
            actionKey={actionKey}
            orders={visibleOrders}
            orderSummaries={orderSummaries}
            selectedOrder={selectedOrder}
            shippingMergeMode={shippingMergeMode}
            selectedShippingMergeOrderIds={selectedShippingMergeOrderIds}
            shippingMergeAssignedOrderIdSet={shippingMergeAssignedOrderIdSet}
            shippingMergeAssignmentLoading={shippingMergeAssignmentLoading}
            shippingMergeErrorMessage={shippingMergeErrorMessage}
            availableShippingMergeOrders={availableShippingMergeOrders}
            selectedShippingMergeOrders={selectedShippingMergeOrders}
            selectedShippingMergeTotalQuantity={selectedShippingMergeTotalQuantity}
            openCreateOrderModal={openCreateOrderModal}
            openShippingMergeMode={openShippingMergeMode}
            closeShippingMergeMode={closeShippingMergeMode}
            handleSelectAllVisibleSubmittedOrders={handleSelectAllVisibleSubmittedOrders}
            handleClearShippingMergeSelection={handleClearShippingMergeSelection}
            handleToggleShippingMergeOrder={handleToggleShippingMergeOrder}
            handleCreateShippingOrderFromSelection={handleCreateShippingOrderFromSelection}
            handleSelectOrder={handleSelectOrder}
            openEditOrderModal={openEditOrderModal}
            setDeleteTargetOrder={setDeleteTargetOrder}
          />

          <PurchaseOrderWorkbench
            selectedOrder={selectedOrder}
            selectedOrderSummary={selectedOrderSummary}
            selectedOrderAllocationSummary={selectedOrderAllocationSummary}
            selectedOrderIssueSummary={selectedOrderIssueSummary}
            itemFilterKey={itemFilterKey}
            setItemFilterKey={setItemFilterKey}
            itemFilterOptions={itemFilterOptions}
            activeItemFilter={activeItemFilter}
            visibleOrderItems={visibleOrderItems}
            actionKey={actionKey}
            ali1688HistoryByKey={ali1688HistoryByKey}
            ali1688HistoryLoading={ali1688HistoryLoading}
            ali1688HistoryError={ali1688HistoryError}
            handleSubmitOrder={handleSubmitOrder}
            openAddItemsModal={openAddItemsModal}
            openFirstProductDataIssue={openFirstProductDataIssue}
            openEditItemModal={openEditItemModal}
            setDeleteTargetItem={setDeleteTargetItem}
            openTop5={openPurchaseOrderTop5}
            openProductDataCompletionModal={openProductDataCompletionModal}
          />
        </div>
      </Spin>

      <PurchaseOrderCreateItemModals
        session={session}
        storeCode={storeCode}
        createStoreCode={createStoreCode}
        createStoreOptions={createStoreOptions}
        createSiteOptions={createSiteOptions}
        productOptions={productAutoCompleteOptions}
        productSearchLoading={productSearchLoading}
        actionKey={actionKey}
        createModalOpen={createModalOpen}
        createErrorMessage={createErrorMessage}
        createOrderForm={createOrderForm}
        addItemsOrder={addItemsOrder}
        addItemsErrorMessage={addItemsErrorMessage}
        addItemsForm={addItemsForm}
        editItemTarget={editItemTarget}
        editItemErrorMessage={editItemErrorMessage}
        editItemForm={editItemForm}
        handleCreateOrder={handleCreateOrder}
        closeCreateOrderModal={closeCreateOrderModal}
        handleCreateStoreChange={handleCreateStoreChange}
        handleAddItemsToOrder={handleAddItemsToOrder}
        closeAddItemsModal={closeAddItemsModal}
        handleUpdateItem={handleUpdateItem}
        closeEditItemModal={closeEditItemModal}
        handleProductSearch={handleProductSearch}
      />

      <PurchaseOrderProductDataModal
        form={productDataCompletionForm}
        target={productDataCompletionTarget}
        loading={productDataCompletionLoading}
        error={productDataCompletionError}
        actionKey={actionKey}
        handleSaveProductDataCompletion={handleSaveProductDataCompletion}
        closeProductDataCompletionModal={closeProductDataCompletionModal}
      />

      <PurchaseOrderEditDeleteModals
        actionKey={actionKey}
        editOrderTarget={editOrderTarget}
        editOrderForm={editOrderForm}
        deleteTargetOrder={deleteTargetOrder}
        deleteTargetItem={deleteTargetItem}
        handleSaveOrderHeader={handleSaveOrderHeader}
        closeEditOrderModal={closeEditOrderModal}
        handleDeleteOrder={handleDeleteOrder}
        handleDeleteItem={handleDeleteItem}
        setDeleteTargetOrder={setDeleteTargetOrder}
        setDeleteTargetItem={setDeleteTargetItem}
      />

    </div>
  )
}
