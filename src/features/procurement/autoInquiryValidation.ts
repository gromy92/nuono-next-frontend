import type { ProcurementAutoInquiryWorkbenchPayload } from './types';

export function procurementPageBusinessDescription(message?: string) {
  if (!message || message.includes('样本') || message.includes('验证') || message.includes('链路')) {
    return '当前采购单已准备好，可以继续查看候选、发起自动询价，并推进意向采购决策。';
  }
  return message;
}

export function procurementAutoInquiryBusinessKey(demandItemId?: number, candidateId?: number) {
  if (!demandItemId || !candidateId) {
    return '';
  }
  return `${demandItemId}-${candidateId}`;
}

export function procurementAutoInquiryValidationPassed(
  task?: ProcurementAutoInquiryWorkbenchPayload['latestTask']
) {
  return (
    (task?.status ?? '').toUpperCase() === 'SENT' &&
    (task?.executionStage ?? '').toUpperCase() === 'SEND_CONFIRMED' &&
    (task?.sendChannel ?? '').toLowerCase() === 'hosted-browser-gateway'
  );
}

export function procurementAutoInquiryValidationFailed(
  task?: ProcurementAutoInquiryWorkbenchPayload['latestTask']
) {
  const normalizedStatus = (task?.status ?? '').toUpperCase();
  return (
    normalizedStatus === 'HANDOFF' ||
    normalizedStatus === 'FAILED' ||
    Boolean(task?.failureCode || task?.failureMessage || task?.handoffReason)
  );
}

export function procurementAutoInquiryBusinessFailureReason(
  task?: ProcurementAutoInquiryWorkbenchPayload['latestTask'],
  supplierName?: string
) {
  const fallbackSupplier = supplierName || '当前供应商';
  const failureCode = (task?.failureCode ?? '').toUpperCase();
  if (failureCode === 'LOGIN_REQUIRED') {
    return `当前候选还没有进入可自动询价的 1688 商品聊天页，本次还没有成功向 ${fallbackSupplier} 发出询价。`;
  }
  if (failureCode === 'CHAT_TAB_NOT_FOUND') {
    return `当前候选暂时没有定位到 ${fallbackSupplier} 的可询价聊天页，本次询价还没有真正发出。`;
  }
  if (failureCode === 'TARGET_RESOLUTION_FAILED') {
    return `当前候选还没能稳定定位到 ${fallbackSupplier} 的询价入口，本次询价暂未发出。`;
  }
  if (
    failureCode === 'SEND_GATEWAY_EMPTY' ||
    failureCode === 'SEND_GATEWAY_NOT_READY' ||
    failureCode === 'SEND_GATEWAY_NOT_DELIVERED' ||
    failureCode === 'SEND_PREPARATION_EXCEPTION' ||
    failureCode === 'SEND_EXECUTION_EXCEPTION' ||
    failureCode === 'SEND_TRIGGER_FAILED' ||
    failureCode === 'SEND_CONFIRMATION_MISSING' ||
    failureCode === 'EMPTY_SEND_TRIGGER' ||
    failureCode === 'SEND_TRIGGER_PARSE_FAILED'
  ) {
    return `系统在向 ${fallbackSupplier} 发起询价时中断了，这次询价还没有真正发出，请稍后重试。`;
  }
  if (failureCode) {
    return `系统暂时没能完成这次向 ${fallbackSupplier} 的询价发送，请稍后重试。`;
  }
  return `本次向 ${fallbackSupplier} 发起询价没有成功，请稍后再试。`;
}
