import { Alert } from 'antd'
import type { AuthSession } from '../auth/session'
import type { SalesAnalyticsPageProps } from './model/pageTypes'
import { useSalesActivityWindows } from './hooks/useSalesActivityWindows'
import { useSalesAnalyticsDataset } from './hooks/useSalesAnalyticsDataset'
import { useSalesProductDetail } from './hooks/useSalesProductDetail'
import { SalesActivityConfigWorkbench } from './components/SalesActivityConfigWorkbench'
import { SalesAnalyticsWorkbench } from './components/SalesAnalyticsWorkbench'

export function SalesActivityConfigPage({ session }: { session: AuthSession }) {
  return <SalesAnalyticsPage session={session} mode="activity-config" />
}

export function SalesAnalyticsPage({
  session,
  mode = 'analytics'
}: SalesAnalyticsPageProps) {
  const isActivityConfigMode = mode === 'activity-config'
  const dataset = useSalesAnalyticsDataset(session, isActivityConfigMode)
  const activities = useSalesActivityWindows(dataset.query, dataset.dateRange)
  const detail = useSalesProductDetail(dataset.query)

  if (!dataset.currentStore?.storeCode) {
    return <Alert type="warning" showIcon message="当前账号没有可用店铺" />
  }
  if (isActivityConfigMode) {
    return (
      <SalesActivityConfigWorkbench
        dataset={dataset}
        activities={activities}
      />
    )
  }
  return (
    <SalesAnalyticsWorkbench
      dataset={dataset}
      detail={detail}
      refreshActivities={activities.loadActivities}
    />
  )
}

export default SalesAnalyticsPage
