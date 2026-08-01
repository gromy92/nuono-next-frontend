import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import type { AuthSession } from '../auth/session'
import {
  assertProductSpecsResponseScope,
  resolveProductSpecsRequestScope
} from './productSpecsRequestScope'

const session = {
  userId: 91004,
  accountNo: 'owner-scope-reviewer',
  bindingStatus: 'PROJECT_BOUND',
  defaultOwnerUserId: 307,
  currentStore: {
    projectCode: 'PROJECT-A', storeCode: 'STORE-A-SA', site: 'SA', authorized: true
  },
  userStores: [
    { projectCode: 'PROJECT-A', storeCode: 'STORE-A-AE', site: 'AE', authorized: true },
    { projectCode: 'PROJECT-A', storeCode: 'STORE-A-SA', site: 'SA', authorized: true },
    { projectCode: 'PROJECT-B', storeCode: 'STORE-B-SA', site: 'SA', authorized: true }
  ]
} as AuthSession

assert.deepEqual(resolveProductSpecsRequestScope(session, 307, new URLSearchParams()), {
  ownerUserId: 307,
  storeCode: 'STORE-A-AE'
})

const linkedScope = resolveProductSpecsRequestScope(session, 307, new URLSearchParams({
  ownerUserId: '408', storeCode: 'STORE-B-SA'
}))
assert.deepEqual(linkedScope, { ownerUserId: 408, storeCode: 'STORE-B-SA' })
assert.doesNotThrow(() => assertProductSpecsResponseScope(linkedScope, {
  ownerUserId: 408, storeCode: 'STORE-B-SA'
}))
assert.throws(() => assertProductSpecsResponseScope(linkedScope, {
  ownerUserId: 307, storeCode: 'STORE-B-SA'
}), /商品规格归属校验失败/)
assert.match(resolveProductSpecsRequestScope(
  session,
  307,
  new URLSearchParams({ ownerUserId: '408' })
).error || '', /货主和店铺必须同时提供/)

const controllerSource = readFileSync(new URL('./hooks/useProductSpecsController.ts', import.meta.url), 'utf8')
assert.match(controllerSource, /rowsState\.scopeKey === currentScopeKey \? rowsState\.items : \[\]/)
assert.match(controllerSource, /requestSequence !== requestSequenceRef\.current/)
assert.ok([...controllerSource.matchAll(/scopeKeyRef\.current !== actionScopeKey/g)].length >= 3)
