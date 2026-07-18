import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuthSession } from '../auth/session'
import {
  ALL_WORKSPACE_MENU_KEYS,
  BOSS_OPERATOR_MENU_KEYS,
  MANAGEMENT_MENU_KEYS,
  WORKSPACE_GRANTED_MENU_RULES,
  WORKSPACE_MENU_DEFINITIONS,
  WORKSPACE_SECTION_DEFINITIONS,
  assertRouteCatalogIntegrity,
  routeCatalogIntegrityIssues,
  workspaceMenuDefinition
} from './RouteCatalog'
import {
  matchGrantedMenuToWorkspaceMenuKeys,
  resolveSessionAllowedMenuKeys,
  resolveSessionLandingMenuKey
} from './sessionAccessPolicy'
import { resolveWorkspaceMenuKeyFromLocation } from './routePaths'

const EXPECTED_MENU_KEYS = [
  'product-manage',
  'product-groups',
  'product-specs',
  'product-image-profile',
  'product-image-match',
  'product-manual-selection',
  'purchase-ali1688-collection',
  'purchase-ali1688-historical-orders',
  'purchase-ali1688-sku-purchase-history',
  'purchase-listing',
  'purchase-order',
  'purchase-profit',
  'purchase-logistics-quote',
  'purchase-product-logistics-costs',
  'purchase-in-transit-goods',
  'warehouse-shipping-order',
  'warehouse-logistics-bill',
  'warehouse-dispatch',
  'official-warehouse',
  'operations-competitor-analysis',
  'operations-skin-management',
  'operations-noon-ads',
  'operations-product-keywords',
  'data-sales-analysis',
  'data-order-analysis',
  'noon-call-store-data',
  'system-report-noon-data-completeness',
  'system-report-noon-data-gaps',
  'operations-config-versions',
  'data-activity-config',
  'operations-lifecycle-rules',
  'system-file-management',
  'user-account',
  'user-store-noon',
  'user-role',
  'system-menu',
  'system-role'
] as const

const EXPECTED_SECTION_MENU_KEYS = {
  home: [],
  product: [
    'product-manage',
    'product-groups',
    'product-specs',
    'product-image-profile',
    'product-image-match',
    'product-manual-selection'
  ],
  purchase: [
    'purchase-listing',
    'purchase-profit',
    'purchase-ali1688-historical-orders',
    'purchase-ali1688-sku-purchase-history',
    'purchase-ali1688-collection',
    'purchase-order',
    'purchase-in-transit-goods'
  ],
  logistics: ['purchase-logistics-quote', 'purchase-product-logistics-costs'],
  warehouse: ['warehouse-logistics-bill', 'warehouse-dispatch', 'official-warehouse'],
  operations: [
    'operations-competitor-analysis',
    'operations-skin-management',
    'operations-noon-ads',
    'operations-product-keywords'
  ],
  'operation-config': [
    'operations-config-versions',
    'data-activity-config',
    'operations-lifecycle-rules'
  ],
  data: ['data-sales-analysis', 'data-order-analysis'],
  'system-reports': [
    'noon-call-store-data',
    'system-report-noon-data-completeness',
    'system-report-noon-data-gaps'
  ],
  user: ['user-account', 'user-role'],
  system: ['system-menu', 'system-file-management', 'system-role']
}

function sectionMenuKeys(sectionKey: string) {
  const section = WORKSPACE_SECTION_DEFINITIONS.find((candidate) => candidate.key === sectionKey)
  return section?.entries?.flatMap((entry) => (entry.type === 'workspace' ? [entry.key] : [])) ?? []
}

function session(overrides: Partial<AuthSession>): AuthSession {
  return {
    userId: 307,
    accountNo: 'operator',
    bindingStatus: 'BOUND',
    ...overrides
  }
}

function assertDeepFrozen(value: unknown, path: string) {
  if (!value || typeof value !== 'object') {
    return
  }
  assert.equal(Object.isFrozen(value), true, `${path} must be frozen`)
  Object.entries(value).forEach(([key, child]) => assertDeepFrozen(child, `${path}.${key}`))
}

