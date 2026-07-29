import type { ProcurementCandidatePoolPayload } from './types';

export function procurementOrderStatusMeta(status?: string) {
  if (status === 'DECIDED') {
    return { label: '全部已决策', color: 'success' as const };
  }
  if (status === 'PARTIAL_DECIDED') {
    return { label: '部分已决策', color: 'processing' as const };
  }
  if (status === 'SCREENING') {
    return { label: '筛选中', color: 'warning' as const };
  }
  return { label: status || '待处理', color: 'default' as const };
}

export function procurementTaskStatusMeta(status?: string) {
  if (status === 'SUCCESS') {
    return { label: '已完成', color: 'success' as const };
  }
  if (status === 'PARTIAL_SUCCESS') {
    return { label: '部分完成', color: 'warning' as const };
  }
  if (status === 'RUNNING') {
    return { label: '执行中', color: 'processing' as const };
  }
  if (status === 'FAILED') {
    return { label: '失败', color: 'error' as const };
  }
  if (status === 'QUEUED') {
    return { label: '排队中', color: 'default' as const };
  }
  return { label: status || '未开始', color: 'default' as const };
}

export function procurementCandidateLevelMeta(level?: string) {
  if (level === 'recommended') {
    return { label: '高推荐', color: 'success' as const };
  }
  if (level === 'review') {
    return { label: '待复核', color: 'warning' as const };
  }
  if (level === 'reject') {
    return { label: '淘汰', color: 'default' as const };
  }
  return { label: level || '待判定', color: 'default' as const };
}

export function procurementPlatformLabel(platform?: string) {
  if (platform === 'amazon') {
    return '亚马逊';
  }
  if (platform === 'noon') {
    return 'Noon';
  }
  if (platform === '1688') {
    return '1688';
  }
  return platform || '未知平台';
}

export function procurementSourceTypeLabel(sourceType?: string) {
  if (sourceType === 'LINK_LIST') {
    return '商品链接清单';
  }
  return sourceType || '-';
}

export function procurementPriorityLabel(priority?: string) {
  if (priority === 'HIGH') {
    return '高优先级';
  }
  if (priority === 'NORMAL') {
    return '常规';
  }
  if (priority === 'LOW') {
    return '低优先级';
  }
  return priority || '-';
}

export function procurementSearchModeLabel(searchMode?: string) {
  if (searchMode === 'IMAGE_MULTI') {
    return '多图图搜';
  }
  if (searchMode === 'IMAGE_SINGLE') {
    return '单图图搜';
  }
  if (searchMode === 'SEARCH_PAGE_HTML') {
    return '搜索页导入';
  }
  return searchMode || '待确认';
}

export function procurementItemStatusMeta(status?: string) {
  if (status === 'DECIDED') {
    return { label: '已选意向采购', color: 'success' as const };
  }
  if (status === 'REVIEWING') {
    return { label: '人工复核中', color: 'processing' as const };
  }
  if (status === 'SCREENING') {
    return { label: '自动筛选中', color: 'warning' as const };
  }
  return { label: status || '待处理', color: 'default' as const };
}

export function procurementNextActionMeta(nextAction?: string) {
  if (nextAction === 'INTENT') {
    return { label: '下一步：倾向采购', color: 'default' as const };
  }
  if (nextAction === 'PREPARE_INQUIRY') {
    return { label: '下一步：准备询价', color: 'processing' as const };
  }
  if (nextAction === 'HOLD') {
    return { label: '下一步：暂缓处理', color: 'warning' as const };
  }
  if (nextAction === 'CONTINUE_COMPARE') {
    return { label: '下一步：继续比对', color: 'default' as const };
  }
  return null;
}

export function procurementSourcePlatformColor(platform?: string) {
  if (platform === 'amazon') {
    return 'gold';
  }
  if (platform === 'noon') {
    return 'cyan';
  }
  if (platform === '1688') {
    return 'orange';
  }
  return 'default';
}

export function procurementItemStatusColor(status?: string) {
  if (status === 'DECIDED') {
    return 'success';
  }
  if (status === 'REVIEWING') {
    return 'processing';
  }
  if (status === 'SCREENING') {
    return 'warning';
  }
  return 'default';
}

export function procurementAutoSelectionLabel(
  demandItem?: ProcurementCandidatePoolPayload['demandItems'][number]
) {
  if (!demandItem) {
    return '自动选品';
  }
  if (demandItem.task?.status === 'RUNNING') {
    return '自动选品中';
  }
  return demandItem.candidates.length ? '重新自动选品' : '开始自动选品';
}

export function formatProcurementPriceRange(min?: number, max?: number) {
  if (typeof min === 'number' && typeof max === 'number') {
    return `${min.toFixed(2)} - ${max.toFixed(2)}`;
  }
  if (typeof min === 'number') {
    return `${min.toFixed(2)} 起`;
  }
  if (typeof max === 'number') {
    return `${max.toFixed(2)} 内`;
  }
  return '-';
}
