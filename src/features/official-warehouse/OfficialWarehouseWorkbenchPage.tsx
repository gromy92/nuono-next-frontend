import { Tabs } from 'antd'
import type { AuthSession } from '../auth/session'
import { OfficialWarehousePage } from './OfficialWarehousePage'
import { OfficialWarehouseStatisticsPanel } from './OfficialWarehouseStatisticsPanel'
import './OfficialWarehousePage.css'

type OfficialWarehouseWorkbenchPageProps = {
  session?: AuthSession | null
}

export function OfficialWarehouseWorkbenchPage({ session }: OfficialWarehouseWorkbenchPageProps) {
  const activeStoreCode = session?.currentStore?.storeCode || session?.userStores?.[0]?.storeCode || ''
  const activeSiteCode = (session?.currentStore?.site || session?.userStores?.[0]?.site || 'SA').toUpperCase()
  const defaultActiveTab =
    typeof window !== 'undefined' && window.location.pathname.includes('/warehouse/official-warehouse-stock')
      ? 'stock'
      : 'appointment'

  return (
    <div className="official-warehouse-page official-warehouse-workbench-page">
      <Tabs
        className="official-warehouse-workbench-tabs"
        defaultActiveKey={defaultActiveTab}
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
