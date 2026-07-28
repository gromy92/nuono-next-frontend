import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import type { AuthSession } from '../auth/session';
import {
  PROCUREMENT_SEND_PHASE_VALIDATION_CASE,
  shouldShowProcurementAutoInquiryDevValidation
} from './constants';
import { procurementAutoInquiryValidationPassed } from './autoInquiry';
import { buildProcurementAutoInquiryValidationMeta } from './procurementAutoInquiryValidationMeta';
import type { ProcurementAutoInquiryWorkbenchPayload, ProcurementAutoInquiryWorkbenchState } from './types';

export function useProcurementAutoInquiryValidation(session: AuthSession | null) {
  const [procurementAutoInquiryState, setProcurementAutoInquiryState] =
    useState<ProcurementAutoInquiryWorkbenchState>({
      status: 'idle'
    });
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

  useEffect(() => {
    if (!session) {
      return;
    }
    void loadProcurementAutoInquiryWorkbench();
  }, [loadProcurementAutoInquiryWorkbench, session]);

  return {
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
  };
}
