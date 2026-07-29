import { strict as assert } from 'node:assert'
import {
  workspaceAccessKeyForMenuKey,
  workspaceMenuDefinition,
  workspaceMenuMount,
  workspaceSidebarSelectionKeyForMenuKey
} from '../route-catalog/RouteCatalog'

const storeDefinition = workspaceMenuDefinition('user-store-noon')
const roleDefinition = workspaceMenuDefinition('user-role')

assert.strictEqual(
  storeDefinition.workspaceMount,
  roleDefinition.workspaceMount,
  'role and store definitions must share one state-owning mount'
)
assert.strictEqual(workspaceMenuMount('user-role'), roleDefinition.workspaceMount)
assert.equal(workspaceAccessKeyForMenuKey('user-store-noon'), 'user-role')
assert.equal(workspaceSidebarSelectionKeyForMenuKey('user-store-noon'), 'user-role')
assert.equal(storeDefinition.visibleInSidebar, false)
assert.equal(storeDefinition.visibleInWorkspaceTabs, false)
