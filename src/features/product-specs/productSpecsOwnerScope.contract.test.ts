import { strict as assert } from 'node:assert'
import type { AuthSession } from '../auth/session'
import {
  assertProductSpecsResponseScope,
  isCurrentProductSpecsRequest,
  isCurrentProductSpecsScope,
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

assert.equal(isCurrentProductSpecsScope('owner-307::STORE-A', 'owner-307::STORE-A'), true)
assert.equal(isCurrentProductSpecsScope('owner-408::STORE-B', 'owner-307::STORE-A'), false)
assert.equal(isCurrentProductSpecsRequest({
  requestSequence: 4,
  latestRequestSequence: 5,
  requestScopeKey: 'owner-307::STORE-A',
  currentScopeKey: 'owner-307::STORE-A'
}), false)
assert.equal(isCurrentProductSpecsRequest({
  requestSequence: 5,
  latestRequestSequence: 5,
  requestScopeKey: 'owner-307::STORE-A',
  currentScopeKey: 'owner-408::STORE-B'
}), false)
assert.equal(isCurrentProductSpecsRequest({
  requestSequence: 5,
  latestRequestSequence: 5,
  requestScopeKey: 'owner-307::STORE-A',
  currentScopeKey: 'owner-307::STORE-A'
}), true)
