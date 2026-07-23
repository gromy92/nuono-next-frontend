import assert from 'node:assert/strict'
import { buildInTransitAutoSyncAlertItems } from './autoSyncAlerts'
import type { InTransitLogisticsAutoSyncAccount } from './types'

const accounts: InTransitLogisticsAutoSyncAccount[] = [
  {
    accountId: 1,
    sourceSystem: 'YITE',
    forwarderName: '义特',
    loginAccountMasked: 'yi***01',
    lastPreviewStatus: 'SUCCESS',
    lastSyncStatus: 'PREVIEW_ONLY'
  },
  {
    accountId: 2,
    sourceSystem: 'CHIC',
    forwarderName: '启客',
    loginAccountMasked: 'ch***88',
    lastPreviewStatus: 'FAILED',
    lastSyncStatus: 'FAILED',
    lastFailureCode: 'PREVIEW_BLOCKED',
    lastFailureMessage: '物流商品 barcode 未匹配 19 条，自动同步已阻断，未提交。',
    lastTaskId: 312696,
    updatedAt: '2026-07-15T12:30:45'
  }
]

const items = buildInTransitAutoSyncAlertItems(accounts)
assert.equal(items.length, 1)
assert.deepEqual(items[0], {
  key: 2,
  accountLabel: '启客（ch***88）',
  failureMessage: '物流商品 barcode 未匹配 19 条，自动同步已阻断，未提交。',
  failureCode: 'PREVIEW_BLOCKED',
  updatedAtText: '2026-07-15 12:30:45',
  taskLabel: '任务 #312696'
})
assert.ok(!JSON.stringify(items).includes('YITE'))
