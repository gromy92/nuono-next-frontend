import { strict as assert } from 'node:assert'
import { WORKSPACE_MENU_DEFINITIONS } from '../route-catalog/RouteCatalog'
import { renderLegacyWorkspaceContent } from './LegacyWorkspaceContent'
import type { ShellWorkspaceRenderContext } from './ShellWorkspaceContent.types'

const context = {
  shellSession: {
    userId: 307,
    accountNo: 'contract-user',
    bindingStatus: 'BOUND'
  },
  onOpenInTransitBoxDetailTab: () => undefined,
  onCloseInTransitBoxDetailTab: () => undefined,
  inTransitBoxDetailTabRequest: null,
  isInTransitBoxDetailTab: false,
  roleManagementTabKey: 'user-role',
  canShowStoreManagement: false,
  roleManagementRefreshSignal: 0,
  storeSyncState: {},
  canSelectStoreOwner: false,
  canManageStoreBinding: false,
  onRoleManagementTabChange: () => undefined,
  onStoreOwnerChange: () => undefined,
  onStoreRefresh: () => undefined,
  onRoleManagementDataChanged: () => undefined
} as unknown as ShellWorkspaceRenderContext

const legacyDefinitions = Object.values(WORKSPACE_MENU_DEFINITIONS).filter(
  (definition) => typeof definition.contentKind === 'string'
)
assert.equal(legacyDefinitions.length, 3)
for (const definition of legacyDefinitions) {
  assert.doesNotThrow(
    () => renderLegacyWorkspaceContent(definition.key, context),
    `${definition.key} must keep its compatibility renderer`
  )
}

assert.throws(
  () => renderLegacyWorkspaceContent('system-file-management', context),
  /does not declare a legacy content kind/
)
