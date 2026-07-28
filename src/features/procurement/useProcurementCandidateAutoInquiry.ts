import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import type { AuthSession } from '../auth/session';
import {
  procurementAutoInquiryBusinessAction,
  procurementAutoInquiryBusinessKey,
  procurementAutoInquiryBusinessMeta,
  procurementAutoInquiryBusinessShouldPoll,
  procurementCandidateInquiryPathMeta
} from './autoInquiry';
import type {
  ProcurementAutoInquiryBusinessStateMap,
  ProcurementAutoInquiryWorkbenchPayload,
  ProcurementCandidate,
  ProcurementDemandItem
} from './types';

export function useProcurementCandidateAutoInquiry({
  activeOwnerId,
  session,
  selectedProcurementItem,
  comparingProcurementCandidate,
  setSelectedProcurementItemId,
  setProcurementComparingCandidateId
}: {
  activeOwnerId?: number;
  session: AuthSession | null;
  selectedProcurementItem?: ProcurementDemandItem;
  comparingProcurementCandidate?: ProcurementCandidate;
  setSelectedProcurementItemId: (value?: number) => void;
  setProcurementComparingCandidateId: (value?: number) => void;
}) {
  const [procurementAutoInquiryBusinessStates, setProcurementAutoInquiryBusinessStates] =
    useState<ProcurementAutoInquiryBusinessStateMap>({});

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

  return {
    procurementAutoInquiryBusinessStates,
    currentProcurementAutoInquiryBusinessState,
    currentProcurementAutoInquiryBusinessMeta,
    currentProcurementAutoInquiryBusinessAction,
    nextProcurementAutoInquiryCandidate,
    loadProcurementCandidateAutoInquiry,
    startProcurementCandidateAutoInquiry
  };
}
