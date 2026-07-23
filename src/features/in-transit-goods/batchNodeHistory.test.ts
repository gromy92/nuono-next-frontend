import assert from 'node:assert/strict'
import { buildBatchNodeHistoryItems } from './batchNodeHistory'
import type { InTransitLogisticsNode } from './types'

const nodes: InTransitLogisticsNode[] = [
  {
    nodeId: 3,
    batchId: 10,
    nodeStatus: 'in_transit',
    nodeHappenedAt: '2026-06-05T11:00:00',
    description: '已到港待清关'
  },
  {
    nodeId: 1,
    batchId: 10,
    nodeStatus: 'handed_to_forwarder',
    nodeHappenedAt: '2026-06-01T09:00:00',
    description: '国内收货'
  },
  {
    nodeId: 2,
    batchId: 10,
    nodeStatus: 'in_transit',
    nodeHappenedAt: '2026-06-03T10:00:00',
    description: '预计到港'
  }
]

const items = buildBatchNodeHistoryItems(nodes, new Map([
  ['handed_to_forwarder', '已交货代'],
  ['in_transit', '运输中']
]))

assert.deepEqual(items.map((item) => item.nodeId), [1, 2, 3])
assert.deepEqual(items.map((item) => item.label), ['已交货代', '运输中', '运输中'])
assert.deepEqual(items.map((item) => item.happenedAtText), [
  '2026-06-01 09:00:00',
  '2026-06-03 10:00:00',
  '2026-06-05 11:00:00'
])
assert.ok(items.every((item) => !('description' in item)), '历史状态不应暴露货代原始描述')

const unknownItems = buildBatchNodeHistoryItems([
  {
    nodeId: 4,
    batchId: 10,
    nodeStatus: 'provider_private_status',
    nodeHappenedAt: '2026-06-06T12:00:00',
    description: 'PROVIDER RAW STATUS'
  }
], new Map())

assert.equal(unknownItems[0].label, '未知状态')
assert.ok(!JSON.stringify(unknownItems).includes('provider_private_status'))
assert.ok(!JSON.stringify(unknownItems).includes('PROVIDER RAW STATUS'))
