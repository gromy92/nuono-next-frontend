import { OperationConfigVersionWorkbench } from './components/OperationConfigVersionWorkbench'
import type { OperationConfigVersionLibraryPageProps } from './versionLibraryTypes'
import './OperationsConfigPage.css'

export function OperationConfigVersionLibraryPage(
  props: OperationConfigVersionLibraryPageProps
) {
  return <OperationConfigVersionWorkbench {...props} />
}
