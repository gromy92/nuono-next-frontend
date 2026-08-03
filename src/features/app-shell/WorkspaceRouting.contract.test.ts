import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { workspaceMenuItems } from './SidebarNavigation'
import {
  workspaceContentMountGroups,
  workspaceContentMountKeys
} from './ShellWorkspaceContent'
import { isWorkspaceRouteNotFound } from './useShellSessionState'
import {
  BOSS_OPERATOR_MENU_KEYS,
  WORKSPACE_MENU_DEFINITIONS,
  WORKSPACE_SECTION_DEFINITIONS,
  workspaceMenuMount,
  workspaceMenuPath
} from '../route-catalog/RouteCatalog'
import {
  OPERATIONS_PRODUCT_KEYWORDS_PATH,
  resolveWorkspaceMenuKeyFromLocation
} from '../route-catalog/routePaths'
import { withCurrentWorkspaceDevQuery } from '../route-catalog/workspaceDevQuery'

assert.equal(workspaceMenuPath('official-warehouse'), '/warehouse/official-warehouse')
assert.equal(typeof workspaceMenuMount('official-warehouse'), 'function')
assert.equal(OPERATIONS_PRODUCT_KEYWORDS_PATH, '/operations/product-keywords')
assert.equal(workspaceMenuPath('operations-product-keywords'), OPERATIONS_PRODUCT_KEYWORDS_PATH)
assert.equal(typeof workspaceMenuMount('operations-product-keywords'), 'function')
assert.equal(existsSync(join(process.cwd(), 'public/favicon.png')), true)

const mountedGroups = workspaceContentMountGroups(
  'product-manage',
  ['official-warehouse']
)
assert.equal(mountedGroups.length, 2)
assert.deepEqual(
  mountedGroups.map((group) => ({
    active: group.active,
    menuKey: group.menuKey
  })),
  [
    { active: false, menuKey: 'official-warehouse' },
    { active: true, menuKey: 'product-manage' }
  ],
  'opened panes must stay mounted while exactly one route is active'
)
assert.equal(
  existsSync(join(process.cwd(), 'src/features/app-shell/LegacyOperationsWorkspaceContent.tsx')),
  false,
  'operations and report routes must not retain a second Legacy renderer registry'
)
assert.equal(
  existsSync(join(process.cwd(), 'src/features/app-shell/LegacyWorkspaceContent.tsx')),
  false,
  'all routes must use catalog-owned mount Adapters'
)
assert.deepEqual(
  workspaceContentMountKeys('user-store-noon', ['user-role']),
  ['user-role'],
  'workspace content should mount one pane for menu aliases that share a top tab'
)
assert.deepEqual(workspaceContentMountKeys('official-warehouse', []), ['official-warehouse'])
assert.deepEqual(
  workspaceContentMountKeys('product-manage', ['official-warehouse']),
  ['official-warehouse', 'product-manage'],
  'an opened workspace pane must stay mounted while another tab is active'
)
assert.deepEqual(
  workspaceContentMountGroups(
    'warehouse-dispatch',
    ['product-specs', 'warehouse-dispatch'],
    new Set(['warehouse-dispatch'])
  ).map((group) => group.menuKey),
  ['warehouse-dispatch'],
  'a stale unauthorized pane must be removed before render instead of waiting for an effect'
)
assert.deepEqual(WORKSPACE_MENU_DEFINITIONS['official-warehouse'].routeAliases, [
  '/warehouse/fbn',
  '/storage/warehouse',
  '/warehouse/official-warehouse-stock'
])

