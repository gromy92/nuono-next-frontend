import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  WORKSPACE_MENU_DEFINITIONS,
  type AppMenuKey
} from './routeDefinitions'

const knownMenuKey: AppMenuKey = 'purchase-order'
assert.equal(knownMenuKey, 'purchase-order')

if (false) {
  // @ts-expect-error AppMenuKey is the exact union derived from route definition record keys.
  const unknownMenuKey: AppMenuKey = 'not-a-route'
  assert.ok(unknownMenuKey)
}

const knownKeys = new Set(Object.keys(WORKSPACE_MENU_DEFINITIONS))
for (const [recordKey, definition] of Object.entries(WORKSPACE_MENU_DEFINITIONS)) {
  assert.equal(definition.key, recordKey)
  if (definition.tabKey) {
    assert.equal(knownKeys.has(definition.tabKey), true)
  }
}

const baseTypesSource = readFileSync(
  join(process.cwd(), 'src/features/route-catalog/types.ts'),
  'utf8'
)
const routeDefinitionsSource = readFileSync(
  join(process.cwd(), 'src/features/route-catalog/routeDefinitions.ts'),
  'utf8'
)
assert.doesNotMatch(baseTypesSource, /export type AppMenuKey/)
assert.match(routeDefinitionsSource, /type AppMenuKey = keyof typeof routeDefinitionInputs/)
