import {
  buildProcurementInquiryCopyText,
  formatProcurementPriceRange,
  procurementCandidateInquiryQuestions,
  procurementCandidateMoqText,
  procurementCandidatePriceText,
  procurementCandidateQuoteChecklist,
  procurementCandidateSampleChecklist,
  procurementDemandDisplayTitle,
  sanitizeProcurementCopy
} from './domain';
import type { ProcurementCandidate, ProcurementDemandItem } from './types';

type ProcurementCandidateGroup = NonNullable<ProcurementDemandItem['candidateGroups']>[number];

export function buildProcurementInquirySheet(
  selectedProcurementItem: ProcurementDemandItem | undefined,
  comparingProcurementCandidate: ProcurementCandidate | undefined,
  selectedProcurementCandidateGroups: ProcurementCandidateGroup[]
) {
    if (!selectedProcurementItem || !comparingProcurementCandidate) {
      return null;
    }
    const matchedGroup =
      selectedProcurementCandidateGroups.find((group) => group.groupKey === comparingProcurementCandidate.groupKey) ?? null;
    const copyText = buildProcurementInquiryCopyText(selectedProcurementItem, comparingProcurementCandidate);
    return {
      openingLine:
        sanitizeProcurementCopy(comparingProcurementCandidate.inquiryOpeningLine) ||
        `您好，我们在看 ${procurementDemandDisplayTitle(selectedProcurementItem)}，想确认是否可以继续询价。`,
      summaryLine:
        sanitizeProcurementCopy(comparingProcurementCandidate.inquirySummaryLine) ||
        [
          `目标价 ${formatProcurementPriceRange(selectedProcurementItem.targetPriceMin, selectedProcurementItem.targetPriceMax)}`,
          `候选报价 ${procurementCandidatePriceText(comparingProcurementCandidate)}`,
          `起订量 ${procurementCandidateMoqText(comparingProcurementCandidate)}`
        ].join('；'),
      group: matchedGroup,
      questions: procurementCandidateInquiryQuestions(comparingProcurementCandidate),
      quoteChecklist: procurementCandidateQuoteChecklist(comparingProcurementCandidate),
      sampleChecklist: procurementCandidateSampleChecklist(comparingProcurementCandidate),
      copyText
    };

}
