import { ReplenishmentPlanWorkbench } from './components/ReplenishmentPlanWorkbench'
import { useReplenishmentPlanController } from './hooks/useReplenishmentPlanController'
import type { ReplenishmentPlanTabProps } from './pageTypes'
import './ReplenishmentPlanTab.css'

export function ReplenishmentPlanTab(props: ReplenishmentPlanTabProps) {
  return <ReplenishmentPlanWorkbench state={useReplenishmentPlanController(props)} />
}
