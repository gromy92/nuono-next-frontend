import type { ColumnsType } from 'antd/es/table'
import type { Dispatch, Key, SetStateAction } from 'react'
import type {
  OfficialWarehouseBatchProductSummary,
  OfficialWarehouseProductCandidate,
  OfficialWarehouseShippingBatchCandidate
} from '../api'
import type { OfficialWarehouseShippingBatchDiagnostic } from '../shippingBatchDiagnosticTypes'
import type { AsnProductPreflightInvalidLine } from '../asnProductPreflightFailure'
import type {
  Ali1688SpecDraft,
  CreateAsnConfirmation,
  CreateAsnSubmitFeedback
} from '../officialWarehouseFormModel'
import type { AsnCandidateSourceMode } from '../hooks/useOfficialWarehouseAsnLineSelection'

export type OfficialWarehouseCreateAsnModalsProps = {
  createOpen: boolean
  setCreateOpen: Dispatch<SetStateAction<boolean>>
  createSubmitFeedback?: CreateAsnSubmitFeedback
  preflightInvalidLines: AsnProductPreflightInvalidLine[]
  setCreateSubmitFeedback: Dispatch<SetStateAction<CreateAsnSubmitFeedback | undefined>>
  createAsnConfirmation?: CreateAsnConfirmation
  setCreateAsnConfirmation: Dispatch<SetStateAction<CreateAsnConfirmation | undefined>>
  submitCreateAsn: () => Promise<void>
  submitting: boolean
  selectedAlreadyAppointedBatches: OfficialWarehouseShippingBatchCandidate[]
  shippingBatchLoadError?: string
  shippingBatchDiagnostic?: OfficialWarehouseShippingBatchDiagnostic
  loadShippingBatches: (keyword?: string, prepareProductMatches?: boolean, forceRefresh?: boolean) => Promise<void>
  shippingBatchKeyword: string
  shippingBatchLoading: boolean
  shippingBatches: OfficialWarehouseShippingBatchCandidate[]
  selectedShippingBatchIds: string[]
  candidateMode: AsnCandidateSourceMode
  setCandidateMode: (mode: AsnCandidateSourceMode) => void
  batchSummary?: OfficialWarehouseBatchProductSummary
  batchSummaryLoading: boolean
  batchSummaryError?: string
  reloadBatchSummary: () => Promise<void>
  batchSummaryBlocked: boolean
  setSelectedShippingBatchIds: Dispatch<SetStateAction<string[]>>
  shippingBatchOptions: Array<{ label: string; value: string; disabled?: boolean }>
  handleShippingBatchSearch: (value: string) => void
  clearBatchCandidateSelection: () => void
  clearCandidateSelection: () => void
  loadCandidates: (batchIds?: string[], keywordValue?: string, mode?: AsnCandidateSourceMode) => Promise<void>
  candidateKeyword: string
  setCandidateKeyword: Dispatch<SetStateAction<string>>
  candidateLoading: boolean
  selectedCandidateKeys: Key[]; visibleSelectedCandidateKeys: Key[]
  selectedBatchCandidateKeys: string[]; selectedManualCandidateKeys: string[]
  candidateColumns: ColumnsType<OfficialWarehouseProductCandidate>
  candidates: OfficialWarehouseProductCandidate[]
  updateCandidateSelection: (keys: Key[], rows: OfficialWarehouseProductCandidate[]) => void
  candidateEmptyDescription: string
  confirmCreateAsn: () => void
  specTarget?: OfficialWarehouseProductCandidate
  setSpecTarget: Dispatch<SetStateAction<OfficialWarehouseProductCandidate | undefined>>
  saveAli1688Spec: () => Promise<void>
  specSaving: boolean
  specDraft: Ali1688SpecDraft
  setSpecDraft: Dispatch<SetStateAction<Ali1688SpecDraft>>
}
