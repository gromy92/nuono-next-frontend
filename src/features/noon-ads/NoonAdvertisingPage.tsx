import type { NoonAdvertisingPageProps } from './model/pageModel'
import { useNoonAdvertisingDashboard } from './hooks/useNoonAdvertisingDashboard'
import { NoonAdvertisingWorkbench } from './components/NoonAdvertisingWorkbench'
import './NoonAdvertisingPage.css'

export function NoonAdvertisingPage({ session }: NoonAdvertisingPageProps) {
  return (
    <NoonAdvertisingWorkbench
      state={useNoonAdvertisingDashboard(session)}
    />
  )
}
