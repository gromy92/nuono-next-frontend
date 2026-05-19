import dayjs from 'dayjs';

export function roleLevelLabel(level?: number) {
  if (level == null) {
    return '-';
  }
  if (level === 0) {
    return '超管';
  }
  if (level === 1) {
    return '老板';
  }
  if (level === 2) {
    return '主管';
  }
  if (level === 3) {
    return '员工';
  }
  return `L${level}`;
}

export function roleNameLabel(roleName?: string) {
  const normalizedName = (roleName || '').trim();
  if (normalizedName === '运营') {
    return '运营负责人';
  }
  if (normalizedName === '仓管') {
    return '仓管负责人';
  }
  if (normalizedName === '采购') {
    return '采购负责人';
  }
  return normalizedName || '未分配';
}

export function accountTypeLabel(accountType?: string) {
  if ((accountType || '').toLowerCase() === 'internal') {
    return '内部';
  }
  if ((accountType || '').toLowerCase() === 'external') {
    return '外部';
  }
  return '-';
}

export function accountTypeColor(accountType?: string) {
  return (accountType || '').toLowerCase() === 'internal' ? 'blue' : 'green';
}

export function bindingStatusLabel(bindingStatus: string) {
  switch ((bindingStatus || '').toUpperCase()) {
    case 'PROJECT_BOUND':
      return '项目已绑定';
    case 'ACCOUNT_ONLY':
      return '仅账号已绑定';
    default:
      return '未绑定';
  }
}

export function bindingStatusColor(bindingStatus: string) {
  switch ((bindingStatus || '').toUpperCase()) {
    case 'PROJECT_BOUND':
      return 'green';
    case 'ACCOUNT_ONLY':
      return 'orange';
    default:
      return 'default';
  }
}

export function formatDateOnly(value?: string) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-';
}

export function formatDateTime(value?: string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function isAllStoresRole(role?: { name?: string; code?: string; roleName?: string } | null) {
  if (!role) {
    return false;
  }
  const roleCode = String(role.code || '').toUpperCase();
  const roleName = role.name || role.roleName || '';
  return roleCode === 'PURCHASE' || roleCode === 'WAREHOUSE' || roleName.includes('采购') || roleName.includes('仓管');
}
