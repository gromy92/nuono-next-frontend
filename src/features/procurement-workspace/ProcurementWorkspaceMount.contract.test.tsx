import { strict as assert } from 'node:assert'
import { workspaceMenuDefinition, workspaceMenuMount } from '../route-catalog/RouteCatalog'
import { initialProcurementTab } from './ProcurementWorkspace'

assert.equal(initialProcurementTab(), 'replenishment-plan')
assert.equal(workspaceMenuDefinition('purchase-order').path, '/purchase/order')
assert.strictEqual(
  workspaceMenuMount('purchase-order'),
  workspaceMenuDefinition('purchase-order').workspaceMount
)

const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { search: '?tab=purchase-orders' } }
})
try {
  assert.equal(initialProcurementTab(), 'purchase-orders')
} finally {
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
