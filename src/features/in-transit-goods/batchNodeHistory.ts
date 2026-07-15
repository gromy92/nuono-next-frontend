import type { InTransitLogisticsNode } from './types'
import {
  formatNodeDateTime,
  logisticsNodeDisplayLabel,
  nodeTimelineColor,
  shouldShowNodeDescription
} from './InTransitGoodsPage.utils'

export type BatchNodeHistoryItem = {
  nodeId: number
  label: string
  happenedAtText: string
  description: string | null
  color: string
}

export function buildBatchNodeHistoryItems(
  nodes: InTransitLogisticsNode[] | null | undefined,
  nodeStatusLabel: Map<string, string>
): BatchNodeHistoryItem[] {
  return [...(nodes ?? [])]
    .sort((left, right) => {
      const byTime = left.nodeHappenedAt.localeCompare(right.nodeHappenedAt)
      return byTime || left.nodeId - right.nodeId
    })
    .map((node) => ({
      nodeId: node.nodeId,
      label: logisticsNodeDisplayLabel(nodeStatusLabel, node.nodeStatus, node.description),
      happenedAtText: formatNodeDateTime(node.nodeHappenedAt),
      description: shouldShowNodeDescription(node.description) ? node.description?.trim() || null : null,
      color: nodeTimelineColor(node.nodeStatus)
    }))
}
