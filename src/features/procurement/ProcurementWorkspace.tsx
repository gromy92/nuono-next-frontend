import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import type { AuthSession } from '../auth/session';
import {
  PROCUREMENT_SEND_PHASE_VALIDATION_CASE,
  procurementBuildRoadmap,
  shouldShowProcurementAutoInquiryDevValidation
} from './constants';
import {
  procurementAutoInquiryBusinessAction,
  procurementAutoInquiryBusinessKey,
  procurementAutoInquiryBusinessMeta,
  procurementAutoInquiryBusinessShouldPoll,
  procurementAutoInquiryValidationPassed,
  procurementCandidateInquiryPathMeta
} from './autoInquiry';
import {
  buildProcurementBackfillDraftCandidate,
  copyProcurementText,
  procurement1688SearchKeyword,
  procurement1688SearchUrl
} from './domain';
import { buildProcurementQuickSignalsRequest } from './profitSignals';
import {
  buildProcurementCandidatePreviewFrames,
  buildProcurementSourcePreviewFrames
} from './preview';
import { buildProcurementAutoInquiryValidationMeta } from './procurementAutoInquiryValidationMeta';
import { buildProcurementCompareSummary } from './procurementCompareSummary';
import { buildProcurementInquirySheet } from './procurementInquirySheet';
import { ProcurementWorkspaceView } from './ProcurementWorkspaceView';
import { useProcurementProfitSignals } from './useProcurementProfitSignals';
import type {
  ProcurementAutoInquiryBusinessStateMap,
  ProcurementAutoInquiryWorkbenchPayload,
  ProcurementAutoInquiryWorkbenchState,
  ProcurementBackfillFormValues,
  ProcurementCandidate,
  ProcurementCandidatePoolPayload,
  ProcurementDemandItem,
  ProcurementSourcingProgress,
  ProcurementState
} from './types';
import type { ProcurementProfitSignalsState, ProfitQuickSignalsPayload } from '../profit-calculator/domain';

type ProcurementWorkspaceProps = {
  session: AuthSession | null;
  activeOwnerId?: number;
  onOpenProfitCalculatorPrefilled: (
    demandItem?: ProcurementDemandItem,
    candidate?: ProcurementCandidate,
    signal?: ProfitQuickSignalsPayload['signals'][number]
  ) => void;
};

