import { useCallback } from 'react';
import {
  confirmProcurementFinalCandidates,
  fetchProcurementConfirmationDetail,
  type ProcurementConfirmationCommand
} from '../api';
import {
  canEditFinalSelection,
  createTimestamp,
  formatFinalPick
} from '../domain';
import type {
  FinalPickFlag,
  ProcurementFeedbackEntry,
  ProcurementRequirementRecord
} from '../types';

type ProcurementDetailResponse = Awaited<ReturnType<typeof fetchProcurementConfirmationDetail>>;

type UseProcurementFinalSelectionActionsOptions = {
  appendFeedback: (tone: ProcurementFeedbackEntry['tone'], title: string, description: string) => void;
  buildOperatorCommand: () => ProcurementConfirmationCommand;
  demandBatches: ProcurementRequirementRecord[];
  requireBuyer: (actionLabel: string, handler: () => void | Promise<void>) => void;
  runDetailAction: (
    loadingKey: string,
    successTitle: string,
    fallbackDescription: string,
    request: () => Promise<ProcurementDetailResponse>
  ) => Promise<void>;
  updateDemandBatch: (
    demandId: string,
    updater: (batch: ProcurementRequirementRecord) => ProcurementRequirementRecord
  ) => void;
};

export function useProcurementFinalSelectionActions({
  appendFeedback,
  buildOperatorCommand,
  demandBatches,
  requireBuyer,
  runDetailAction,
  updateDemandBatch
}: UseProcurementFinalSelectionActionsOptions) {
  const handleToggleFinalPick = useCallback(
    (batchId: string, candidateId: string) => {
      requireBuyer('选择最终 2 个候选', () => {
        updateDemandBatch(batchId, (batch) => {
          if (!canEditFinalSelection(batch.status)) {
            appendFeedback('warning', '当前还不能选最终 2 个', '需要先等自动询价阶段收口。');
            return batch;
          }
          const currentFinalists = batch.candidates.filter((candidate) => candidate.finalPick);
          const targetCandidate = batch.candidates.find((candidate) => candidate.id === candidateId);
          if (!targetCandidate) {
            return batch;
          }
          let nextCandidates = batch.candidates;
          if (targetCandidate.finalPick) {
            nextCandidates = batch.candidates.map((candidate) =>
              candidate.id === candidateId
                ? { ...candidate, finalPick: null }
                : candidate.finalPick === 'BACKUP' && targetCandidate.finalPick === 'PRIMARY'
                  ? { ...candidate, finalPick: 'PRIMARY' }
                  : candidate
            );
            appendFeedback('info', '已移出最终 2 个名单', '页面会立即回显当前剩余的最终候选数量。');
          } else if (currentFinalists.length >= 2) {
            appendFeedback('warning', '最终候选已满 2 个', '如需调整，请先移出其中一个候选。');
            return batch;
          } else {
            const nextFlag: FinalPickFlag = currentFinalists.some((candidate) => candidate.finalPick === 'PRIMARY')
              ? 'BACKUP'
              : 'PRIMARY';
            nextCandidates = batch.candidates.map((candidate) =>
              candidate.id === candidateId ? { ...candidate, finalPick: nextFlag } : candidate
            );
            appendFeedback(
              'success',
              '已加入最终 2 个名单',
              `候选“${targetCandidate.title}”当前被标记为 ${formatFinalPick(nextFlag)}。`
            );
          }

          return {
            ...batch,
            updatedAt: createTimestamp(),
            candidates: nextCandidates
          };
        });
      });
    },
    [appendFeedback, requireBuyer, updateDemandBatch]
  );

  const handleConfirmFinalTwo = useCallback(
    (batchId: string) => {
      requireBuyer('确认最终 2 个候选', () => {
        const targetBatch = demandBatches.find((batch) => batch.id === batchId);
        if (!targetBatch) {
          appendFeedback('warning', '当前采购需求不存在', '请返回列表重新进入详情。');
          return;
        }
        if (!canEditFinalSelection(targetBatch.status)) {
          appendFeedback('warning', '当前阶段不可确认最终 2 个', '请先完成自动询价收口。');
          return;
        }
        const finalists = targetBatch.candidates.filter((candidate) => candidate.finalPick);
        if (finalists.length !== 2) {
          appendFeedback('warning', '最终候选数量不对', '当前必须正好选 2 个候选，才能继续进入 AI 总结。');
          return;
        }
        const primary = finalists.find((candidate) => candidate.finalPick === 'PRIMARY');
        const backup = finalists.find((candidate) => candidate.finalPick === 'BACKUP');
        if (!primary?.poolItemId || !backup?.poolItemId) {
          appendFeedback('warning', '最终候选缺少待选池记录', '请刷新详情后重新选择最终 2 个。');
          return;
        }
        return runDetailAction(
          `final-${batchId}`,
          '最终 2 个已确认',
          '系统已自动生成 AI 总结。',
          () =>
            confirmProcurementFinalCandidates(batchId, {
              ...buildOperatorCommand(),
              primaryPoolItemId: primary.poolItemId as string,
              backupPoolItemId: backup.poolItemId as string,
              decisionNote: '当前按最终 2 个正式候选推进，候选 1 优先跟进，候选 2 作为补充。'
            })
        );
      });
    },
    [appendFeedback, buildOperatorCommand, demandBatches, requireBuyer, runDetailAction]
  );

  return { handleConfirmFinalTwo, handleToggleFinalPick };
}
