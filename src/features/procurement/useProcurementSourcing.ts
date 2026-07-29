import { useCallback, useState } from 'react';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import type { AuthSession } from '../auth/session';
import { apiRequestJson } from '../../shared/api';
import {
  buildProcurementBackfillDraftCandidate,
  copyProcurementText,
  procurement1688SearchKeyword,
  procurement1688SearchUrl
} from './domain';
import type {
  ProcurementBackfillFormValues,
  ProcurementCandidatePoolPayload,
  ProcurementDemandItem,
  ProcurementSourcingProgress,
  ProcurementState
} from './types';

export function useProcurementSourcing({
  activeOwnerId,
  session,
  procurementState,
  setProcurementState,
  selectedProcurementItem,
  setSelectedProcurementItemId,
  setProcurementComparingCandidateId
}: {
  activeOwnerId?: number;
  session: AuthSession | null;
  procurementState: ProcurementState;
  setProcurementState: (state: ProcurementState) => void;
  selectedProcurementItem?: ProcurementDemandItem;
  setSelectedProcurementItemId: (value?: number) => void;
  setProcurementComparingCandidateId: (value?: number) => void;
}) {
  const [procurementBackfillForm] = Form.useForm<ProcurementBackfillFormValues>();
  const [procurementBackfillModalOpen, setProcurementBackfillModalOpen] = useState(false);
  const [procurementBackfillSubmitting, setProcurementBackfillSubmitting] = useState(false);
  const [procurementSourcingProgress, setProcurementSourcingProgress] = useState<Record<number, ProcurementSourcingProgress>>({});

  const markProcurementSourcingProgress = useCallback(
    (demandItemId: number, patch: Partial<ProcurementSourcingProgress>) => {
      setProcurementSourcingProgress((currentValue) => ({
        ...currentValue,
        [demandItemId]: {
          ...(currentValue[demandItemId] ?? {}),
          ...patch
        }
      }));
    },
    []
  );

  const openProcurement1688Search = useCallback(
    (item?: ProcurementDemandItem) => {
      const searchUrl = procurement1688SearchUrl(item);
      if (!searchUrl) {
        message.error('当前采购需求还没有可用的 1688 搜索词。');
        return;
      }
      if (item?.id) {
        markProcurementSourcingProgress(item.id, {
          searchOpenedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        });
      }
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    },
    [markProcurementSourcingProgress, message]
  );

  const copyProcurement1688Keyword = useCallback(
    async (item?: ProcurementDemandItem) => {
      const keyword = procurement1688SearchKeyword(item);
      if (!keyword || keyword === '未命名需求') {
        message.error('当前采购需求还没有可复制的搜索词。');
        return;
      }
      try {
        const copied = await copyProcurementText(keyword);
        if (!copied) {
          throw new Error('复制失败');
        }
        if (item?.id) {
          markProcurementSourcingProgress(item.id, {
            keywordCopiedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
          });
        }
        message.success('已复制当前 1688 搜索词。');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '复制 1688 搜索词失败';
        message.error(errorMessage);
      }
    },
    [markProcurementSourcingProgress, message]
  );

  const openProcurementBackfillModal = useCallback(
    (item?: ProcurementDemandItem) => {
      if (!item) {
        message.error('请先选择一个采购需求。');
        return;
      }
      setSelectedProcurementItemId(item.id);
      procurementBackfillForm.setFieldsValue({
        candidates: [buildProcurementBackfillDraftCandidate()]
      });
      setProcurementBackfillModalOpen(true);
      markProcurementSourcingProgress(item.id, {
        backfillOpenedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
    },
    [markProcurementSourcingProgress, message, procurementBackfillForm]
  );

  const selectedProcurementSourcingProgress = selectedProcurementItem
    ? procurementSourcingProgress[selectedProcurementItem.id]
    : undefined;

  const submitProcurementManualBackfill = useCallback(async () => {
    const effectiveOwnerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
    if (!effectiveOwnerUserId) {
      message.error('缺少老板上下文，暂时不能回填候选。');
      return;
    }
    if (!selectedProcurementItem) {
      message.error('请先选择一个采购需求。');
      return;
    }

    try {
      const values = await procurementBackfillForm.validateFields();
      const candidates = (values.candidates ?? []).filter((item) => item?.candidateUrl?.trim() && item?.title?.trim());
      if (!candidates.length) {
        message.error('请至少填写一条候选商品链接和标题。');
        return;
      }

      setProcurementBackfillSubmitting(true);
      const payload = await apiRequestJson<ProcurementCandidatePoolPayload>('/api/procurement/backfill-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerUserId: effectiveOwnerUserId,
          orderNo: procurementState.status === 'success' ? procurementState.data.order?.orderNo : undefined,
          demandItemId: selectedProcurementItem.id,
          candidates
        })
      });

      const refreshedDemandItem = payload.demandItems.find((item) => item.id === selectedProcurementItem.id);
      setProcurementState({ status: 'success', data: payload });
      setSelectedProcurementItemId(selectedProcurementItem.id);
      setProcurementComparingCandidateId(
        refreshedDemandItem?.candidates.find((candidate) => candidate.level === 'recommended')?.id ??
          refreshedDemandItem?.candidates[0]?.id
      );
      setProcurementBackfillModalOpen(false);
      procurementBackfillForm.resetFields();
      markProcurementSourcingProgress(selectedProcurementItem.id, {
        lastBackfillAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        backfilledCount: (procurementSourcingProgress[selectedProcurementItem.id]?.backfilledCount ?? 0) + candidates.length
      });
      message.success(payload.message ?? '已把当前 1688 候选追加进采购候选池。');
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '回填 1688 候选失败';
      message.error(errorMessage);
    } finally {
      setProcurementBackfillSubmitting(false);
    }
  }, [
    activeOwnerId,
    markProcurementSourcingProgress,
    message,
    procurementBackfillForm,
    procurementSourcingProgress,
    procurementState,
    selectedProcurementItem,
    session
  ]);

  return {
    procurementBackfillForm,
    procurementBackfillModalOpen,
    setProcurementBackfillModalOpen,
    procurementBackfillSubmitting,
    selectedProcurementSourcingProgress,
    openProcurement1688Search,
    copyProcurement1688Keyword,
    openProcurementBackfillModal,
    submitProcurementManualBackfill
  };
}
