import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import { copyProcurementText } from './domain';
import { buildProcurementCandidatePreviewFrames, buildProcurementSourcePreviewFrames } from './preview';
import { buildProcurementCompareSummary } from './procurementCompareSummary';
import { buildProcurementInquirySheet } from './procurementInquirySheet';
import type { ProcurementCandidate, ProcurementDemandItem, ProcurementState } from './types';

export function useProcurementWorkspacePresentation({
  procurementState,
  selectedProcurementItem,
  comparingProcurementCandidate,
  procurementComparingCandidateId,
  setProcurementComparingCandidateId
}: {
  procurementState: ProcurementState;
  selectedProcurementItem?: ProcurementDemandItem;
  comparingProcurementCandidate?: ProcurementCandidate;
  procurementComparingCandidateId?: number;
  setProcurementComparingCandidateId: Dispatch<SetStateAction<number | undefined>>;
}) {
  const [procurementCandidateFilter, setProcurementCandidateFilter] = useState<
    'recommended' | 'review' | 'reject' | 'all'
  >('recommended');
  const [procurementCandidateGroupFilterKey, setProcurementCandidateGroupFilterKey] = useState<string>('all');
  const [procurementSourcePreviewKey, setProcurementSourcePreviewKey] = useState('main');
  const [procurementCandidatePreviewKey, setProcurementCandidatePreviewKey] = useState('main');

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

  return {
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
  };
}
