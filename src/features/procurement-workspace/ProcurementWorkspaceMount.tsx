import { currentAppPathname } from '../../runtimePaths'
import { ProcurementRequirementConfirmationPage } from '../procurement-confirmation/ProcurementRequirementConfirmationPage'
import { isProcurementRequirementConfirmationPath } from '../procurement-confirmation/route'
import type { WorkspaceMountProps } from '../route-catalog/workspaceMount'
import { ProcurementWorkspace } from './ProcurementWorkspace'

export function ProcurementWorkspaceMount({ session }: WorkspaceMountProps) {
  if (isProcurementRequirementConfirmationPath(currentAppPathname())) {
    return <ProcurementRequirementConfirmationPage embedded session={session} />
  }
  return <ProcurementWorkspace session={session} />
}
