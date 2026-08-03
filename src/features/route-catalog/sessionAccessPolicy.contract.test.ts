import { strict as assert } from 'node:assert'
import type { AuthSession } from '../auth/session'
import {
  matchGrantedMenuToWorkspaceMenuKeys,
  resolveSessionAllowedMenuKeys,
  resolveSessionRenderMenuKey,
  sessionHasBusinessCapability
} from './sessionAccessPolicy'

const systemAdmin: AuthSession = {
  userId: 1,
  accountNo: 'admin',
  roleId: 1,
  roleName: '系统管理员',
  level: 0,
  bindingStatus: 'BOUND',
  grantedMenus: []
}

assert.deepEqual(
  resolveSessionAllowedMenuKeys(systemAdmin),
  ['user-account', 'system-role'],
  'system administrators retain administration capabilities when grants are empty'
)

assert.deepEqual(
  resolveSessionAllowedMenuKeys({
    ...systemAdmin,
    userId: 2,
    accountNo: 'buyer',
    roleId: 5,
    roleName: '采购',
    level: 5,
    grantedMenus: [
      { menuId: 25, menuName: '角色分配', urlPath: '/api/user/role' }
    ]
  }),
  ['user-store-noon', 'user-role'],
  'catalog access ownership exposes the hidden shared-tab route with its granted parent'
)

assert.deepEqual(
  matchGrantedMenuToWorkspaceMenuKeys({
    menuId: 1,
    menuName: 'unmatched',
    urlPath: '/api/product-keywords-evil'
  }),
  [],
  'grant path prefixes must not match adjacent path segments'
)

const warehouseOnlySession: AuthSession = {
  ...systemAdmin,
  userId: 3,
  accountNo: 'warehouse-operator',
  roleId: 6,
  roleName: '仓库操作员',
  level: 6,
  grantedMenus: [
    { menuId: 30, menuName: '仓库发运', urlPath: '/warehouse/dispatch' }
  ]
}
assert.equal(sessionHasBusinessCapability(warehouseOnlySession, 'PRODUCT_MASTER'), false)
assert.equal(sessionHasBusinessCapability(warehouseOnlySession, 'PROCUREMENT'), false)
assert.equal(resolveSessionAllowedMenuKeys(warehouseOnlySession).includes('product-specs'), false)
assert.equal(
  resolveSessionRenderMenuKey(warehouseOnlySession, ['warehouse-dispatch'], 'product-specs'),
  'warehouse-dispatch',
  'unauthorized requested workspaces must fail closed during render'
)
