import { ProcurementAutoCheckPanel } from './ProcurementAutoCheckPanel'
import { ProcurementAutoInquiryResultCard } from './ProcurementAutoInquiryResultCard'
import { ProcurementCandidateReviewPanel } from './ProcurementCandidateReviewPanel'
import { ProcurementComparisonHeader } from './ProcurementComparisonHeader'
import { ProcurementDecisionSummary } from './ProcurementDecisionSummary'
import { ProcurementInquirySheetPanel } from './ProcurementInquirySheetPanel'
import { ProcurementStructuredComparison } from './ProcurementStructuredComparison'

export function ProcurementComparisonPanel({ model }: { model: any }) {
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
  if (!comparingProcurementCandidate || !procurementCompareSummary) {
    return null
  }
  return (
    <div style={{ padding: 16, borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <ProcurementComparisonHeader model={model} />
      <ProcurementStructuredComparison model={model} />
      <ProcurementDecisionSummary model={model} />
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