export function ProcurementWorkspace({
  session,
  activeOwnerId,
  onOpenProfitCalculatorPrefilled
}: ProcurementWorkspaceProps) {
  const [procurementReviewForm] = Form.useForm();
  const [procurementBackfillForm] = Form.useForm<ProcurementBackfillFormValues>();
  const [procurementState, setProcurementState] = useState<ProcurementState>({
    status: 'idle'
  });
  const [selectedProcurementItemId, setSelectedProcurementItemId] = useState<number>();
  const [procurementComparingCandidateId, setProcurementComparingCandidateId] = useState<number>();
  const [procurementCandidateFilter, setProcurementCandidateFilter] = useState<
    'recommended' | 'review' | 'reject' | 'all'
  >('recommended');
  const [procurementCandidateGroupFilterKey, setProcurementCandidateGroupFilterKey] = useState<string>('all');
  const [procurementSelectingCandidateId, setProcurementSelectingCandidateId] = useState<number>();
  const [procurementRunningDemandItemId, setProcurementRunningDemandItemId] = useState<number>();
  const [procurementSavingReview, setProcurementSavingReview] = useState(false);
  const [procurementBackfillModalOpen, setProcurementBackfillModalOpen] = useState(false);
  const [procurementBackfillSubmitting, setProcurementBackfillSubmitting] = useState(false);
  const [procurementSourcingProgress, setProcurementSourcingProgress] = useState<Record<number, ProcurementSourcingProgress>>({});
  const [procurementSourcePreviewKey, setProcurementSourcePreviewKey] = useState('main');
  const [procurementCandidatePreviewKey, setProcurementCandidatePreviewKey] = useState('main');
  const [procurementAutoInquiryState, setProcurementAutoInquiryState] =
    useState<ProcurementAutoInquiryWorkbenchState>({
      status: 'idle'
    });
  const [procurementAutoInquiryBusinessStates, setProcurementAutoInquiryBusinessStates] =
    useState<ProcurementAutoInquiryBusinessStateMap>({});
  const [procurementAutoInquiryStarting, setProcurementAutoInquiryStarting] = useState(false);
  const [procurementAutoInquiryFeedback, setProcurementAutoInquiryFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    action?: 'start' | 'refresh';
    message?: string;
    time?: string;
  }>({
    status: 'idle'
  });
  const showProcurementAutoInquiryDevValidation = shouldShowProcurementAutoInquiryDevValidation();
  const [procurementProfitSignalsState, setProcurementProfitSignalsState] = useState<ProcurementProfitSignalsState>({
    status: 'idle'
  });

  const loadProcurementCandidatePool = useCallback(async (ownerUserId?: number, orderNo?: string) => {
    const effectiveOwnerUserId = ownerUserId ?? session?.defaultOwnerUserId;
    if (!effectiveOwnerUserId) {
      setProcurementState({ status: 'idle' });
      return;
    }

    setProcurementState({ status: 'loading' });
    try {
      const params = new URLSearchParams({
        ownerUserId: String(effectiveOwnerUserId)
      });
      if (orderNo) {
        params.set('orderNo', orderNo);
      }

      const response = await fetch(`/api/procurement/candidate-pool?${params.toString()}`);
      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as ProcurementCandidatePoolPayload;
      setProcurementState({ status: 'success', data: payload });
      setSelectedProcurementItemId((currentValue) => {
        if (currentValue && payload.demandItems.some((item) => item.id === currentValue)) {
          return currentValue;
        }
        return payload.selectedDemandItemId ?? payload.demandItems[0]?.id;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '采购候选池暂时不可用';
      setProcurementState({ status: 'error', message: errorMessage });
    }
  }, [session]);

  const loadProcurementAutoInquiryWorkbench = useCallback(async () => {
    setProcurementAutoInquiryState({ status: 'loading' });
    try {
      const params = new URLSearchParams({
        ownerUserId: String(PROCUREMENT_SEND_PHASE_VALIDATION_CASE.ownerUserId),
        demandItemId: String(PROCUREMENT_SEND_PHASE_VALIDATION_CASE.demandItemId),
        candidateId: String(PROCUREMENT_SEND_PHASE_VALIDATION_CASE.candidateId)
      });
      const response = await fetch(`/api/procurement/auto-inquiry/workbench?${params.toString()}`);
      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as ProcurementAutoInquiryWorkbenchPayload;
      setProcurementAutoInquiryState({ status: 'success', data: payload });
      setProcurementAutoInquiryFeedback({
        status: 'success',
        action: 'refresh',
        message: payload.message || '阶段结果已刷新，可以直接看当前状态和发送证据。',
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '自动询价验证面暂时不可用';
      setProcurementAutoInquiryState({ status: 'error', message: errorMessage });
      setProcurementAutoInquiryFeedback({
        status: 'error',
        action: 'refresh',
        message: errorMessage,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
    }
  }, []);

  const startProcurementAutoInquiryValidation = useCallback(async () => {
    setProcurementAutoInquiryStarting(true);
    try {
      const response = await fetch('/api/procurement/auto-inquiry/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerUserId: PROCUREMENT_SEND_PHASE_VALIDATION_CASE.ownerUserId,
          operatorUserId: session?.userId ?? PROCUREMENT_SEND_PHASE_VALIDATION_CASE.ownerUserId,
          demandItemId: PROCUREMENT_SEND_PHASE_VALIDATION_CASE.demandItemId,
          candidateId: PROCUREMENT_SEND_PHASE_VALIDATION_CASE.candidateId,
          triggerDispatch: true
        })
      });

      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as ProcurementAutoInquiryWorkbenchPayload;
      setProcurementAutoInquiryState({ status: 'success', data: payload });
      const feedbackMessage = procurementAutoInquiryValidationPassed(payload.latestTask)
        ? '系统已重新校验发送阶段，当前仍然是通过态。'
        : payload.message ?? '已触发本轮自动询价验证。';
      setProcurementAutoInquiryFeedback({
        status: 'success',
        action: 'start',
        message: feedbackMessage,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
      if (procurementAutoInquiryValidationPassed(payload.latestTask)) {
        message.success('发送链路验证样本已进入 SENT，可直接看发送证据。');
      } else {
        message.success(payload.message ?? '已触发本轮自动询价验证。');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '自动询价验证触发失败';
      setProcurementAutoInquiryState({ status: 'error', message: errorMessage });
      setProcurementAutoInquiryFeedback({
        status: 'error',
        action: 'start',
        message: errorMessage,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
      message.error(errorMessage);
    } finally {
      setProcurementAutoInquiryStarting(false);
    }
  }, [session?.userId]);

  const openProcurementAutoInquiryValidationSample = useCallback(() => {
    window.open(PROCUREMENT_SEND_PHASE_VALIDATION_CASE.entryUrl, '_blank', 'noopener,noreferrer');
    message.info('已打开本轮 1688 验证样本页，便于你对照目标商品；当前发送链路已支持直接触发。');
  }, [message]);

  const loadProcurementCandidateAutoInquiry = useCallback(
    async (demandItem?: ProcurementDemandItem, candidate?: ProcurementCandidate) => {
      const effectiveOwnerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
      if (!effectiveOwnerUserId || !demandItem?.id || !candidate?.id) {
        return;
      }

      const stateKey = procurementAutoInquiryBusinessKey(demandItem.id, candidate.id);
      setProcurementAutoInquiryBusinessStates((currentValue) => ({
        ...currentValue,
        [stateKey]: { status: 'loading' }
      }));

      try {
        const params = new URLSearchParams({
          ownerUserId: String(effectiveOwnerUserId),
          demandItemId: String(demandItem.id),
          candidateId: String(candidate.id)
        });
        const response = await fetch(`/api/procurement/auto-inquiry/workbench?${params.toString()}`);
        if (!response.ok) {
          let backendMessage = `后端返回 ${response.status}`;
          try {
            const errorPayload = (await response.json()) as { message?: string; error?: string };
            backendMessage = errorPayload.message || errorPayload.error || backendMessage;
          } catch {
            // ignore json parse failure
          }
          throw new Error(backendMessage);
        }

        const payload = (await response.json()) as ProcurementAutoInquiryWorkbenchPayload;
        setProcurementAutoInquiryBusinessStates((currentValue) => ({
          ...currentValue,
          [stateKey]: { status: 'success', data: payload }
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '自动询价结果暂时不可读取';
        setProcurementAutoInquiryBusinessStates((currentValue) => ({
          ...currentValue,
          [stateKey]: { status: 'error', message: errorMessage }
        }));
      }
    },
    [activeOwnerId, session?.defaultOwnerUserId]
  );

  const startProcurementCandidateAutoInquiry = useCallback(
    async (demandItem?: ProcurementDemandItem, candidate?: ProcurementCandidate) => {
      const effectiveOwnerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
      if (!effectiveOwnerUserId || !demandItem?.id || !candidate?.id) {
        message.error('当前老板上下文或候选信息不完整，暂时不能发起自动询价。');
        return;
      }

      const stateKey = procurementAutoInquiryBusinessKey(demandItem.id, candidate.id);
      setSelectedProcurementItemId(demandItem.id);
      setProcurementComparingCandidateId(candidate.id);
      setProcurementAutoInquiryBusinessStates((currentValue) => ({
        ...currentValue,
        [stateKey]: { status: 'loading' }
      }));

      try {
        const response = await fetch('/api/procurement/auto-inquiry/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ownerUserId: effectiveOwnerUserId,
            operatorUserId: session?.userId ?? effectiveOwnerUserId,
            demandItemId: demandItem.id,
            candidateId: candidate.id,
            triggerDispatch: true
          })
        });

        if (!response.ok) {
          let backendMessage = `后端返回 ${response.status}`;
          try {
            const errorPayload = (await response.json()) as { message?: string; error?: string };
            backendMessage = errorPayload.message || errorPayload.error || backendMessage;
          } catch {
            // ignore json parse failure
          }
          throw new Error(backendMessage);
        }

        const payload = (await response.json()) as ProcurementAutoInquiryWorkbenchPayload;
        setProcurementAutoInquiryBusinessStates((currentValue) => ({
          ...currentValue,
          [stateKey]: { status: 'success', data: payload }
        }));

        const businessMeta = procurementAutoInquiryBusinessMeta({ status: 'success', data: payload }, candidate);
        message.success(`${businessMeta.businessStatus}：${businessMeta.summary}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '自动询价发起失败';
        setProcurementAutoInquiryBusinessStates((currentValue) => ({
          ...currentValue,
          [stateKey]: { status: 'error', message: errorMessage }
        }));
        message.error(errorMessage);
      }
    },
    [activeOwnerId, message, session?.defaultOwnerUserId, session?.userId]
  );

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

  const selectedProcurementItem =
    procurementState.status === 'success'
      ? procurementState.data.demandItems.find((item) => item.id === selectedProcurementItemId) ??
        procurementState.data.demandItems[0]
      : undefined;
  const selectedProcurementQuickSignalsRequest = useMemo(
    () => buildProcurementQuickSignalsRequest(selectedProcurementItem),
    [selectedProcurementItem]
  );
  const selectedProcurementSourcingProgress = selectedProcurementItem
    ? procurementSourcingProgress[selectedProcurementItem.id]
    : undefined;
  const selectedProcurementSignalByCandidateId =
    procurementProfitSignalsState.status === 'success' &&
    procurementProfitSignalsState.demandItemId === selectedProcurementItem?.id
      ? procurementProfitSignalsState.signalByCandidateId
      : {};
  const procurementBuildProgress = useMemo(() => {
    const doneCount = procurementBuildRoadmap.filter((item) => item.status === 'done').length;
    const stageCount = procurementBuildRoadmap.length;
    const percent = Math.round((doneCount / stageCount) * 100);
    const currentStage = procurementBuildRoadmap.find((item) => item.status === 'doing') ?? procurementBuildRoadmap[stageCount - 1];
    return {
      doneCount,
      stageCount,
      percent,
      currentStage,
      nextStep: '把“回填候选池”从手工录入升级成半自动采集，尽量减少运营重复填写。'
    };
  }, []);
  const procurementAutoInquiryLatestTask =
    procurementAutoInquiryState.status === 'success' ? procurementAutoInquiryState.data.latestTask ?? undefined : undefined;
  const procurementAutoInquiryRealSession =
    procurementAutoInquiryState.status === 'success'
      ? procurementAutoInquiryState.data.sessionPool.find((item) => item.browserEndpoint?.startsWith('chrome-local://'))
      : undefined;
  const procurementAutoInquiryValidationMeta = useMemo(
    () => buildProcurementAutoInquiryValidationMeta(procurementAutoInquiryState, procurementAutoInquiryLatestTask),
    [procurementAutoInquiryLatestTask, procurementAutoInquiryState]
  );

  useProcurementProfitSignals({
    selectedProcurementItem,
    selectedProcurementQuickSignalsRequest,
    setProcurementProfitSignalsState
  });

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
      const response = await fetch('/api/procurement/backfill-candidates', {
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

      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as ProcurementCandidatePoolPayload;
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

  useEffect(() => {
    if (!session) {
      return;
    }
    void loadProcurementCandidatePool(activeOwnerId ?? session.defaultOwnerUserId);
  }, [activeOwnerId, loadProcurementCandidatePool, session]);

  useEffect(() => {
    if (!session) {
      return;
    }
    void loadProcurementAutoInquiryWorkbench();
  }, [loadProcurementAutoInquiryWorkbench, session]);

  const selectProcurementCandidate = useCallback(async (demandItemId: number, candidateId: number) => {
    const effectiveOwnerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
    if (!effectiveOwnerUserId) {
      message.error('缺少老板上下文，暂时不能提交意向采购。');
      return;
    }

    try {
      setProcurementSelectingCandidateId(candidateId);

      const response = await fetch('/api/procurement/select-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerUserId: effectiveOwnerUserId,
          orderNo: procurementState.status === 'success' ? procurementState.data.order?.orderNo : undefined,
          demandItemId,
          candidateId
        })
      });

      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as ProcurementCandidatePoolPayload;
      setProcurementState({ status: 'success', data: payload });
      setSelectedProcurementItemId(demandItemId);
      setProcurementComparingCandidateId(candidateId);
      message.success(payload.message ?? '已选为意向采购。');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交意向采购失败';
      message.error(errorMessage);
    } finally {
      setProcurementSelectingCandidateId(undefined);
    }
  }, [activeOwnerId, procurementState, session]);

  const runProcurementAutoSelection = useCallback(async (demandItemId: number) => {
    const effectiveOwnerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
    if (!effectiveOwnerUserId) {
      message.error('缺少老板上下文，暂时不能运行自动选品。');
      return;
    }

    try {
      setProcurementRunningDemandItemId(demandItemId);

      const response = await fetch('/api/procurement/run-auto-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerUserId: effectiveOwnerUserId,
          orderNo: procurementState.status === 'success' ? procurementState.data.order?.orderNo : undefined,
          demandItemId
        })
      });

      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as ProcurementCandidatePoolPayload;
      setProcurementState({ status: 'success', data: payload });
      setSelectedProcurementItemId(demandItemId);
      setProcurementComparingCandidateId(payload.demandItems.find((item) => item.id === demandItemId)?.candidates[0]?.id);
      message.success(payload.message ?? '已按当前采购要求完成自动选品。');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '自动选品执行失败';
      message.error(errorMessage);
    } finally {
      setProcurementRunningDemandItemId(undefined);
    }
  }, [activeOwnerId, message, procurementState, session]);

  const comparingProcurementCandidate = useMemo(() => {
    if (!selectedProcurementItem?.candidates.length) {
      return undefined;
    }

    return (
      selectedProcurementItem.candidates.find((candidate) => candidate.id === procurementComparingCandidateId) ??
      selectedProcurementItem.candidates[0]
    );
  }, [procurementComparingCandidateId, selectedProcurementItem]);

  const currentProcurementAutoInquiryBusinessState = useMemo(() => {
    if (!selectedProcurementItem?.id || !comparingProcurementCandidate?.id) {
      return undefined;
    }
    return procurementAutoInquiryBusinessStates[
      procurementAutoInquiryBusinessKey(selectedProcurementItem.id, comparingProcurementCandidate.id)
    ];
  }, [comparingProcurementCandidate?.id, procurementAutoInquiryBusinessStates, selectedProcurementItem?.id]);

  const currentProcurementAutoInquiryBusinessMeta = useMemo(
    () =>
      procurementAutoInquiryBusinessMeta(
        currentProcurementAutoInquiryBusinessState,
        comparingProcurementCandidate
      ),
    [currentProcurementAutoInquiryBusinessState, comparingProcurementCandidate]
  );

  const currentProcurementAutoInquiryBusinessAction = useMemo(
    () => procurementAutoInquiryBusinessAction(currentProcurementAutoInquiryBusinessState, comparingProcurementCandidate),
    [comparingProcurementCandidate, currentProcurementAutoInquiryBusinessState]
  );

  const nextProcurementAutoInquiryCandidate = useMemo(() => {
    if (!selectedProcurementItem?.candidates?.length || !comparingProcurementCandidate) {
      return undefined;
    }
    return [...selectedProcurementItem.candidates]
      .filter((candidate) => candidate.id !== comparingProcurementCandidate.id)
      .map((candidate) => {
        const candidateState =
          procurementAutoInquiryBusinessStates[
            procurementAutoInquiryBusinessKey(selectedProcurementItem.id, candidate.id)
          ];
        return {
          candidate,
          meta: procurementCandidateInquiryPathMeta(candidate, candidateState)
        };
      })
      .sort((left, right) => right.meta.priority - left.meta.priority)[0]?.candidate;
  }, [comparingProcurementCandidate, procurementAutoInquiryBusinessStates, selectedProcurementItem]);

  const saveProcurementCandidateReview = useCallback(async () => {
    const effectiveOwnerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
    if (!effectiveOwnerUserId) {
      message.error('缺少老板上下文，暂时不能保存人工判断。');
      return;
    }
    if (!selectedProcurementItem || !comparingProcurementCandidate) {
      message.error('请先选择一个正在对比的候选商品。');
      return;
    }

    try {
      const values = await procurementReviewForm.validateFields();
      setProcurementSavingReview(true);

      const response = await fetch('/api/procurement/review-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerUserId: effectiveOwnerUserId,
          orderNo: procurementState.status === 'success' ? procurementState.data.order?.orderNo : undefined,
          demandItemId: selectedProcurementItem.id,
          candidateId: comparingProcurementCandidate.id,
          manualReviewNote: values.manualReviewNote,
          inquirySummary: values.inquirySummary,
          nextAction: values.nextAction
        })
      });

      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as ProcurementCandidatePoolPayload;
      setProcurementState({ status: 'success', data: payload });
      setSelectedProcurementItemId(selectedProcurementItem.id);
      setProcurementComparingCandidateId(comparingProcurementCandidate.id);
      message.success(payload.message ?? '已保存当前候选的人工判断。');
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '保存人工判断失败';
      message.error(errorMessage);
    } finally {
      setProcurementSavingReview(false);
    }
  }, [
    activeOwnerId,
    comparingProcurementCandidate,
    message,
    procurementReviewForm,
    procurementState,
    selectedProcurementItem,
    session
  ]);

  const procurementSummaryCards =
    procurementState.status === 'success' && procurementState.data.summary
      ? [
          { label: '需求条数', value: procurementState.data.summary.totalItems },
          { label: '执行中任务', value: procurementState.data.summary.runningTasks },
          { label: '高推荐候选', value: procurementState.data.summary.recommendedCandidates },
          { label: '已选意向采购', value: procurementState.data.summary.selectedCandidates }
        ]
      : [];

  const selectedProcurementCandidateGroups = selectedProcurementItem?.candidateGroups ?? [];

  const filteredProcurementCandidates = useMemo(() => {
    const candidates = selectedProcurementItem?.candidates ?? [];
    const groupFiltered =
      procurementCandidateGroupFilterKey === 'all'
        ? candidates
        : candidates.filter((candidate) => candidate.groupKey === procurementCandidateGroupFilterKey);
    if (procurementCandidateFilter === 'all') {
      return groupFiltered;
    }
    return groupFiltered.filter((candidate) => candidate.level === procurementCandidateFilter);
  }, [procurementCandidateFilter, procurementCandidateGroupFilterKey, selectedProcurementItem]);

  useEffect(() => {
    if (!selectedProcurementItem?.candidates.length) {
      setProcurementComparingCandidateId(undefined);
      return;
    }

    setProcurementComparingCandidateId((currentValue) => {
      if (currentValue && selectedProcurementItem.candidates.some((candidate) => candidate.id === currentValue)) {
        return currentValue;
      }

      return (
        selectedProcurementItem.candidates.find((candidate) => candidate.selected)?.id ??
        selectedProcurementItem.candidates.find((candidate) => candidate.level === 'recommended')?.id ??
        selectedProcurementItem.candidates[0]?.id
      );
    });
  }, [selectedProcurementItem]);

  useEffect(() => {
    setProcurementCandidateGroupFilterKey('all');
  }, [selectedProcurementItem?.id]);

  useEffect(() => {
    if (!selectedProcurementItem || !comparingProcurementCandidate) {
      return;
    }

    const stateKey = procurementAutoInquiryBusinessKey(
      selectedProcurementItem.id,
      comparingProcurementCandidate.id
    );
    const currentState = procurementAutoInquiryBusinessStates[stateKey];
    if (currentState && currentState.status !== 'idle') {
      return;
    }

    void loadProcurementCandidateAutoInquiry(selectedProcurementItem, comparingProcurementCandidate);
  }, [
    comparingProcurementCandidate,
    loadProcurementCandidateAutoInquiry,
    procurementAutoInquiryBusinessStates,
    selectedProcurementItem
  ]);

  useEffect(() => {
    if (!selectedProcurementItem || !comparingProcurementCandidate) {
      return;
    }
    if (!procurementAutoInquiryBusinessShouldPoll(currentProcurementAutoInquiryBusinessState)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadProcurementCandidateAutoInquiry(selectedProcurementItem, comparingProcurementCandidate);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    comparingProcurementCandidate,
    currentProcurementAutoInquiryBusinessState,
    loadProcurementCandidateAutoInquiry,
    selectedProcurementItem
  ]);

  useEffect(() => {
    if (
      procurementCandidateGroupFilterKey !== 'all' &&
      !selectedProcurementCandidateGroups.some((group) => group.groupKey === procurementCandidateGroupFilterKey)
    ) {
      setProcurementCandidateGroupFilterKey('all');
    }
  }, [procurementCandidateGroupFilterKey, selectedProcurementCandidateGroups]);

  useEffect(() => {
    if (!filteredProcurementCandidates.length) {
      setProcurementComparingCandidateId(undefined);
      return;
    }
    setProcurementComparingCandidateId((currentValue) => {
      if (currentValue && filteredProcurementCandidates.some((candidate) => candidate.id === currentValue)) {
        return currentValue;
      }
      return (
        filteredProcurementCandidates.find((candidate) => candidate.selected)?.id ??
        filteredProcurementCandidates.find((candidate) => candidate.level === 'recommended')?.id ??
        filteredProcurementCandidates[0]?.id
      );
    });
  }, [filteredProcurementCandidates]);

  useEffect(() => {
    setProcurementSourcePreviewKey('main');
  }, [selectedProcurementItem?.id]);

  useEffect(() => {
    setProcurementCandidatePreviewKey('main');
  }, [procurementComparingCandidateId]);

  useEffect(() => {
    if (!comparingProcurementCandidate) {
      procurementReviewForm.resetFields();
      return;
    }

    procurementReviewForm.setFieldsValue({
      manualReviewNote: comparingProcurementCandidate.manualReviewNote || '',
      inquirySummary: comparingProcurementCandidate.inquirySummary || '',
      nextAction: comparingProcurementCandidate.nextAction || undefined
    });
  }, [
    comparingProcurementCandidate?.id,
    comparingProcurementCandidate?.manualReviewNote,
    comparingProcurementCandidate?.inquirySummary,
    comparingProcurementCandidate?.nextAction,
    procurementReviewForm
  ]);

  const procurementSourcePreviewFrames = useMemo(() => {
    if (!selectedProcurementItem) {
      return [];
    }
    return buildProcurementSourcePreviewFrames(selectedProcurementItem);
  }, [selectedProcurementItem]);

  const procurementCandidatePreviewFrames = useMemo(() => {
    if (!comparingProcurementCandidate) {
      return [];
    }
    return buildProcurementCandidatePreviewFrames(comparingProcurementCandidate);
  }, [comparingProcurementCandidate]);

  const activeProcurementSourceFrame = useMemo(
    () =>
      procurementSourcePreviewFrames.find((item) => item.key === procurementSourcePreviewKey) ??
      procurementSourcePreviewFrames[0] ??
      null,
    [procurementSourcePreviewFrames, procurementSourcePreviewKey]
  );

  const activeProcurementCandidateFrame = useMemo(
    () =>
      procurementCandidatePreviewFrames.find((item) => item.key === procurementCandidatePreviewKey) ??
      procurementCandidatePreviewFrames[0] ??
      null,
    [procurementCandidatePreviewFrames, procurementCandidatePreviewKey]
  );

  const selectedProcurementSourceMainFrame = useMemo(
    () => procurementSourcePreviewFrames[0] ?? null,
    [procurementSourcePreviewFrames]
  );

  const procurementCompareSummary = useMemo(
    () => buildProcurementCompareSummary(selectedProcurementItem, comparingProcurementCandidate),
    [comparingProcurementCandidate, selectedProcurementItem]
  );

  const procurementInquirySheet = useMemo(
    () => buildProcurementInquirySheet(selectedProcurementItem, comparingProcurementCandidate, selectedProcurementCandidateGroups),
    [comparingProcurementCandidate, selectedProcurementCandidateGroups, selectedProcurementItem]
  );

  const copyCurrentProcurementInquiry = useCallback(async () => {
    if (!procurementInquirySheet?.copyText) {
      message.error('当前没有可复制的询价准备单。');
      return;
    }
    try {
      const copied = await copyProcurementText(procurementInquirySheet.copyText);
      if (!copied) {
        throw new Error('复制失败');
      }
      message.success('已复制当前询价准备单。');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '复制询价准备单失败';
      message.error(errorMessage);
    }
  }, [message, procurementInquirySheet]);

  return (
    <ProcurementWorkspaceView model={{ procurementState, procurementSummaryCards, showProcurementAutoInquiryDevValidation, procurementBuildProgress, selectedProcurementItem, selectedProcurementSourcingProgress, session, procurementAutoInquiryStarting, procurementAutoInquiryValidationMeta, procurementAutoInquiryFeedback, procurementAutoInquiryState, procurementAutoInquiryRealSession, procurementAutoInquiryLatestTask, openProcurementAutoInquiryValidationSample, loadProcurementAutoInquiryWorkbench, startProcurementAutoInquiryValidation, activeOwnerId, loadProcurementCandidatePool, openProcurement1688Search, copyProcurement1688Keyword, openProcurementBackfillModal, selectedProcurementItemId, procurementRunningDemandItemId, setSelectedProcurementItemId, runProcurementAutoSelection, comparingProcurementCandidate, selectedProcurementSignalByCandidateId, onOpenProfitCalculatorPrefilled, procurementCompareSummary, selectedProcurementSourceMainFrame, procurementSourcePreviewFrames, procurementSourcePreviewKey, setProcurementSourcePreviewKey, procurementCandidatePreviewFrames, procurementCandidatePreviewKey, setProcurementCandidatePreviewKey, activeProcurementSourceFrame, activeProcurementCandidateFrame, procurementInquirySheet, procurementCandidateGroupFilterKey, setProcurementCandidateGroupFilterKey, copyCurrentProcurementInquiry, currentProcurementAutoInquiryBusinessState, currentProcurementAutoInquiryBusinessMeta, currentProcurementAutoInquiryBusinessAction, nextProcurementAutoInquiryCandidate, startProcurementCandidateAutoInquiry, loadProcurementCandidateAutoInquiry, setProcurementComparingCandidateId, procurementReviewForm, procurementSavingReview, saveProcurementCandidateReview, selectedProcurementCandidateGroups, procurementCandidateFilter, setProcurementCandidateFilter, procurementProfitSignalsState, filteredProcurementCandidates, procurementComparingCandidateId, procurementSelectingCandidateId, procurementAutoInquiryBusinessStates, selectProcurementCandidate, procurementBackfillModalOpen, procurementBackfillSubmitting, procurementBackfillForm, setProcurementBackfillModalOpen, submitProcurementManualBackfill }} />
  );
}
