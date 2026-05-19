import type { AuthSession } from '../auth/session';
import type {
  FinalPickFlag,
  ProcurementCandidateRecord,
  ProcurementInquiryStatus,
  ProcurementMockRole,
  ProcurementRequirementRecord
} from './types';

export function canAdjustCandidatePool(status: ProcurementRequirementRecord['status']) {
  return (
    status === 'POOL_CREATED' ||
    status === 'POOL_INQUIRY_RUNNING' ||
    status === 'POOL_PARTIAL_HANDOFF' ||
    status === 'POOL_EMPTY_REQUIRES_ACTION'
  );
}

export function canOpenFinalSelection(status: ProcurementRequirementRecord['status']) {
  return (
    status === 'POOL_INQUIRY_FINISHED' ||
    status === 'FINAL_TWO_CONFIRMED' ||
    status === 'SUMMARY_READY'
  );
}

export function canEditFinalSelection(status: ProcurementRequirementRecord['status']) {
  return status === 'POOL_INQUIRY_FINISHED';
}

export function canFinishInquiryForBatch(batch: ProcurementRequirementRecord) {
  if (!batch.hasPool || !canAdjustCandidatePool(batch.status)) {
    return false;
  }
  const poolCandidates = batch.candidates.filter((candidate) => candidate.inPool);
  if (!poolCandidates.length) {
    return false;
  }
  const closableStatuses: ProcurementInquiryStatus[] = [
    'REPLIED',
    'PARTIAL_REPLY',
    'NO_REPLY_HANDOFF',
    'SEND_FAILED',
    'REPLY_PARSE_FAILED',
    'CLOSED'
  ];
  return poolCandidates.every((candidate) => closableStatuses.includes(candidate.inquiryStatus));
}

export function createTimestamp() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function normalizePoolCandidates(candidates: ProcurementCandidateRecord[]) {
  const selected = candidates
    .filter((item) => item.inPool)
    .sort((left, right) => (left.poolRankNo ?? 99) - (right.poolRankNo ?? 99) || left.rankNo - right.rankNo);
  const selectedIds = new Set(selected.map((item) => item.id));
  return candidates.map((candidate) => {
    if (!selectedIds.has(candidate.id)) {
      return {
        ...candidate,
        inPool: false,
        poolRankNo: null
      };
    }
    const nextIndex = selected.findIndex((item) => item.id === candidate.id) + 1;
    return {
      ...candidate,
      inPool: true,
      poolRankNo: nextIndex
    };
  });
}

export function cloneDemandBatch(batch: ProcurementRequirementRecord): ProcurementRequirementRecord {
  return {
    ...batch,
    pendingConfirmations: [...batch.pendingConfirmations],
    candidates: batch.candidates.map((candidate) => ({
      ...candidate,
      tags: [...candidate.tags],
      warnings: [...candidate.warnings],
      scores: { ...candidate.scores }
    }))
  };
}

export function formatFinalPick(flag: FinalPickFlag) {
  if (flag === 'PRIMARY') {
    return '最终 2 个 · 候选 1';
  }
  if (flag === 'BACKUP') {
    return '最终 2 个 · 候选 2';
  }
  return '';
}

export function buildSummaryFromBatch(batch: ProcurementRequirementRecord) {
  const selectedFinalists = batch.candidates
    .filter((candidate) => candidate.finalPick)
    .sort((left, right) => (left.finalPick === 'PRIMARY' ? -1 : 1) - (right.finalPick === 'PRIMARY' ? -1 : 1));

  if (selectedFinalists.length !== 2) {
    return '待确认最终 2 个候选后生成 AI 总结。';
  }

  const [primary, backup] = selectedFinalists;
  return `建议优先推进“${primary.title}”，原因是 ${primary.replySummary}；同时保留“${backup.title}”作为第二候选，原因是 ${backup.replySummary}。`;
}

export function resolveProcurementRole(session?: AuthSession | null): ProcurementMockRole {
  const roleName = session?.roleName || '';
  if (roleName.includes('采购')) {
    return 'buyer';
  }
  if (roleName.includes('运营管理')) {
    return 'ops-manager';
  }
  if (roleName.includes('运营')) {
    return 'operations';
  }
  return roleName ? 'operations' : 'buyer';
}

export function resolveOperatorRole(role: ProcurementMockRole) {
  if (role === 'buyer') {
    return 'PURCHASE';
  }
  if (role === 'ops-manager') {
    return 'OPS_MANAGER';
  }
  return 'OPERATIONS';
}

export function upsertDemandRecord(
  records: ProcurementRequirementRecord[],
  nextRecord: ProcurementRequirementRecord
) {
  const existingIndex = records.findIndex((item) => item.id === nextRecord.id);
  if (existingIndex < 0) {
    return [nextRecord, ...records];
  }
  return records.map((item) => (item.id === nextRecord.id ? nextRecord : item));
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '请求失败，请稍后重试。';
}
