import { Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { PRODUCT_SPECS_PATH } from '../route-catalog/routePaths'
import { withCurrentWorkspaceDevQuery } from '../route-catalog/workspaceDevQuery'
import { buildProductBaselineScopes, resolveReadyProductSpecsScope } from './readyDomain'
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
import { canOpenProductSpecsFromWarehouse } from './warehouseProductSpecAccess'
import { WarehouseOrderPanel } from './warehouse-order/WarehouseOrderPanel'
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
  const productBaselineScopes = useMemo(() => buildProductBaselineScopes({
    activeTab,
    visibleReadyItems: ready.visibleItems
  }), [activeTab, ready.visibleItems])
  const productBaselines = useProductBaselines(productBaselineScopes)
  const canOpenProductSpecs = canOpenProductSpecsFromWarehouse(session)

  function openProductSpecs(item: ReadyShipmentRow) {
    if (!canOpenProductSpecs) return
    const params = new URLSearchParams()
    if (item.psku) params.set('keyword', item.psku)
    const scope = resolveReadyProductSpecsScope(item)
    if (!scope) return
    params.set('ownerUserId', String(scope.ownerUserId))
    params.set('storeCode', scope.storeCode)
    window.location.assign(withCurrentWorkspaceDevQuery(`${PRODUCT_SPECS_PATH}?${params.toString()}`))
  }

  const tabItems = [
    {
      key: 'warehouse-order',
      label: buildTabLabel('仓库单', 0, 'operations'),
      children: <WarehouseOrderPanel />
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
      children: <WarehouseReadyPanel workspace={ready} productBaselineByScope={productBaselines.itemsByScope}
        productBaselineError={productBaselines.error}
        orderMetaById={receipt.orderMetaById} dataLoading={data.dataLoading}
        canOpenProductSpecs={canOpenProductSpecs}
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
