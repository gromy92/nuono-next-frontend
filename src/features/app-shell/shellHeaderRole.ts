import type { AuthSession } from '../auth/session';
import { isBossOperatorView } from './WorkspaceRouting';

export const shellRoleColorMap: Record<string, string> = {
  系统管理员: '#722ed1',
  管理员: '#722ed1',
  老板: '#722ed1',
  运营主管: '#fa8c16',
  运营: '#1677ff',
  采购: '#52c41a',
  仓管: '#13c2c2'
};

export function shellRoleDisplayName(session?: AuthSession | null) {
  if (isBossOperatorView(session ?? null)) {
    return '运营';
  }
  return session?.roleName || '';
}

export function shellRoleAvatarText(session?: AuthSession | null) {
  const roleName = shellRoleDisplayName(session);
  if (!roleName) {
    return '角色';
  }
  if (roleName.includes('管理员')) {
    return '管理员';
  }
  if (roleName.includes('主管')) {
    return '主管';
  }
  if (roleName.length <= 2) {
    return roleName;
  }
  return roleName.slice(0, 2);
}
