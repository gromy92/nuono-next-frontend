import { strict as assert } from 'node:assert'
import type { ReactElement } from 'react'
import type { AuthSession } from '../auth/session'
import { ProcurementRequirementConfirmationPage } from '../procurement-confirmation/ProcurementRequirementConfirmationPage'
import { PurchaseOrderPage } from './PurchaseOrderPage'
import { PurchaseOrderWorkspaceMount } from './PurchaseOrderWorkspaceMount'

const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
const location = { pathname: '/purchase/order/requirement-confirmation/list' }
const session: AuthSession = {
  userId: 307,
  accountNo: 'purchase-order-workspace',
  bindingStatus: 'BOUND'
}

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location }
})

try {
  const confirmation = PurchaseOrderWorkspaceMount({
    active: true,
    session
  }) as ReactElement
  assert.strictEqual(confirmation.type, ProcurementRequirementConfirmationPage)

  location.pathname = '/purchase/order'
  const purchaseOrder = PurchaseOrderWorkspaceMount({
    active: true,
    session
  }) as ReactElement
  assert.strictEqual(purchaseOrder.type, PurchaseOrderPage)
} finally {
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
