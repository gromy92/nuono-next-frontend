import type { MasterDataMenu, MasterDataRole, MasterDataUser } from './types';

export type ConfirmDialogState =
  | { type: 'toggle-user'; user: MasterDataUser; actionText: '停用' | '禁用' | '启用' }
  | { type: 'reset-password'; user: MasterDataUser }
  | { type: 'clear-stores' }
  | { type: 'delete-role'; role: MasterDataRole }
  | { type: 'delete-menu'; menu: MasterDataMenu };

function userDisplayName(user: MasterDataUser) {
  return user.realName || user.accountNo;
}

export function confirmDialogTitle(dialog: ConfirmDialogState | null) {
  if (!dialog) {
    return '';
  }
  switch (dialog.type) {
    case 'toggle-user':
      return `确定${dialog.actionText}账号“${userDisplayName(dialog.user)}”吗？`;
    case 'reset-password':
      return `确定重置账号“${userDisplayName(dialog.user)}”的密码吗？`;
    case 'clear-stores':
      return '确定清空负责店铺吗？';
    case 'delete-role':
      return `确定删除角色“${dialog.role.name}”吗？`;
    case 'delete-menu':
      return `确定删除菜单“${dialog.menu.name}”吗？`;
  }
}

export function confirmDialogContent(dialog: ConfirmDialogState | null) {
  if (!dialog) {
    return '';
  }
  switch (dialog.type) {
    case 'toggle-user':
      return dialog.user.status === 1
        ? `${dialog.actionText}后该账号将暂时无法继续登录新系统。`
        : '启用后该账号会恢复当前角色和菜单访问能力。';
    case 'reset-password':
      return '系统会按当前规则重置密码，成员需要使用新密码重新登录。';
    case 'clear-stores':
      return '清空后该账号将不再负责当前范围内的店铺。';
    case 'delete-role':
      return dialog.role.systemRole ? '系统预设角色不能删除。' : '删除后当前角色将从角色维护列表移除。';
    case 'delete-menu':
      return '删除后对应角色的菜单范围会同步去掉这条菜单。';
  }
}

export function confirmDialogOkText(dialog: ConfirmDialogState | null) {
  if (!dialog) {
    return '确定';
  }
  switch (dialog.type) {
    case 'toggle-user':
      return dialog.actionText;
    case 'reset-password':
      return '重置密码';
    case 'clear-stores':
      return '清空';
    case 'delete-role':
    case 'delete-menu':
      return '删除';
  }
}
