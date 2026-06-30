import { useState } from 'react'
import { Tabs } from 'antd'
import type { AuthSession } from '../auth/session'
import { OfficialWarehousePage } from './OfficialWarehousePage'
import { OfficialWarehouseStatisticsPanel } from './OfficialWarehouseStatisticsPanel'
import './OfficialWarehousePage.css'

type OfficialWarehouseWorkbenchTabKey = 'appointment' | 'stock'

type OfficialWarehouseWorkbenchPageProps = {
  session?: AuthSession | null
}

function readInitialWorkbenchTab(): OfficialWarehouseWorkbenchTabKey {
  if (typeof window === 'undefined') {
    return 'appointment'
  }
  const searchParams = new URLSearchParams(window.location.search)
  if (
    searchParams.get('officialWarehouseTab') === 'stock' ||
    window.location.pathname.includes('/warehouse/official-warehouse-stock')
  ) {
    return 'stock'
  }
  return 'appointment'
}

function replaceWorkbenchTabQuery(tabKey: OfficialWarehouseWorkbenchTabKey) {
  if (typeof window === 'undefined') {
    return
  }
  const nextUrl = new URL(window.location.href)
  if (tabKey === 'stock') {
    nextUrl.searchParams.set('officialWarehouseTab', 'stock')
  } else {
    nextUrl.searchParams.delete('officialWarehouseTab')
  }
  window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
}

export function OfficialWarehouseWorkbenchPage({ session }: OfficialWarehouseWorkbenchPageProps) {
  const activeStoreCode = session?.currentStore?.storeCode || session?.userStores?.[0]?.storeCode || ''
  const activeSiteCode = (session?.currentStore?.site || session?.userStores?.[0]?.site || 'SA').toUpperCase()
  const [activeTab, setActiveTab] = useState<OfficialWarehouseWorkbenchTabKey>(() => readInitialWorkbenchTab())
  const handleTabChange = (tabKey: string) => {
    const nextTab = tabKey === 'stock' ? 'stock' : 'appointment'
    setActiveTab(nextTab)
    replaceWorkbenchTabQuery(nextTab)
  }

  return (
    <div className="official-warehouse-page official-warehouse-workbench-page">
      <Tabs
        className="official-warehouse-workbench-tabs"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'appointment',
            label: 'ASN约仓',
            children: <OfficialWarehousePage session={session} />
          },
          {
            key: 'stock',
            label: '库存核对',
            children: <OfficialWarehouseStatisticsPanel storeCode={activeStoreCode} siteCode={activeSiteCode} mode="product" />
          }
        ]}
      />
    </div>
  )
}