const registeredMenuKeys = Object.keys(WORKSPACE_MENU_DEFINITIONS)
assert.equal(registeredMenuKeys.includes('purchase-listing'), true)
assert.equal(registeredMenuKeys.includes('purchase-pre-order-profit'), false)
assert.equal(BOSS_OPERATOR_MENU_KEYS.map(String).includes('purchase-listing'), true)
assert.equal(BOSS_OPERATOR_MENU_KEYS.map(String).includes('purchase-pre-order-profit'), false)
assert.equal(resolveWorkspaceMenuKeyFromLocation('/purchase/listing'), 'purchase-listing')
assert.equal(resolveWorkspaceMenuKeyFromLocation('/purchase/pre-order-profit'), null)
assert.equal(isWorkspaceRouteNotFound('/unknown-workspace'), true)
assert.equal(isWorkspaceRouteNotFound('/product/manage'), false)
assert.equal(isWorkspaceRouteNotFound('/purchase/order/requirement-confirmation/detail/PR-1'), false)
assert.equal(isWorkspaceRouteNotFound('/login'), false)
assert.equal(isWorkspaceRouteNotFound('/login/register'), false)
assert.equal(isWorkspaceRouteNotFound('/login-invalid'), true)
assert.equal(isWorkspaceRouteNotFound('/'), false)
assert.equal(
  existsSync(join(process.cwd(), 'src/features/app-shell/LegacyCommerceWorkspaceContent.tsx')),
  false,
  'commerce routes must not retain a Legacy renderer registry'
)
assert.equal(
  existsSync(join(process.cwd(), 'src/features/app-shell/ShellWorkspaceLazyComponents.tsx')),
  false,
  'route-owned mount Adapters replace the former global lazy component registry'
)

const warehouseSection = WORKSPACE_SECTION_DEFINITIONS.find((section) => section.key === 'warehouse')
const warehouseMenuKeys = warehouseSection?.entries?.flatMap((entry) => (entry.type === 'workspace' ? [entry.key] : [])) ?? []

assert.deepEqual(
  warehouseMenuKeys.filter((key) => key === 'official-warehouse'),
  ['official-warehouse']
)

const purchaseSidebarMenu = workspaceMenuItems.find((section) => section.key === 'purchase')
const purchaseSidebarLabels = purchaseSidebarMenu?.children?.map((item) => item.label) ?? []
assert.equal(purchaseSidebarLabels.includes('商品上架'), true)
assert.equal(purchaseSidebarLabels.includes('选品池'), false)

const deprecatedPlaceholderLabels = WORKSPACE_SECTION_DEFINITIONS.flatMap((section) =>
  section.entries?.flatMap((entry) => (entry.type === 'placeholder' ? [entry.label] : [])) ?? []
)
assert.deepEqual(deprecatedPlaceholderLabels, [])

const purchaseSection = WORKSPACE_SECTION_DEFINITIONS.find((section) => section.key === 'purchase')
const purchaseMenuKeys: string[] =
  purchaseSection?.entries?.flatMap((entry) => (entry.type === 'workspace' ? [entry.key] : [])) ?? []
assert.equal(
  purchaseMenuKeys.includes('purchase-listing'),
  true,
  '商品上架 should be exposed under the purchase sidebar menu'
)
assert.equal(
  purchaseMenuKeys.includes('purchase-pre-order-profit'),
  false,
  '选品池 should not be exposed under the purchase sidebar menu'
)

const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
let storedSession: string | null = null
const windowLocation = {
  pathname: '/warehouse/official-warehouse-stock',
  search: '?devSession=1'
}
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: windowLocation,
    localStorage: {
      getItem: () => storedSession,
      setItem: (_key: string, value: string) => {
        storedSession = value
      },
      removeItem: () => {
        storedSession = null
      }
    }
  }
})
try {
  assert.equal(
    withCurrentWorkspaceDevQuery('/warehouse/official-warehouse'),
    '/warehouse/official-warehouse?devSession=1&officialWarehouseTab=stock'
  )

  storedSession = JSON.stringify({
    currentStore: {
      projectName: 'canman',
      storeCode: 'STR108065-NSA',
      site: 'SA'
    }
  })
  windowLocation.pathname = '/product/manual-selection'
  windowLocation.search = '?devSession=1&devOwner=307&devAccount=xingyao&devStore=STR245027-NSA&devSite=SA'

  const target = withCurrentWorkspaceDevQuery('/purchase/listing?listingSource=manual-selection')
  const [, searchText] = target.split('?')
  const params = new URLSearchParams(searchText)
  assert.equal(params.get('listingSource'), 'manual-selection')
  assert.equal(params.get('devOwner'), '307')
  assert.equal(params.get('devAccount'), 'canman')
  assert.equal(params.get('devStore'), 'STR108065-NSA')
  assert.equal(params.get('devSite'), 'SA')
} finally {
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
