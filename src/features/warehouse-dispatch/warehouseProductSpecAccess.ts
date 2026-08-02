import type { AuthSession } from '../auth/session'
import {
  resolveSessionAllowedMenuKeys,
  sessionHasAnyBusinessCapability
} from '../route-catalog/sessionAccessPolicy'

export function canOpenProductSpecsFromWarehouse(session?: AuthSession | null) {
  const resolvedSession = session ?? null
  return (
    sessionHasAnyBusinessCapability(resolvedSession, ['PRODUCT_MASTER', 'PROCUREMENT']) &&
    resolveSessionAllowedMenuKeys(resolvedSession).includes('product-specs')
  )
}
