import type { DispatchPlan, DispatchPlanLine, RouteGroup } from './types'
import { SITE_LABELS, TRANSPORT_LABELS } from './workbenchModels'
import { sum } from './workbenchUtils'

export function buildRouteGroups(lines: DispatchPlanLine[]): RouteGroup[] {
  const groupMap = new Map<string, RouteGroup>()
  lines.forEach((line) => {
    const key = [line.siteCode, line.transportMode, line.specStatus].join('__')
    const current = groupMap.get(key)
    if (current) {
      current.lineCount += 1
      current.totalQuantity += line.totalQuantity
      current.issueCount += line.specStatus === 'missing' ? 1 : 0
      return
    }
    groupMap.set(key, {
      key,
      siteCode: line.siteCode,
      transportMode: line.transportMode,
      specStatus: line.specStatus,
      lineCount: 1,
      totalQuantity: line.totalQuantity,
      issueCount: line.specStatus === 'missing' ? 1 : 0
    })
  })
  return Array.from(groupMap.values())
}

export function buildPlanSiteTransportLabels(lines: DispatchPlanLine[]): string[] {
  return Array.from(new Set(lines.map(
    (line) => `${SITE_LABELS[line.siteCode]} / ${TRANSPORT_LABELS[line.transportMode]}`
  )))
}

export function countPlanSourceOrders(plan: DispatchPlan) {
  return new Set(plan.lines.flatMap((line) => line.sources.map((source) => source.orderNo))).size
}

export function countPlanStores(plan: DispatchPlan) {
  return new Set(plan.lines.flatMap((line) => line.sources.map((source) => source.storeName))).size
}

export function sumPlanQuantity(plan: DispatchPlan) {
  return sum(plan.lines.map((line) => line.totalQuantity))
}
