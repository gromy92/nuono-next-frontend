import type { AuthSession } from '../auth/session'
import { OperationsSkinWorkbench } from './components/OperationsSkinWorkbench'
import './OperationsSkinManagementPage.css'

export function OperationsSkinManagementPage({ session }: { session: AuthSession }) {
  return <OperationsSkinWorkbench session={session} />
}
