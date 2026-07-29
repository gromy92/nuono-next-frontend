import { strict as assert } from 'node:assert'
import type { AuthSession } from '../auth/session'
import {
  matchGrantedMenuToWorkspaceMenuKeys,
  resolveSessionAllowedMenuKeys
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
  ['system-file-management', 'user-account', 'system-role'],
  'system administrators retain administration capabilities when grants are empty'
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
