import { Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { PRODUCT_SPECS_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import { WarehouseShippingOrderPanel } from '../warehouse-shipping-order/WarehouseShippingOrderPage'
import { buildProductBaselineStoreCodes } from './readyDomain'
import { useProductBaselines } from './useProductBaselines'
import { useReadyWorkspace } from './useReadyWorkspace'
import { useReceiptWorkspace } from './useReceiptWorkspace'
import { useShippingPlanWorkspace } from './useShippingPlanWorkspace'
import { useWarehouseDispatchData } from './useWarehouseDispatchData'
import { WarehouseDispatchPlanDetail } from './WarehouseDispatchPlanDetail'
import { WarehouseDispatchPlanPanel } from './WarehouseDispatchPlanPanel'
import { buildTabLabel, renderSummaryGrid } from './WarehouseDispatchSharedView'
import { WarehousePackingListPanel } from './WarehousePackingListPanel'
import { WarehouseReadyPanel } from './WarehouseReadyPanel'
import { WarehouseReceiptPanel } from './WarehouseReceiptPanel'
import { WarehouseShippingCostDrawer } from './WarehouseShippingCostDrawer'
import type {
  ReadyShipmentRow,
  WarehouseDispatchTabKey,
  WarehouseDispatchWorkbenchPageProps
} from './workbenchModels'
import './WarehouseDispatchWorkbenchPage.css'

export function WarehouseDispatchWorkbenchPage({ session }: WarehouseDispatchWorkbenchPageProps) {
  const [activeTab, setActiveTab] = useState<WarehouseDispatchTabKey>('warehouse-order')
  const [packingListRefreshKey, setPackingListRefreshKey] = useState(0)
  const data = useWarehouseDispatchData(activeTab)
  const receipt = useReceiptWorkspace(data.orders, session)
  const ready = useReadyWorkspace(data.readyItems, data.refresh)
  const shipping = useShippingPlanWorkspace(data.dispatchPlans, data.refresh, () => {
    setPackingListRefreshKey((current) => current + 1)
    setActiveTab('packing-list')
  })
  const baselineStoreCodes = useMemo(() => buildProductBaselineStoreCodes({
    activeTab,
    currentStoreCode: session?.currentStore?.storeCode,
    selectedPlan: shipping.selectedPlan,
    visibleReadyItems: ready.visibleItems
  }), [activeTab, ready.visibleItems, session?.currentStore?.storeCode, shipping.selectedPlan])
  const productBaselines = useProductBaselines(
    session?.defaultOwnerUserId || session?.userId,
    baselineStoreCodes
  )

  function openProductSpecs(item: ReadyShipmentRow) {
    const params = new URLSearchParams()
    if (item.psku) params.set('keyword', item.psku)
    window.location.assign(withCurrentWorkspaceDevQuery(`${PRODUCT_SPECS_PATH}?${params.toString()}`))
  }

  const tabItems = [
    {
      key: 'warehouse-order',
      label: buildTabLabel('仓库单', 0, 'operations'),
      children: <WarehouseShippingOrderPanel embedded session={session} />
    },
    {
      key: 'receipt-list',
      label: buildTabLabel('采购收货', receipt.totalSummary.receiptTodoOrderCount),
      children: <WarehouseReceiptPanel workspace={receipt} dataLoading={data.dataLoading}
        dataError={data.dataError} />
    },
    {
      key: 'ship-ready',
      label: buildTabLabel('库存', ready.allItems.length),
      children: <WarehouseReadyPanel workspace={ready} productBaselineByPsku={productBaselines.itemsByPsku}
        orderMetaById={receipt.orderMetaById} dataLoading={data.dataLoading}
        onOpenProductSpecs={openProductSpecs} />
    },
    {
      key: 'dispatch-plan',
      label: buildTabLabel('发货申请单', data.dispatchPlans.length, 'operations'),
      children: <WarehouseDispatchPlanPanel plans={data.dispatchPlans} workspace={shipping}
        dataLoading={data.dataLoading} dataError={data.dataError} onRefresh={data.refresh} />
    },
    {
      key: 'packing-list',
      label: buildTabLabel('发货执行', 0),
      children: <WarehousePackingListPanel key={packingListRefreshKey} />
    }
  ]

  return (
    <div className="warehouse-dispatch-page">
      <div className="warehouse-dispatch-header">
        {renderSummaryGrid([
          ['待处理', receipt.totalSummary.receiptTodoOrderCount],
          ['全部仓库单', receipt.totalSummary.orderCount],
          ['应收件数', receipt.totalSummary.expectedQty],
          ['已收件数', receipt.totalSummary.receivedQty],
          ['可发运', receipt.totalSummary.readyQty],
          ['规格缺失', receipt.totalSummary.missingSpecCount]
        ], 'warehouse-dispatch-header-summary')}
      </div>
      <div className="warehouse-dispatch-workbench">
        <Tabs className="warehouse-dispatch-tabs" activeKey={activeTab} destroyInactiveTabPane
          items={tabItems} onChange={(key) => setActiveTab(key as WarehouseDispatchTabKey)} />
      </div>
      <WarehouseDispatchPlanDetail workspace={shipping} dataLoading={data.dataLoading} />
      <WarehouseShippingCostDrawer workspace={shipping} />
    </div>
  )
}
