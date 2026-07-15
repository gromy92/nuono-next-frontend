import type { InTransitLogisticsNode } from './types'
import {
  formatNodeDateTime,
  nodeTimelineColor
} from './InTransitGoodsPage.utils'

export type BatchNodeHistoryItem = {
  nodeId: number
  label: string
  happenedAtText: string
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
      label: nodeStatusLabel.get(node.nodeStatus) || '未知状态',
      happenedAtText: formatNodeDateTime(node.nodeHappenedAt),
      color: nodeTimelineColor(node.nodeStatus)
    }))
}
