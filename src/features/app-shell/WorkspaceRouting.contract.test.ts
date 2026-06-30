import { strict as assert } from 'node:assert'
import {
  WORKSPACE_MENU_DEFINITIONS,
  WORKSPACE_SECTION_DEFINITIONS,
  shouldShowWorkspaceMenuInSidebar,
  shouldShowWorkspaceMenuInTabs,
  workspaceMenuContentKind,
  workspaceMenuPath
} from './WorkspaceMenuRegistry'
import { withCurrentWorkspaceDevQuery } from './WorkspaceRouting'

assert.equal(workspaceMenuPath('official-warehouse'), '/warehouse/official-warehouse')
assert.equal(workspaceMenuContentKind('official-warehouse'), 'official-warehouse')
assert.deepEqual(WORKSPACE_MENU_DEFINITIONS['official-warehouse'].routeAliases, [
  '/warehouse/fbn',
  '/storage/warehouse',
  '/warehouse/official-warehouse-stock'
])

const warehouseSection = WORKSPACE_SECTION_DEFINITIONS.find((section) => section.key === 'warehouse')
const warehouseMenuKeys = warehouseSection?.entries?.flatMap((entry) => (entry.type === 'workspace' ? [entry.key] : [])) ?? []

assert.deepEqual(
  warehouseMenuKeys.filter((key) => key === 'official-warehouse'),
  ['official-warehouse']
)

const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      pathname: '/warehouse/official-warehouse-stock',
      search: '?devSession=1'
    }
  }
})
try {
  assert.equal(
    withCurrentWorkspaceDevQuery('/warehouse/official-warehouse'),
    '/warehouse/official-warehouse?devSession=1&officialWarehouseTab=stock'
  )
} finally {
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
