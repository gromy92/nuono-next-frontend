import { useCallback, useState } from 'react';
import {
  addProcurementCandidateToPool,
  advanceProcurementPoolItemFollowUp,
  confirmProcurementFinalCandidates,
  fetchProcurementConfirmationDetail,
  finishProcurementInquiry,
  initializeProcurementPool,
  markProcurementPoolItemNoReplyHandoff,
  markProcurementPoolItemReplyParseFailed,
  recordProcurementPoolItemReply,
  removeProcurementPoolItem,
  type ProcurementConfirmationCommand
} from '../api';
import { canEditFinalSelection, createTimestamp, formatFinalPick, getErrorMessage } from '../domain';
import type { FinalPickFlag, ProcurementCandidateRecord, ProcurementFeedbackEntry, ProcurementMockRole, ProcurementRequirementRecord } from '../types';

type UseProcurementRequirementActionsOptions = {
  appendFeedback: (tone: ProcurementFeedbackEntry['tone'], title: string, description: string) => void;
  applyDetailResponse: (response: Awaited<ReturnType<typeof fetchProcurementConfirmationDetail>>) => ProcurementRequirementRecord;
  buildOperatorCommand: () => ProcurementConfirmationCommand;
  demandBatches: ProcurementRequirementRecord[];
  roleState: {
    label: string;
    canOperate: boolean;
  };
  updateDemandBatch: (
    demandId: string,
    updater: (batch: ProcurementRequirementRecord) => ProcurementRequirementRecord
  ) => void;
};

