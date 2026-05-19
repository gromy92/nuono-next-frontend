import type { ProcurementCandidateRecord } from '../../types';

export type BatchOperationHandler = (batchId: string) => void;

export type CandidateOperationHandler = (
  batchId: string,
  candidate: ProcurementCandidateRecord
) => void;

export type FinalCandidateToggleHandler = (
  batchId: string,
  candidateId: string
) => void;

export type ExternalLinkHandler = (url: string, label: string) => void;

export type CandidateViewHandler = (candidate: ProcurementCandidateRecord) => void;
