import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))

function read(relativePath: string) {
  return readFileSync(join(featureDir, relativePath), 'utf8')
}

export const officialWarehousePageContractSource = [
  read('officialWarehouseCandidatePresentation.ts'),
  read('officialWarehouseAsnPresentation.tsx'),
  read('officialWarehouseFormModel.ts'),
  read('hooks/useOfficialWarehouseBatchSummary.ts'),
  read('hooks/useOfficialWarehouseCreateAsn.ts'),
  read('hooks/useOfficialWarehouseSpecEditor.ts'),
  read('hooks/useOfficialWarehouseAppointmentForm.ts'),
  read('hooks/useOfficialWarehouseAppointmentWorkflow.ts'),
  read('hooks/useOfficialWarehouseAppointmentActions.ts'),
  read('hooks/useOfficialWarehouseAppointmentHistory.ts'),
  read('hooks/useOfficialWarehouseAsnState.ts'),
  read('columns/officialWarehouseAsnColumns.tsx'),
  read('columns/officialWarehouseAppointmentColumns.tsx'),
  read('columns/officialWarehouseCandidateColumns.tsx'),
  read('columns/officialWarehouseInboundColumns.tsx'),
  read('components/OfficialWarehouseListPanel.tsx'),
  read('components/OfficialWarehouseBatchSummaryPanel.tsx'),
  read('components/OfficialWarehouseShippingBatchPicker.tsx'),
  read('components/OfficialWarehouseCreateAsnModals.tsx'),
  read('components/OfficialWarehouseAppointmentModal.tsx'),
  read('components/OfficialWarehouseCorrectionModal.tsx'),
  read('components/OfficialWarehouseDetailDrawer.tsx'),
  read('OfficialWarehousePage.tsx')
].join('\n')

export const officialWarehouseApiContractSource = [
  read('api.ts'),
  read('officialWarehouseApiClient.ts'),
  read('officialWarehouseAppointmentTypes.ts'),
  read('officialWarehouseBatchSummaryTypes.ts')
].join('\n')

export const officialWarehousePageStyleContractSource = [
  read('OfficialWarehouseLayout.css'),
  read('OfficialWarehouseInbound.css'),
  read('OfficialWarehouseBatchSummary.css'),
  read('OfficialWarehouseForms.css'),
  read('OfficialWarehouseResponsive.css')
].join('')