export function useProcurementRequirementActions({
  appendFeedback,
  applyDetailResponse,
  buildOperatorCommand,
  demandBatches,
  roleState,
  updateDemandBatch
}: UseProcurementRequirementActionsOptions) {
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const requireBuyer = useCallback(
    (actionLabel: string, handler: () => void | Promise<void>) => {
      if (!roleState.canOperate) {
        appendFeedback(
          'warning',
          '当前角色仅可查看',
          `${roleState.label} 当前不能执行“${actionLabel}”。如需放开此权限，请补充角色规则。`
        );
        return;
      }
      void handler();
    },
    [appendFeedback, roleState.canOperate, roleState.label]
  );

  const runDetailAction = useCallback(
    async (
      loadingKey: string,
      successTitle: string,
      fallbackDescription: string,
      request: () => Promise<Awaited<ReturnType<typeof fetchProcurementConfirmationDetail>>>
    ) => {
      setActionLoadingKey(loadingKey);
      try {
        const response = await request();
        applyDetailResponse(response);
        appendFeedback('success', successTitle, response.message || fallbackDescription);
      } catch (error) {
        appendFeedback('error', '操作失败', getErrorMessage(error));
      } finally {
        setActionLoadingKey(null);
      }
    },
    [appendFeedback, applyDetailResponse]
  );

  const handleInitializePool = useCallback(
    (batchId: string) => {
      requireBuyer('生成待选池并创建询价任务', () =>
        runDetailAction(
          `initialize-${batchId}`,
          '待选池已生成',
          '系统已生成待选池并创建自动询价任务。',
          () => initializeProcurementPool(batchId, { ...buildOperatorCommand(), triggerInquiry: true })
        )
      );
    },
    [buildOperatorCommand, requireBuyer, runDetailAction]
  );

  const handleAddToPool = useCallback(
    (batchId: string, candidate: ProcurementCandidateRecord) => {
      requireBuyer('加入待选池并自动询价', () =>
        runDetailAction(
          `add-${candidate.candidateId}`,
          '已加入待选池',
          '候选已加入待选池并创建自动询价任务。',
          () =>
            addProcurementCandidateToPool(batchId, candidate.candidateId, {
              ...buildOperatorCommand(),
              reason: '从备选池补入待选池',
              triggerInquiry: true
            })
        )
      );
    },
    [buildOperatorCommand, requireBuyer, runDetailAction]
  );

  const handleRemoveFromPool = useCallback(
    (batchId: string, candidate: ProcurementCandidateRecord) => {
      if (!candidate.poolItemId) {
        appendFeedback('warning', '当前候选缺少待选池记录', '请刷新详情后重试。');
        return;
      }
      requireBuyer('终止询价并移出待选池', () =>
        runDetailAction(
          `remove-${candidate.poolItemId}`,
          '已移出待选池',
          '当前候选已终止询价，并从待选池移出。',
          () =>
            removeProcurementPoolItem(batchId, candidate.poolItemId as string, {
              ...buildOperatorCommand(),
              reason: '采购在详情页手动终止并移出待选池'
            })
        )
      );
    },
    [appendFeedback, buildOperatorCommand, requireBuyer, runDetailAction]
  );

  const handleRecordReply = useCallback(
    (batchId: string, candidate: ProcurementCandidateRecord) => {
      if (!candidate.poolItemId) {
        appendFeedback('warning', '当前候选缺少待选池记录', '请刷新详情后重试。');
        return;
      }
      requireBuyer('记录供应商回复', () =>
        runDetailAction(
          `reply-${candidate.poolItemId}`,
          '已记录供应商回复',
          `候选“${candidate.title}”已更新报价、MOQ 和回复时间。`,
          () =>
            recordProcurementPoolItemReply(batchId, candidate.poolItemId as string, {
              ...buildOperatorCommand(),
              quotePriceText: candidate.quotePrice || candidate.priceText || '21.6 RMB',
              quoteMoqText: candidate.quoteMoq || candidate.moqText || '60 件',
              quoteDeliveryText: candidate.quoteDelivery || candidate.deliveryText || '3 天发货',
              replySummary:
                candidate.replySummary && candidate.inquiryStatus === 'REPLIED'
                  ? candidate.replySummary
                  : `已回复：报价 ${candidate.quotePrice || candidate.priceText || '21.6 RMB'}，MOQ ${
                      candidate.quoteMoq || candidate.moqText || '60 件'
                    }。`
            })
        )
      );
    },
    [appendFeedback, buildOperatorCommand, requireBuyer, runDetailAction]
  );

  const handleAdvanceFollowUp = useCallback(
    (batchId: string, candidate: ProcurementCandidateRecord) => {
      if (!candidate.poolItemId) {
        appendFeedback('warning', '当前候选缺少待选池记录', '请刷新详情后重试。');
        return;
      }
      requireBuyer('推进催发', () =>
        runDetailAction(
          `follow-${candidate.poolItemId}`,
          '已推进催发状态',
          `候选“${candidate.title}”已更新催发状态。`,
          () =>
            advanceProcurementPoolItemFollowUp(batchId, candidate.poolItemId as string, {
              ...buildOperatorCommand(),
              note: '采购在详情页推进催发状态。'
            })
        )
      );
    },
    [appendFeedback, buildOperatorCommand, requireBuyer, runDetailAction]
  );

  const handleMarkNoReplyHandoff = useCallback(
    (batchId: string, candidate: ProcurementCandidateRecord) => {
      if (!candidate.poolItemId) {
        appendFeedback('warning', '当前候选缺少待选池记录', '请刷新详情后重试。');
        return;
      }
      requireBuyer('标记 24 小时无回复', () =>
        runDetailAction(
          `no-reply-${candidate.poolItemId}`,
          '已转人工介入',
          `候选“${candidate.title}”已标记为 24 小时无回复。`,
          () =>
            markProcurementPoolItemNoReplyHandoff(batchId, candidate.poolItemId as string, {
              ...buildOperatorCommand(),
              reason: '采购在详情页标记 24 小时无回复。',
              replySummary: '24 小时无回复，已要求人工接手。',
              riskNote: '供应商 24 小时内未回复，需人工判断是否继续补追。'
            })
        )
      );
    },
    [appendFeedback, buildOperatorCommand, requireBuyer, runDetailAction]
  );

  const handleMarkParseFailure = useCallback(
    (batchId: string, candidate: ProcurementCandidateRecord) => {
      if (!candidate.poolItemId) {
        appendFeedback('warning', '当前候选缺少待选池记录', '请刷新详情后重试。');
        return;
      }
      requireBuyer('标记解析失败', () =>
        runDetailAction(
          `parse-failed-${candidate.poolItemId}`,
          '已标记解析失败',
          `候选“${candidate.title}”已转入人工查看。`,
          () =>
            markProcurementPoolItemReplyParseFailed(batchId, candidate.poolItemId as string, {
              ...buildOperatorCommand(),
              reason: '采购在详情页标记回复解析失败。',
              replySummary: '已回复，但结构化解析失败，需要人工补录关键字段。',
              riskNote: '供应商回复无法被结构化解析，需人工补录报价、MOQ 或交期。'
            })
        )
      );
    },
    [appendFeedback, buildOperatorCommand, requireBuyer, runDetailAction]
  );

  const handleFinishInquiry = useCallback(
    (batchId: string) => {
      requireBuyer('收口询价', () =>
        runDetailAction(
          `finish-${batchId}`,
          '询价已收口',
          '当前可以继续确认最终 2 个候选；确认后系统会自动生成 AI 总结。',
          () =>
            finishProcurementInquiry(batchId, {
              ...buildOperatorCommand(),
              finishMode: 'MANUAL_CONFIRM',
              force: false,
              note: '采购在详情页确认当前待选池询价结果可进入最终 2 个选择'
            })
        )
      );
    },
    [buildOperatorCommand, requireBuyer, runDetailAction]
  );

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
                ? {
                    ...candidate,
                    finalPick: null
                  }
                : candidate.finalPick === 'BACKUP' && targetCandidate.finalPick === 'PRIMARY'
                  ? {
                      ...candidate,
                      finalPick: 'PRIMARY'
                    }
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
              candidate.id === candidateId
                ? {
                    ...candidate,
                    finalPick: nextFlag
                  }
                : candidate
            );
            appendFeedback('success', '已加入最终 2 个名单', `候选“${targetCandidate.title}”当前被标记为 ${formatFinalPick(nextFlag)}。`);
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
        const primaryPoolItemId = primary.poolItemId;
        const backupPoolItemId = backup.poolItemId;
        return runDetailAction(
          `final-${batchId}`,
          '最终 2 个已确认',
          '系统已自动生成 AI 总结。',
          () =>
            confirmProcurementFinalCandidates(batchId, {
              ...buildOperatorCommand(),
              primaryPoolItemId,
              backupPoolItemId,
              decisionNote: '当前按最终 2 个正式候选推进，候选 1 优先跟进，候选 2 作为补充。'
            })
        );
      });
    },
    [appendFeedback, buildOperatorCommand, demandBatches, requireBuyer, runDetailAction]
  );

  return {
    actionLoadingKey,
    handleAddToPool,
    handleAdvanceFollowUp,
    handleConfirmFinalTwo,
    handleFinishInquiry,
    handleInitializePool,
    handleMarkNoReplyHandoff,
    handleMarkParseFailure,
    handleRecordReply,
    handleRemoveFromPool,
    handleToggleFinalPick
  };
}

export type ProcurementRequirementRoleState = {
  label: string;
  canOperate: boolean;
};

export type ProcurementRequirementOperatorRole = ProcurementMockRole;
