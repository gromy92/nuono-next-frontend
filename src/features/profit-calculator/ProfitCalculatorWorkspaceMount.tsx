import type { WorkspaceMountProps } from '../route-catalog/workspaceMount'
import { useProfitCalculatorWorkspace } from './useProfitCalculatorWorkspace'

export function ProfitCalculatorWorkspaceMount({ active, session }: WorkspaceMountProps) {
  const { profitBoard } = useProfitCalculatorWorkspace(
    () => undefined,
    session,
    { enabled: active }
  )
  return profitBoard
}
