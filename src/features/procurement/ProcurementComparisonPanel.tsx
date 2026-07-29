import { ProcurementAutoCheckPanel } from './ProcurementAutoCheckPanel'
import { ProcurementAutoInquiryResultCard } from './ProcurementAutoInquiryResultCard'
import { ProcurementCandidateReviewPanel } from './ProcurementCandidateReviewPanel'
import { ProcurementComparisonHeader } from './ProcurementComparisonHeader'
import { ProcurementDecisionSummary } from './ProcurementDecisionSummary'
import { ProcurementInquirySheetPanel } from './ProcurementInquirySheetPanel'
import { ProcurementStructuredComparison } from './ProcurementStructuredComparison'
import type { ProcurementWorkspaceModel } from './ProcurementWorkspace'

export type ProcurementComparisonModel = ProcurementWorkspaceModel['decision']['comparison']
export type ProcurementComparisonContext = {
  selectedProcurementItem: NonNullable<ProcurementComparisonModel['selectedProcurementItem']>
  comparingProcurementCandidate: NonNullable<ProcurementComparisonModel['comparingProcurementCandidate']>
  procurementCompareSummary: NonNullable<ProcurementComparisonModel['procurementCompareSummary']>
}

export function ProcurementComparisonPanel({ model }: { model: ProcurementComparisonModel }) {
  const {
    selectedProcurementItem,
    comparingProcurementCandidate,
    procurementCompareSummary,
    procurementInquirySheet,
    procurementCandidateGroupFilterKey,
    setProcurementCandidateGroupFilterKey,
    copyCurrentProcurementInquiry,
    currentProcurementAutoInquiryBusinessState,
    currentProcurementAutoInquiryBusinessMeta,
    currentProcurementAutoInquiryBusinessAction,
    nextProcurementAutoInquiryCandidate,
    startProcurementCandidateAutoInquiry,
    loadProcurementCandidateAutoInquiry,
    setProcurementComparingCandidateId,
    procurementReviewForm,
    procurementSavingReview,
    saveProcurementCandidateReview
  } = model
  if (!selectedProcurementItem || !comparingProcurementCandidate || !procurementCompareSummary) {
    return null
  }
  const context: ProcurementComparisonContext = {
    selectedProcurementItem,
    comparingProcurementCandidate,
    procurementCompareSummary
  }
  return (
    <div style={{ padding: 16, borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <ProcurementComparisonHeader context={context} model={model.header} />
      <ProcurementStructuredComparison
        item={selectedProcurementItem}
        candidate={comparingProcurementCandidate}
      />
      <ProcurementDecisionSummary
        summary={procurementCompareSummary}
        candidate={comparingProcurementCandidate}
      />
      {procurementInquirySheet ? (
        <ProcurementInquirySheetPanel
          sheet={procurementInquirySheet}
          activeGroupFilterKey={procurementCandidateGroupFilterKey}
          onGroupFilterChange={setProcurementCandidateGroupFilterKey}
          onCopyInquiry={copyCurrentProcurementInquiry}
        />
      ) : null}
      <ProcurementAutoInquiryResultCard
        starting={currentProcurementAutoInquiryBusinessState?.status === 'loading'}
        businessMeta={currentProcurementAutoInquiryBusinessMeta}
        businessAction={currentProcurementAutoInquiryBusinessAction}
        nextCandidate={nextProcurementAutoInquiryCandidate}
        onStart={() => startProcurementCandidateAutoInquiry(selectedProcurementItem, comparingProcurementCandidate)}
        onRefresh={() => loadProcurementCandidateAutoInquiry(selectedProcurementItem, comparingProcurementCandidate)}
        onSwitchCandidate={setProcurementComparingCandidateId}
      />
      <ProcurementAutoCheckPanel structuredChecks={procurementCompareSummary.structuredChecks} candidate={comparingProcurementCandidate} />
      <ProcurementCandidateReviewPanel
        form={procurementReviewForm}
        candidate={comparingProcurementCandidate}
        scoreCards={procurementCompareSummary.scoreCards}
        rows={procurementCompareSummary.rows}
        saving={procurementSavingReview}
        onSave={saveProcurementCandidateReview}
      />
    </div>
  )
}
