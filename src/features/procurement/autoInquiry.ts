import type { ProcurementAutoInquiryWorkbenchState, ProcurementCandidate } from './types';
import {
  procurementAutoInquiryBusinessFailureReason,
  procurementAutoInquiryValidationFailed
} from './autoInquiryValidation';

export * from './autoInquiryValidation';

export function procurementAutoInquiryBusinessMeta(
  state: ProcurementAutoInquiryWorkbenchState | undefined,
  candidate?: ProcurementCandidate
) {
  const supplierName =
    (state?.status === 'success' ? state.data.latestTask?.targetSupplierIdentity || state.data.candidate?.supplierName : undefined) ||
    candidate?.supplierName ||
    '当前供应商';
  const inquirySummary =
    (state?.status === 'success' ? state.data.latestTask?.inputPreviewText : undefined) ||
    candidate?.inquirySummaryLine ||
    candidate?.inquiryOpeningLine ||
    '系统会按当前候选信息生成询价内容。';

  if (!state || state.status === 'idle') {
    return {
      tagColor: 'default' as const,
      alertType: 'info' as const,
      businessStatus: '未发起',
      summary: `当前还没有向 ${supplierName} 发起自动询价。`,
      supplierName,
      inquirySummary,
      sentAt: undefined,
      failureReason: undefined
    };
  }

  if (state.status === 'loading') {
    return {
      tagColor: 'processing' as const,
      alertType: 'info' as const,
      businessStatus: '正在发起',
      summary: `系统正在向 ${supplierName} 发起自动询价，请稍候，页面会自动更新结果。`,
      supplierName,
      inquirySummary,
      sentAt: undefined,
      failureReason: undefined
    };
  }

  if (state.status === 'error') {
    return {
      tagColor: 'error' as const,
      alertType: 'error' as const,
      businessStatus: '发起失败',
      summary: '当前自动询价结果暂时不可读取。',
      supplierName,
      inquirySummary,
      sentAt: undefined,
      failureReason: state.message
    };
  }

  const task = state.data.latestTask;
  if (!task) {
    return {
      tagColor: 'default' as const,
      alertType: 'info' as const,
      businessStatus: '未发起',
      summary: `当前还没有向 ${supplierName} 发起自动询价。`,
      supplierName,
      inquirySummary,
      sentAt: undefined,
      failureReason: undefined
    };
  }

  const normalizedStatus = (task.status ?? '').toUpperCase();
  if (procurementAutoInquiryValidationFailed(task)) {
    return {
      tagColor: 'error' as const,
      alertType: 'error' as const,
      businessStatus: '发起失败',
      summary: `这次向 ${supplierName} 发起自动询价没有成功。`,
      supplierName,
      inquirySummary,
      sentAt: task.sentAt || task.confirmedAt,
      failureReason: procurementAutoInquiryBusinessFailureReason(task, supplierName)
    };
  }

  if (normalizedStatus === 'CHATTING') {
    return {
      tagColor: 'success' as const,
      alertType: 'success' as const,
      businessStatus: '询价中',
      summary: `已向 ${supplierName} 发起询价，当前正在等待或处理供应商回复。`,
      supplierName,
      inquirySummary,
      sentAt: task.sentAt || task.confirmedAt,
      failureReason: undefined
    };
  }

  if (normalizedStatus === 'SENT') {
    return {
      tagColor: 'success' as const,
      alertType: 'success' as const,
      businessStatus: '已发送',
      summary: `已向 ${supplierName} 发起自动询价，当前等待供应商回复。`,
      supplierName,
      inquirySummary,
      sentAt: task.sentAt || task.confirmedAt,
      failureReason: undefined
    };
  }

  return {
    tagColor: 'processing' as const,
    alertType: 'info' as const,
    businessStatus: '正在发起',
    summary: `系统正在向 ${supplierName} 发起自动询价，请稍候，页面会自动更新结果。`,
    supplierName,
    inquirySummary,
    sentAt: task.sentAt || task.confirmedAt,
    failureReason: undefined
  };
}

export function procurementAutoInquiryBusinessShouldPoll(
  state: ProcurementAutoInquiryWorkbenchState | undefined
) {
  if (!state) {
    return false;
  }

  if (state.status === 'loading') {
    return true;
  }

  if (state.status !== 'success') {
    return false;
  }

  const normalizedStatus = (state.data.latestTask?.status ?? '').toUpperCase();
  return normalizedStatus === 'PENDING' || normalizedStatus === 'RUNNING' || normalizedStatus === 'RETRYING';
}

export function procurementAutoInquiryBusinessAction(
  state: ProcurementAutoInquiryWorkbenchState | undefined,
  _candidate?: ProcurementCandidate
) {
  if (!state || state.status === 'idle') {
    return {
      label: '发起自动询价',
      disabled: false
    };
  }

  if (state.status === 'loading') {
    return {
      label: '正在发起自动询价',
      disabled: true
    };
  }

  if (state.status === 'error') {
    return {
      label: '重新发起自动询价',
      disabled: false
    };
  }

  const task = state.data.latestTask;
  if (!task) {
    return {
      label: '发起自动询价',
      disabled: false
    };
  }

  const normalizedStatus = (task.status ?? '').toUpperCase();
  if (normalizedStatus === 'SENT' || normalizedStatus === 'CHATTING') {
    return {
      label: '已发起自动询价',
      disabled: true
    };
  }

  if (procurementAutoInquiryValidationFailed(task)) {
    return {
      label: '重新发起自动询价',
      disabled: false
    };
  }

  return {
    label: '自动询价进行中',
    disabled: true
  };
}

export function procurementCandidateInquiryPathMeta(
  candidate: ProcurementCandidate,
  state: ProcurementAutoInquiryWorkbenchState | undefined
) {
  const action = procurementAutoInquiryBusinessAction(state, candidate);
  if (!action.disabled) {
    return {
      tagColor: 'processing' as const,
      label: '可发起询价',
      helperText: '当前候选已具备自动询价条件，可以直接发起。',
      priority: 100
    };
  }

  const normalizedStatus =
    state?.status === 'success' ? (state.data.latestTask?.status ?? '').toUpperCase() : '';
  if (normalizedStatus === 'SENT' || normalizedStatus === 'CHATTING') {
    return {
      tagColor: 'success' as const,
      label: '已发起询价',
      helperText: '这条候选已经完成发送，可直接查看结果。',
      priority: 80
    };
  }

  if (state?.status === 'loading' || normalizedStatus === 'PENDING' || normalizedStatus === 'RUNNING' || normalizedStatus === 'RETRYING') {
    return {
      tagColor: 'processing' as const,
      label: '询价进行中',
      helperText: '系统正在处理这条候选的自动询价，请稍候刷新结果。',
      priority: 70
    };
  }

  if (
    state?.status === 'error' ||
    (state?.status === 'success' && state.data.latestTask && procurementAutoInquiryValidationFailed(state.data.latestTask))
  ) {
    return {
      tagColor: 'warning' as const,
      label: '可重新发起',
      helperText: '这条候选上次没有发起成功，可以重新尝试。',
      priority: 90
    };
  }

  return {
    tagColor: 'default' as const,
    label: '待补充候选信息',
    helperText: '当前候选还不适合直接自动询价，建议先切换到可发起的候选。',
    priority: 10
  };
}
