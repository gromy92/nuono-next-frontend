import { strict as assert } from 'node:assert'
import {
  ADMINISTRATION_IDENTITY_GRANT_RULES,
  ADMINISTRATION_ROUTE_DEFINITIONS,
  FILE_MANAGEMENT_GRANT_RULES
} from './administrationRoutes'
import { DATA_REPORT_GRANT_RULES, DATA_REPORT_ROUTE_DEFINITIONS } from './dataReportRoutes'
import { FULFILLMENT_GRANT_RULES, FULFILLMENT_ROUTE_DEFINITIONS } from './fulfillmentRoutes'
import {
  OPERATION_CONFIG_GRANT_RULES,
  OPERATION_CONFIG_ROUTE_DEFINITIONS,
  OPERATIONS_GRANT_RULES,
  OPERATIONS_ROUTE_DEFINITIONS
} from './operationsRoutes'
import { PROCUREMENT_GRANT_RULES, PROCUREMENT_ROUTE_DEFINITIONS } from './procurementRoutes'
import { PRODUCT_GRANT_RULES, PRODUCT_ROUTE_DEFINITIONS } from './productRoutes'
import { WORKSPACE_SECTION_METADATA } from './sectionCatalog'

function assertDeepFrozen(value: unknown, path: string) {
  if (!value || typeof value !== 'object') {
    return
  }
  assert.equal(Object.isFrozen(value), true, `${path} must be frozen`)
  Object.entries(value).forEach(([key, child]) => assertDeepFrozen(child, `${path}.${key}`))
}

const routeDefinitionFragments = [
  PRODUCT_ROUTE_DEFINITIONS,
  PROCUREMENT_ROUTE_DEFINITIONS,
  FULFILLMENT_ROUTE_DEFINITIONS,
  OPERATIONS_ROUTE_DEFINITIONS,
  OPERATION_CONFIG_ROUTE_DEFINITIONS,
  DATA_REPORT_ROUTE_DEFINITIONS,
  ADMINISTRATION_ROUTE_DEFINITIONS
]
const grantRuleFragments = [
  ADMINISTRATION_IDENTITY_GRANT_RULES,
  PRODUCT_GRANT_RULES,
  PROCUREMENT_GRANT_RULES,
  FULFILLMENT_GRANT_RULES,
  OPERATIONS_GRANT_RULES,
  DATA_REPORT_GRANT_RULES,
  OPERATION_CONFIG_GRANT_RULES,
  FILE_MANAGEMENT_GRANT_RULES
]

routeDefinitionFragments.forEach((fragment, index) => {
  assertDeepFrozen(fragment, `routeDefinitionFragments[${index}]`)
})
grantRuleFragments.forEach((fragment, index) => {
  assertDeepFrozen(fragment, `grantRuleFragments[${index}]`)
})
assertDeepFrozen(WORKSPACE_SECTION_METADATA, 'WORKSPACE_SECTION_METADATA')

if (false) {
  // @ts-expect-error Route definition fragments expose readonly metadata.
  PRODUCT_ROUTE_DEFINITIONS['product-manage'].label = 'mutated'
  // @ts-expect-error Grant-rule fragments expose readonly nested arrays.
  PRODUCT_GRANT_RULES[0].keys.push('product-manage')
  // @ts-expect-error Section fragments expose readonly metadata.
  WORKSPACE_SECTION_METADATA[0].label = 'mutated'
}

assert.throws(() => {
  const definition = PRODUCT_ROUTE_DEFINITIONS['product-manage'] as unknown as { label: string }
  definition.label = 'mutated'
}, TypeError)
assert.throws(() => {
  const keys = PRODUCT_GRANT_RULES[0].keys as unknown as string[]
  keys.push('mutated')
}, TypeError)
assert.throws(() => {
  const section = WORKSPACE_SECTION_METADATA[0] as unknown as { label: string }
  section.label = 'mutated'
}, TypeError)
