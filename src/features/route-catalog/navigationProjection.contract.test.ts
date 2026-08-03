import { strict as assert } from 'node:assert'
import {
  workspaceAccessKeyForMenuKey,
  workspaceMenuContentDensity,
  workspaceSidebarSelectionKeyForMenuKey
} from './RouteCatalog'
import {
  activeWorkspacePathLabel,
  activeWorkspaceSidebarOpenKeys,
  initialWorkspaceTabKeys,
  visibleWorkspaceTabKeys
} from './navigationProjection'
import type { AppMenuKey } from './routeDefinitions'

const noMenus = new Set<AppMenuKey>()
const productMenus = new Set<AppMenuKey>(['product-manage'])
const administrationMenus = new Set<AppMenuKey>(['user-store-noon', 'user-role'])

assert.deepEqual(initialWorkspaceTabKeys('product-manage', noMenus), [])
assert.deepEqual(initialWorkspaceTabKeys('product-manage', productMenus), ['product-manage'])
assert.deepEqual(initialWorkspaceTabKeys('user-store-noon', administrationMenus), ['user-role'])
assert.deepEqual(
  visibleWorkspaceTabKeys(['product-manage', 'purchase-order'], productMenus),
  ['product-manage']
)

assert.equal(
  activeWorkspacePathLabel('product-manage', {
    parentMenuKey: 'product-manage',
    pathLabel: '商品 / 自定义详情'
  }),
  '商品 / 自定义详情'
)

assert.deepEqual(activeWorkspaceSidebarOpenKeys('user-account'), ['user'])
assert.equal(workspaceAccessKeyForMenuKey('user-store-noon'), 'user-role')
assert.equal(workspaceSidebarSelectionKeyForMenuKey('user-store-noon'), 'user-role')
assert.equal(workspaceMenuContentDensity('product-groups'), 'compact')
assert.equal(workspaceMenuContentDensity('purchase-order'), 'standard')
