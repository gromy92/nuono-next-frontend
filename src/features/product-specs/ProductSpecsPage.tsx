import type { AuthSession } from '../auth/session'
import { ProductSpecsWorkbench } from './components/ProductSpecsWorkbench'

export function ProductSpecsPage({
  session,
  activeOwnerId
}: {
  session: AuthSession
  activeOwnerId?: number
}) {
  return <ProductSpecsWorkbench session={session} activeOwnerId={activeOwnerId} />
}
