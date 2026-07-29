import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, message } from 'antd';
import type { AuthSession } from '../auth/session';
import { apiRequestJson } from '../../shared/api';
import { procurementBuildRoadmap } from './constants';
import { buildProcurementQuickSignalsRequest } from './profitSignals';
import { ProcurementWorkspaceView } from './ProcurementWorkspaceView';
import { useProcurementAutoInquiryValidation } from './useProcurementAutoInquiryValidation';
import { useProcurementCandidateAutoInquiry } from './useProcurementCandidateAutoInquiry';
import { useProcurementCandidatePool } from './useProcurementCandidatePool';
import { useProcurementSourcing } from './useProcurementSourcing';
import { useProcurementWorkspacePresentation } from './useProcurementWorkspacePresentation';
import { useProcurementProfitSignals } from './useProcurementProfitSignals';
import type { ProcurementCandidatePoolPayload, ProcurementReviewFormValues } from './types';
import type { ProcurementProfitSignalsState } from '../profit-calculator/domain';
type ProcurementWorkspaceProps = {
  session: AuthSession | null;
  activeOwnerId?: number;
  onOpenProfitCalculatorPrefilled: () => void;
};
function useProcurementWorkspaceModel({
  session,
  activeOwnerId,
  onOpenProfitCalculatorPrefilled
}: ProcurementWorkspaceProps) {
  const [procurementReviewForm] = Form.useForm<ProcurementReviewFormValues>();
  const [procurementSavingReview, setProcurementSavingReview] = useState(false);
  const [procurementProfitSignalsState, setProcurementProfitSignalsState] = useState<ProcurementProfitSignalsState>({
    status: 'idle'
  });
  const autoInquiryValidation = useProcurementAutoInquiryValidation(session);
  const {
    showProcurementAutoInquiryDevValidation,
    procurementAutoInquiryState,
    procurementAutoInquiryStarting,
    procurementAutoInquiryFeedback,
    procurementAutoInquiryLatestTask,
    procurementAutoInquiryRealSession,
    procurementAutoInquiryValidationMeta,
    openProcurementAutoInquiryValidationSample,
    loadProcurementAutoInquiryWorkbench,
    startProcurementAutoInquiryValidation
  } = autoInquiryValidation;
  const candidatePool = useProcurementCandidatePool({ activeOwnerId, session });
  const {
    procurementState,
    setProcurementState,
    selectedProcurementItemId,
    setSelectedProcurementItemId,
    procurementComparingCandidateId,
    setProcurementComparingCandidateId,
    procurementSelectingCandidateId,
    procurementRunningDemandItemId,
    selectedProcurementItem,
    comparingProcurementCandidate,
    loadProcurementCandidatePool,
    selectProcurementCandidate,
    runProcurementAutoSelection
  } = candidatePool;
  const sourcing = useProcurementSourcing({
    activeOwnerId,
    session,
    procurementState,
    setProcurementState,
    selectedProcurementItem,
    setSelectedProcurementItemId,
    setProcurementComparingCandidateId
  });
  const {
    procurementBackfillForm,
    procurementBackfillModalOpen,
    setProcurementBackfillModalOpen,
    procurementBackfillSubmitting,
    selectedProcurementSourcingProgress,
    openProcurement1688Search,
    copyProcurement1688Keyword,
    openProcurementBackfillModal,
    submitProcurementManualBackfill
  } = sourcing;
  const selectedProcurementQuickSignalsRequest = useMemo(
    () => buildProcurementQuickSignalsRequest(selectedProcurementItem),
    [selectedProcurementItem]
  );
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
  useProcurementProfitSignals({
    selectedProcurementItem,
    selectedProcurementQuickSignalsRequest,
    setProcurementProfitSignalsState
  });
  const candidateAutoInquiry = useProcurementCandidateAutoInquiry({
    activeOwnerId,
    session,
    selectedProcurementItem,
    comparingProcurementCandidate,
    setSelectedProcurementItemId,
    setProcurementComparingCandidateId
  });
  const {
    procurementAutoInquiryBusinessStates,
    currentProcurementAutoInquiryBusinessState,
    currentProcurementAutoInquiryBusinessMeta,
    currentProcurementAutoInquiryBusinessAction,
    nextProcurementAutoInquiryCandidate,
    loadProcurementCandidateAutoInquiry,
    startProcurementCandidateAutoInquiry
  } = candidateAutoInquiry;
  const presentation = useProcurementWorkspacePresentation({
    procurementState,
    selectedProcurementItem,
    comparingProcurementCandidate,
    procurementComparingCandidateId,
    setProcurementComparingCandidateId
  });
  const {
    procurementSummaryCards,
    selectedProcurementCandidateGroups,
    procurementCandidateFilter,
    setProcurementCandidateFilter,
    procurementCandidateGroupFilterKey,
    setProcurementCandidateGroupFilterKey,
    filteredProcurementCandidates,
    procurementSourcePreviewKey,
    setProcurementSourcePreviewKey,
    procurementCandidatePreviewKey,
    setProcurementCandidatePreviewKey,
    procurementSourcePreviewFrames,
    procurementCandidatePreviewFrames,
    activeProcurementSourceFrame,
    activeProcurementCandidateFrame,
    selectedProcurementSourceMainFrame,
    procurementCompareSummary,
    procurementInquirySheet,
    copyCurrentProcurementInquiry
  } = presentation;

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

      const payload = await apiRequestJson<ProcurementCandidatePoolPayload>('/api/procurement/review-candidate', {
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


  return {
    overview: {
      procurementState, procurementSummaryCards,
      showProcurementAutoInquiryDevValidation, procurementBuildProgress,
      selectedProcurementItem, selectedProcurementSourcingProgress,
      session, activeOwnerId, loadProcurementCandidatePool,
      procurementAutoInquiryStarting, procurementAutoInquiryValidationMeta,
      procurementAutoInquiryFeedback, procurementAutoInquiryState,
      procurementAutoInquiryRealSession, procurementAutoInquiryLatestTask,
      openProcurementAutoInquiryValidationSample,
      loadProcurementAutoInquiryWorkbench, startProcurementAutoInquiryValidation,
      openProcurement1688Search, copyProcurement1688Keyword, openProcurementBackfillModal
    },
    demandList: {
      selectedProcurementItemId, procurementRunningDemandItemId,
      setSelectedProcurementItemId, runProcurementAutoSelection
    },
    decision: {
      onOpenProfitCalculatorPrefilled, selectedProcurementSourceMainFrame,
      comparison: {
        selectedProcurementItem, comparingProcurementCandidate, procurementCompareSummary,
        procurementInquirySheet, procurementCandidateGroupFilterKey,
        setProcurementCandidateGroupFilterKey, copyCurrentProcurementInquiry,
        currentProcurementAutoInquiryBusinessState, currentProcurementAutoInquiryBusinessMeta,
        currentProcurementAutoInquiryBusinessAction, nextProcurementAutoInquiryCandidate,
        startProcurementCandidateAutoInquiry, loadProcurementCandidateAutoInquiry,
        setProcurementComparingCandidateId, procurementReviewForm,
        procurementSavingReview, saveProcurementCandidateReview,
        header: {
          procurementSourcePreviewFrames, procurementSourcePreviewKey,
          setProcurementSourcePreviewKey, procurementCandidatePreviewFrames,
          procurementCandidatePreviewKey, setProcurementCandidatePreviewKey,
          activeProcurementSourceFrame, activeProcurementCandidateFrame
        }
      },
      candidateList: {
        selectedProcurementCandidateGroups, procurementCandidateGroupFilterKey,
        setProcurementCandidateGroupFilterKey,
        procurementCandidateFilter, setProcurementCandidateFilter,
        procurementProfitSignalsState, filteredProcurementCandidates,
        procurementComparingCandidateId, procurementSelectingCandidateId,
        selectedProcurementSignalByCandidateId, procurementAutoInquiryBusinessStates,
        setProcurementComparingCandidateId, selectProcurementCandidate,
        startProcurementCandidateAutoInquiry
      }
    },
    backfill: {
      procurementBackfillModalOpen, procurementBackfillSubmitting,
      procurementBackfillForm, setProcurementBackfillModalOpen,
      submitProcurementManualBackfill
    }
  };
}

export type ProcurementWorkspaceModel = ReturnType<typeof useProcurementWorkspaceModel>;

export function ProcurementWorkspace(props: ProcurementWorkspaceProps) {
  return <ProcurementWorkspaceView model={useProcurementWorkspaceModel(props)} />;
}
