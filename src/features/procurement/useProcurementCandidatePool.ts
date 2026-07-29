import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import type { AuthSession } from '../auth/session';
import type { ProcurementCandidatePoolPayload, ProcurementState } from './types';

export function useProcurementCandidatePool({
  activeOwnerId,
  session
}: {
  activeOwnerId?: number;
  session: AuthSession | null;
}) {
  const [procurementState, setProcurementState] = useState<ProcurementState>({
    status: 'idle'
  });
  const [selectedProcurementItemId, setSelectedProcurementItemId] = useState<number>();
  const [procurementComparingCandidateId, setProcurementComparingCandidateId] = useState<number>();
  const [procurementSelectingCandidateId, setProcurementSelectingCandidateId] = useState<number>();
  const [procurementRunningDemandItemId, setProcurementRunningDemandItemId] = useState<number>();

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

  const selectedProcurementItem =
    procurementState.status === 'success'
      ? procurementState.data.demandItems.find((item) => item.id === selectedProcurementItemId) ??
        procurementState.data.demandItems[0]
      : undefined;

  useEffect(() => {
    if (!session) {
      return;
    }
    void loadProcurementCandidatePool(activeOwnerId ?? session.defaultOwnerUserId);
  }, [activeOwnerId, loadProcurementCandidatePool, session]);

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

  return {
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
  };
}
