import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { recoverProductDeleteFailure } from './utils/productDeleteFailureRecovery'

const localDeletion = readFileSync(
  new URL('./hooks/useProductLocalDeletion.ts', import.meta.url),
  'utf8'
)
const listOperations = readFileSync(
  new URL('./hooks/useProductListOperations.ts', import.meta.url),
  'utf8'
)
const workspace = readFileSync(
  new URL('./useProductManagementWorkspace.tsx', import.meta.url),
  'utf8'
)

assert.match(
  localDeletion,
  /catch \(error\) \{[\s\S]*recoverProductDeleteFailure\(\{[\s\S]*loadProductListDataset/,
  'a rejected delete request must force-refresh the authoritative product list before clearing its transient state'
)
assert.match(
  listOperations,
  /useProductLocalDeletion\(\{[\s\S]*loadProductListDataset/,
  'product list operations must pass the authoritative dataset loader into local deletion'
)
assert.match(
  workspace,
  /useProductListOperations\(\{[\s\S]*loadProductListDataset/,
  'the product workspace must wire its force-capable dataset loader into list operations'
)

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
