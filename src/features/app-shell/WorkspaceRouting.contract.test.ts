import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { workspaceMenuItems } from './SidebarNavigation'
import { workspaceContentMountKeys } from './ShellWorkspaceContent'
import {
  BOSS_OPERATOR_MENU_KEYS,
  WORKSPACE_MENU_DEFINITIONS,
  WORKSPACE_SECTION_DEFINITIONS,
  workspaceMenuContentKind,
  workspaceMenuPath
} from './WorkspaceMenuRegistry'
import {
  OPERATIONS_PRODUCT_KEYWORDS_PATH,
  resolveWorkspaceMenuKeyFromLocation,
  withCurrentWorkspaceDevQuery
} from './WorkspaceRouting'

assert.equal(workspaceMenuPath('official-warehouse'), '/warehouse/official-warehouse')
assert.equal(workspaceMenuContentKind('official-warehouse'), 'official-warehouse')
assert.equal(OPERATIONS_PRODUCT_KEYWORDS_PATH, '/operations/product-keywords')
assert.equal(workspaceMenuPath('operations-product-keywords'), OPERATIONS_PRODUCT_KEYWORDS_PATH)
assert.equal(workspaceMenuContentKind('operations-product-keywords'), 'product-keywords')
assert.equal(fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8').includes('<title>诺诺管家</title>'), true)
assert.equal(
  fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8').includes('href="%BASE_URL%favicon.png"'),
  true
)
assert.equal(fs.existsSync(path.join(process.cwd(), 'public/favicon.png')), true)
assert.equal(
  fs.readFileSync(path.join(process.cwd(), 'src/features/app-shell/ShellSidebar.tsx'), 'utf8').includes('/logo-title.png'),
  false
)

const shellFrameSource = fs.readFileSync(path.join(process.cwd(), 'src/features/app-shell/ShellFrame.tsx'), 'utf8')
const shellWorkspaceContentSource = fs.readFileSync(
  path.join(process.cwd(), 'src/features/app-shell/ShellWorkspaceContent.tsx'),
  'utf8'
)
const shellWorkspaceNavigationSource = fs.readFileSync(
  path.join(process.cwd(), 'src/features/app-shell/useShellWorkspaceNavigation.tsx'),
  'utf8'
)

assert.equal(
  shellWorkspaceNavigationSource.includes('openedWorkspaceTabKeys,'),
  true,
  'workspace navigation must expose opened tab keys so content panes can remain mounted'
)
assert.equal(
  shellFrameSource.includes('openedWorkspaceTabKeys={openedWorkspaceTabKeys}'),
  true,
  'shell frame must pass opened tab keys into the workspace content layer'
)
assert.equal(
  shellWorkspaceContentSource.includes('nuono-shell-workspace-pane-hidden'),
  true,
  'workspace content must hide inactive opened panes instead of unmounting them'
)
assert.deepEqual(
  workspaceContentMountKeys('user-store-noon', ['user-role']),
  ['user-role'],
  'workspace content should mount one pane for menu aliases that share a top tab'
)
assert.deepEqual(WORKSPACE_MENU_DEFINITIONS['official-warehouse'].routeAliases, [
  '/warehouse/fbn',
  '/storage/warehouse',
  '/warehouse/official-warehouse-stock'
])

const registeredMenuKeys = Object.keys(WORKSPACE_MENU_DEFINITIONS)
assert.equal(registeredMenuKeys.includes('purchase-listing'), false)
assert.equal(registeredMenuKeys.includes('purchase-pre-order-profit'), false)
assert.equal(BOSS_OPERATOR_MENU_KEYS.map(String).includes('purchase-listing'), false)
assert.equal(BOSS_OPERATOR_MENU_KEYS.map(String).includes('purchase-pre-order-profit'), false)
assert.equal(resolveWorkspaceMenuKeyFromLocation('/purchase/listing'), null)
assert.equal(resolveWorkspaceMenuKeyFromLocation('/purchase/pre-order-profit'), null)
assert.equal(shellWorkspaceContentSource.includes('ProductListingPage'), false)
assert.equal(shellWorkspaceContentSource.includes('PreOrderProfitPage'), false)
assert.equal(
  fs.readFileSync(path.join(process.cwd(), 'src/features/app-shell/ShellWorkspaceLazyComponents.tsx'), 'utf8').includes(
    '../pre-order-profit/'
  ),
  false
)
assert.equal(
  fs.readFileSync(path.join(process.cwd(), 'src/features/app-shell/ShellWorkspaceLazyComponents.tsx'), 'utf8').includes(
    '../product-listing/'
  ),
  false
)

const warehouseSection = WORKSPACE_SECTION_DEFINITIONS.find((section) => section.key === 'warehouse')
const warehouseMenuKeys = warehouseSection?.entries?.flatMap((entry) => (entry.type === 'workspace' ? [entry.key] : [])) ?? []

assert.deepEqual(
  warehouseMenuKeys.filter((key) => key === 'official-warehouse'),
  ['official-warehouse']
)

const purchaseSidebarMenu = workspaceMenuItems.find((section) => section.key === 'purchase')
const purchaseSidebarLabels = purchaseSidebarMenu?.children?.map((item) => item.label) ?? []
assert.equal(purchaseSidebarLabels.includes('商品上架'), false)
assert.equal(purchaseSidebarLabels.includes('选品池'), false)

const deprecatedPlaceholderLabels = WORKSPACE_SECTION_DEFINITIONS.flatMap((section) =>
  section.entries?.flatMap((entry) => (entry.type === 'placeholder' ? [entry.label] : [])) ?? []
)
assert.deepEqual(deprecatedPlaceholderLabels, [])

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
