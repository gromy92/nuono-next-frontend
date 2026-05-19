import type {
  AiParseChangeType,
  AiParseConfidence,
  AiParseReviewStatus,
  AiParseRole,
  AiParseRolePermission,
  AiParseTaskStatus,
  AiParseValidationStatus
} from './types';

export const rolePermissions: Record<AiParseRole, AiParseRolePermission> = {
  admin: {
    role: 'admin',
    label: '管理员',
    scope: '全局标准与授权店铺',
    canDraftEdit: true,
    canPublish: true,
    canManageStandard: true
  },
  boss: {
    role: 'boss',
    label: '老板',
    scope: '自己的店铺',
    canDraftEdit: true,
    canPublish: true,
    canManageStandard: false
  },
  opsLead: {
    role: 'opsLead',
    label: '运营主管',
    scope: '被授权店铺',
    canDraftEdit: true,
    canPublish: false,
    canManageStandard: false
  },
  operator: {
    role: 'operator',
    label: '运营',
    scope: '被授权店铺只读',
    canDraftEdit: false,
    canPublish: false,
    canManageStandard: false
  }
};

export const taskStatusMeta: Record<AiParseTaskStatus, { label: string; color: string }> = {
  reading: { label: '待读取', color: 'default' },
  parsing: { label: '解析中', color: 'processing' },
  retry_waiting: { label: '等待重试', color: 'processing' },
  review_required: { label: '待处理', color: 'warning' },
  ready_to_publish: { label: '可发布', color: 'success' },
  published: { label: '已发布', color: 'blue' },
  failed: { label: '失败', color: 'error' }
};

export const changeTypeMeta: Record<AiParseChangeType, { label: string; color: string; className: string }> = {
  added: { label: '新增', color: 'success', className: 'ai-change-added' },
  changed: { label: '变化', color: 'processing', className: 'ai-change-changed' },
  delete_suspected: { label: '删除疑似', color: 'warning', className: 'ai-change-delete' },
  conflict: { label: '冲突', color: 'error', className: 'ai-change-conflict' },
  unchanged: { label: '未变化', color: 'default', className: 'ai-change-unchanged' }
};

export const reviewStatusMeta: Record<AiParseReviewStatus, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'warning' },
  needs_fix: { label: '需修正', color: 'error' },
  confirmed: { label: '已确认', color: 'success' },
  rejected: { label: '已驳回', color: 'default' },
  keep_old: { label: '保留旧值', color: 'blue' },
  hard_error: { label: '硬错误', color: 'error' }
};

export const confidenceMeta: Record<AiParseConfidence, { label: string; color: string }> = {
  high: { label: '高', color: 'success' },
  medium: { label: '中', color: 'processing' },
  low: { label: '低', color: 'warning' }
};

export const validationMeta: Record<AiParseValidationStatus, { label: string; color: string }> = {
  pass: { label: '通过', color: 'success' },
  warning: { label: '警告', color: 'warning' },
  hard_error: { label: '硬错误', color: 'error' }
};

export const visibleReviewFilters: Array<AiParseReviewStatus | 'ALL'> = [
  'ALL',
  'pending',
  'needs_fix',
  'confirmed',
  'rejected',
  'keep_old',
  'hard_error'
];
