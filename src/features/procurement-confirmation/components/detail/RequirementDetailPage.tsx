import { useState } from 'react';
import { Col, Row, Space } from 'antd';
import type { ProcurementCandidateRecord, ProcurementFeedbackEntry, ProcurementRequirementRecord } from '../../types';
import { ActionFeedback } from '../ActionFeedback';
import { BackupCandidatePoolCard } from './BackupCandidatePoolCard';
import { CandidatePoolCard } from './CandidatePoolCard';
import { CandidateSourceDetailDrawer } from './CandidateSourceDetailDrawer';
import { FinalSelectionCard } from './FinalSelectionCard';
import { InquiryResultsCard } from './InquiryResultsCard';
import { RequirementHeaderCard } from './RequirementHeaderCard';
import { RequirementSummaryCard } from './RequirementSummaryCard';
import type {
  BatchOperationHandler,
  CandidateOperationHandler,
  ExternalLinkHandler,
  FinalCandidateToggleHandler
} from './types';

type RequirementDetailPageProps = {
  batch: ProcurementRequirementRecord;
  actionLoadingKey: string | null;
  latestFeedback: ProcurementFeedbackEntry | null;
  onInitializePool: BatchOperationHandler;
  onRemoveFromPool: CandidateOperationHandler;
  onToggleFinalPick: FinalCandidateToggleHandler;
  onAddToPool: CandidateOperationHandler;
  onOpenExternalLink: ExternalLinkHandler;
  onFinishInquiry: BatchOperationHandler;
  onConfirmFinalTwo: BatchOperationHandler;
  onRecordReply: CandidateOperationHandler;
  onAdvanceFollowUp: CandidateOperationHandler;
  onMarkNoReplyHandoff: CandidateOperationHandler;
  onMarkParseFailure: CandidateOperationHandler;
};

function sortPoolCandidates(candidates: ProcurementCandidateRecord[]) {
  return candidates
    .filter((candidate) => candidate.inPool)
    .sort((left, right) => (left.poolRankNo ?? 99) - (right.poolRankNo ?? 99));
}

function sortBackupCandidates(candidates: ProcurementCandidateRecord[]) {
  return candidates
    .filter((candidate) => !candidate.inPool)
    .sort((left, right) => left.rankNo - right.rankNo);
}

export function RequirementDetailPage({
  batch,
  actionLoadingKey,
  latestFeedback,
  onInitializePool,
  onRemoveFromPool,
  onToggleFinalPick,
  onAddToPool,
  onOpenExternalLink,
  onFinishInquiry,
  onConfirmFinalTwo,
  onRecordReply,
  onAdvanceFollowUp,
  onMarkNoReplyHandoff,
  onMarkParseFailure
}: RequirementDetailPageProps) {
  const [sourceDetailCandidate, setSourceDetailCandidate] = useState<ProcurementCandidateRecord | null>(null);
  const poolCandidates = sortPoolCandidates(batch.candidates);
  const backupCandidates = sortBackupCandidates(batch.candidates);
  const finalCandidates = batch.candidates.filter((candidate) => candidate.finalPick);
  const repliedCount = poolCandidates.filter((candidate) =>
    ['REPLIED', 'PARTIAL_REPLY', 'CLOSED'].includes(candidate.inquiryStatus)
  ).length;
  const manualCount = poolCandidates.filter((candidate) =>
    ['NO_REPLY_HANDOFF', 'REPLY_PARSE_FAILED', 'SEND_FAILED'].includes(candidate.inquiryStatus)
  ).length;

  return (
    <Row gutter={[18, 18]} align="top">
      <Col xs={24} xl={17} data-testid="procurement-confirmation-detail-page">
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <RequirementHeaderCard
            batch={batch}
            poolCount={poolCandidates.length}
            actionLoadingKey={actionLoadingKey}
            onInitializePool={onInitializePool}
          />
          <ActionFeedback entry={latestFeedback} />
          <RequirementSummaryCard
            batch={batch}
            poolCount={poolCandidates.length}
            repliedCount={repliedCount}
            manualCount={manualCount}
          />
          <CandidatePoolCard
            batch={batch}
            candidates={poolCandidates}
            actionLoadingKey={actionLoadingKey}
            onRemoveFromPool={onRemoveFromPool}
            onToggleFinalPick={onToggleFinalPick}
            onViewSourceDetail={setSourceDetailCandidate}
          />
          <BackupCandidatePoolCard
            batch={batch}
            candidates={backupCandidates}
            poolCount={poolCandidates.length}
            actionLoadingKey={actionLoadingKey}
            onAddToPool={onAddToPool}
            onOpenExternalLink={onOpenExternalLink}
            onViewSourceDetail={setSourceDetailCandidate}
          />
          <InquiryResultsCard
            batch={batch}
            candidates={poolCandidates}
            actionLoadingKey={actionLoadingKey}
            onFinishInquiry={onFinishInquiry}
            onConfirmFinalTwo={onConfirmFinalTwo}
            onRecordReply={onRecordReply}
            onAdvanceFollowUp={onAdvanceFollowUp}
            onMarkNoReplyHandoff={onMarkNoReplyHandoff}
            onMarkParseFailure={onMarkParseFailure}
          />
          <FinalSelectionCard
            batch={batch}
            poolCandidates={poolCandidates}
            finalCandidates={finalCandidates}
            onToggleFinalPick={onToggleFinalPick}
          />
        </Space>
      </Col>
      <CandidateSourceDetailDrawer
        batch={batch}
        candidate={sourceDetailCandidate}
        open={Boolean(sourceDetailCandidate)}
        onClose={() => setSourceDetailCandidate(null)}
      />
    </Row>
  );
}
