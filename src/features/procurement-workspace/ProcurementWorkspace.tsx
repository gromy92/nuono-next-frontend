import { Tabs } from 'antd'
import { useEffect, useState } from 'react'
import type { AuthSession } from '../auth/session'
import { PurchaseOrderPage } from '../purchase-order/PurchaseOrderPage'
import { ReplenishmentPlanTab } from '../replenishment-plan/ReplenishmentPlanTab'

const PURCHASE_ORDER_TAB_QUERY_KEY = 'tab'
type ProcurementWorkspaceTabKey = 'purchase-orders' | 'replenishment-plan'

export function ProcurementWorkspace({
  session
}: {
  session?: AuthSession | null
}) {
  const [activeTab, setActiveTab] = useState<ProcurementWorkspaceTabKey>(
    initialProcurementTab
  )
  const [purchaseOrdersRevision, setPurchaseOrdersRevision] = useState(0)
  const [replenishmentOrdersRevision, setReplenishmentOrdersRevision] =
    useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (activeTab === 'purchase-orders') {
      params.set(PURCHASE_ORDER_TAB_QUERY_KEY, 'purchase-orders')
    } else {
      params.delete(PURCHASE_ORDER_TAB_QUERY_KEY)
    }
    const queryString = params.toString()
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)
  }, [activeTab])

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as ProcurementWorkspaceTabKey)}
      items={[
        {
          key: 'replenishment-plan',
          label: '补货计划',
          children: (
            <ReplenishmentPlanTab
              session={session}
              purchaseOrdersRevision={replenishmentOrdersRevision}
              onPurchaseOrdersChanged={() =>
                setPurchaseOrdersRevision((current) => current + 1)
              }
            />
          )
        },
        {
          key: 'purchase-orders',
          label: '采购单',
          children: (
            <PurchaseOrderPage
              session={session}
              purchaseOrdersRevision={purchaseOrdersRevision}
              onPurchaseOrdersChanged={() =>
                setReplenishmentOrdersRevision((current) => current + 1)
              }
            />
          )
        }
      ]}
    />
  )
}

export function initialProcurementTab(): ProcurementWorkspaceTabKey {
  if (typeof window === 'undefined') return 'replenishment-plan'
  const requestedTab = new URLSearchParams(window.location.search).get(
    PURCHASE_ORDER_TAB_QUERY_KEY
  )
  return requestedTab === 'purchase-orders'
    ? 'purchase-orders'
    : 'replenishment-plan'
}