assert.deepEqual(ALL_WORKSPACE_MENU_KEYS, EXPECTED_MENU_KEYS)
assert.equal(Object.keys(WORKSPACE_MENU_DEFINITIONS).length, 37)
assert.equal(WORKSPACE_SECTION_DEFINITIONS.length, 11)
assert.equal(WORKSPACE_GRANTED_MENU_RULES.length, 26)
assert.deepEqual(routeCatalogIntegrityIssues(), [])
assert.doesNotThrow(assertRouteCatalogIntegrity)
assertDeepFrozen(ALL_WORKSPACE_MENU_KEYS, 'ALL_WORKSPACE_MENU_KEYS')
assertDeepFrozen(BOSS_OPERATOR_MENU_KEYS, 'BOSS_OPERATOR_MENU_KEYS')
assertDeepFrozen(MANAGEMENT_MENU_KEYS, 'MANAGEMENT_MENU_KEYS')
assertDeepFrozen(WORKSPACE_MENU_DEFINITIONS, 'WORKSPACE_MENU_DEFINITIONS')
assertDeepFrozen(WORKSPACE_SECTION_DEFINITIONS, 'WORKSPACE_SECTION_DEFINITIONS')
assertDeepFrozen(WORKSPACE_GRANTED_MENU_RULES, 'WORKSPACE_GRANTED_MENU_RULES')
assert.throws(() => {
  ;(workspaceMenuDefinition('official-warehouse').routeAliases as string[]).push('/mutated')
}, TypeError)
assert.throws(() => {
  ;(WORKSPACE_GRANTED_MENU_RULES[0].keys as string[]).push('mutated')
}, TypeError)
assert.throws(() => {
  ;(WORKSPACE_SECTION_DEFINITIONS[1].entries as unknown[]).push({ type: 'workspace', key: 'mutated' })
}, TypeError)

assert.deepEqual(
  WORKSPACE_SECTION_DEFINITIONS.map((section) => section.key),
  Object.keys(EXPECTED_SECTION_MENU_KEYS)
)
for (const [sectionKey, expectedKeys] of Object.entries(EXPECTED_SECTION_MENU_KEYS)) {
  assert.deepEqual(sectionMenuKeys(sectionKey), expectedKeys)
}
assert.equal('entries' in WORKSPACE_SECTION_DEFINITIONS[0], false)

assert.deepEqual(workspaceMenuDefinition('official-warehouse').routeAliases, [
  '/warehouse/fbn',
  '/storage/warehouse',
  '/warehouse/official-warehouse-stock'
])
assert.equal(resolveWorkspaceMenuKeyFromLocation('/WAREHOUSE/FBN/'), 'official-warehouse')
assert.equal(resolveWorkspaceMenuKeyFromLocation('/system/ai-file-parse/jobs/1'), 'system-file-management')
assert.equal(resolveWorkspaceMenuKeyFromLocation('/operation-config/holiday'), 'data-activity-config')
assert.equal(resolveWorkspaceMenuKeyFromLocation('/unknown'), null)

assert.deepEqual(
  matchGrantedMenuToWorkspaceMenuKeys({ menuId: 1, menuName: '', urlPath: '/api/product-keywords/items' }),
  ['operations-product-keywords']
)
const warehouseKeys = [
  'product-specs',
  'warehouse-shipping-order',
  'warehouse-logistics-bill',
  'warehouse-dispatch',
  'official-warehouse'
]
assert.deepEqual(
  resolveSessionAllowedMenuKeys(
    session({ grantedMenus: [{ menuId: 2, menuName: '仓库发运', urlPath: '/warehouse/dispatch' }] })
  ),
  warehouseKeys
)

const bossManagementKeys = resolveSessionAllowedMenuKeys(
  session({ level: 1, roleName: '老板', activeRoleView: 'boss', grantedMenus: [] })
)
assert.deepEqual(bossManagementKeys, ['user-store-noon', 'user-role'])
assert.deepEqual(
  resolveSessionAllowedMenuKeys(
    session({ level: 1, roleName: '老板', activeRoleView: 'operator', grantedMenus: [] })
  ),
  ALL_WORKSPACE_MENU_KEYS.filter((key) => BOSS_OPERATOR_MENU_KEYS.includes(key))
)
assert.equal(resolveSessionLandingMenuKey(null, ['purchase-order', 'product-manage'], null), 'purchase-order')
assert.equal(
  resolveSessionLandingMenuKey(session({ level: 1, roleName: '老板' }), bossManagementKeys, null),
  'user-role'
)

const registryAdapter = readFileSync(
  join(process.cwd(), 'src/features/app-shell/WorkspaceMenuRegistry.ts'),
  'utf8'
)
const routingAdapter = readFileSync(
  join(process.cwd(), 'src/features/app-shell/WorkspaceRouting.ts'),
  'utf8'
)
for (const adapter of [registryAdapter, routingAdapter]) {
  assert.doesNotMatch(adapter, /\/purchase\/order|WORKSPACE_MENU_DEFINITIONS\s*=|WORKSPACE_GRANTED_MENU_RULES\s*=/)
  assert.ok(adapter.split('\n').length <= 300)
}
