import assert from 'node:assert/strict'
import { recoverProductDeleteFailure } from './utils/productDeleteFailureRecovery'

const calls: unknown[] = []
await recoverProductDeleteFailure({
  error: new Error('Noon 授权恢复中'),
  loadProductListDataset: async (...args) => {
    calls.push(['load', ...args])
  },
  notify: (content) => calls.push(['notify', content]),
  ownerUserId: 307,
  storeCode: 'STR245027-NSA'
})

assert.deepEqual(calls, [
  ['notify', '删除请求未确认提交，正在刷新商品状态。Noon 授权恢复中'],
  ['load', 'STR245027-NSA', 307, { force: true }]
])
