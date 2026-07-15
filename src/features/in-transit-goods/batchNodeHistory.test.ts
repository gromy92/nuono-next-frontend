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
assert.deepEqual(items.map((item) => item.label), ['国内收货', '运输中', '运输中'])
assert.deepEqual(items.map((item) => item.happenedAtText), [
  '2026-06-01 09:00:00',
  '2026-06-03 10:00:00',
  '2026-06-05 11:00:00'
])
assert.equal(items[0].description, null)
assert.equal(items[1].description, '预计到港')
assert.equal(items[2].description, '已到港待清关')
