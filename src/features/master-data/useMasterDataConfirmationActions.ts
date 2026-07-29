import { useCallback } from 'react';
import { normalizeError } from '../../shared/api';
import {
  assignMasterDataRole,
  deleteMasterDataMenu,
  deleteMasterDataRole,
  fetchMasterDataUserDetail
} from './api';
import type { ConfirmDialogState } from './MasterDataConfirmDialog';
import type { MasterDataUser, MasterDataUserDetail } from './types';

type MessageApi = {
  success: (content: string) => void;
  error: (content: string) => void;
};

type Options = {
  operatorUserId?: number;
  assigningUserIdSetter: (value?: number) => void;
  confirmDialog: ConfirmDialogState | null;
  setConfirmDialog: (value: ConfirmDialogState | null) => void;
  setConfirmSubmitting: (value: boolean) => void;
  setStoreAssignmentGroupKeys: (value: string[]) => void;
  detailState: { status: string; data?: MasterDataUserDetail };
  setDetailState: (value: { status: 'success'; data: MasterDataUserDetail }) => void;
  loadBoard: () => Promise<void>;
  onDataChanged?: () => void;
  handleToggleStatus: (user: MasterDataUser) => Promise<void>;
  handleResetPassword: (user: MasterDataUser) => Promise<void>;
  messageApi: MessageApi;
};

export function useMasterDataConfirmationActions({
  operatorUserId,
  assigningUserIdSetter,
  confirmDialog,
  setConfirmDialog,
  setConfirmSubmitting,
  setStoreAssignmentGroupKeys,
  detailState,
  setDetailState,
  loadBoard,
  onDataChanged,
  handleToggleStatus,
  handleResetPassword,
  messageApi
}: Options) {
  const handleAssignRole = useCallback(
    async (user: MasterDataUser, roleId: number) => {
      assigningUserIdSetter(user.id);
      try {
        const payload = await assignMasterDataRole({ userId: user.id, roleId, operatorUserId });
        messageApi.success(payload.message || '角色分配已更新');
        await loadBoard();
        if (detailState.status === 'success' && detailState.data?.id === user.id) {
          setDetailState({
            status: 'success',
            data: await fetchMasterDataUserDetail(user.id)
          });
        }
        onDataChanged?.();
      } catch (error) {
        messageApi.error(normalizeError(error, '角色分配失败'));
      } finally {
        assigningUserIdSetter(undefined);
      }
    },
    [assigningUserIdSetter, detailState, loadBoard, messageApi, onDataChanged, operatorUserId, setDetailState]
  );

  const submitConfirmDialog = useCallback(async () => {
    if (!confirmDialog) {
      return;
    }

    setConfirmSubmitting(true);
    try {
      if (confirmDialog.type === 'toggle-user') {
        await handleToggleStatus(confirmDialog.user);
      } else if (confirmDialog.type === 'reset-password') {
        await handleResetPassword(confirmDialog.user);
      } else if (confirmDialog.type === 'clear-stores') {
        setStoreAssignmentGroupKeys([]);
      } else if (confirmDialog.type === 'delete-role') {
        if (confirmDialog.role.systemRole) {
          messageApi.error('系统预设角色不能删除。');
          return;
        }
        const payload = await deleteMasterDataRole(confirmDialog.role.id, operatorUserId);
        messageApi.success(payload.message || '角色已删除');
        await loadBoard();
        onDataChanged?.();
      } else if (confirmDialog.type === 'delete-menu') {
        const payload = await deleteMasterDataMenu(confirmDialog.menu.id, operatorUserId);
        messageApi.success(payload.message || '菜单已删除');
        await loadBoard();
        onDataChanged?.();
      }
      setConfirmDialog(null);
    } catch (error) {
      const fallback =
        confirmDialog.type === 'delete-role'
          ? '删除角色失败'
          : confirmDialog.type === 'delete-menu'
            ? '删除菜单失败'
            : confirmDialog.type === 'reset-password'
              ? '重置密码失败'
              : confirmDialog.type === 'clear-stores'
                ? '清空负责店铺失败'
                : '调整账号状态失败';
      messageApi.error(normalizeError(error, fallback));
    } finally {
      setConfirmSubmitting(false);
    }
  }, [
    confirmDialog,
    handleResetPassword,
    handleToggleStatus,
    loadBoard,
    messageApi,
    onDataChanged,
    operatorUserId,
    setConfirmDialog,
    setConfirmSubmitting,
    setStoreAssignmentGroupKeys
  ]);

  return { handleAssignRole, submitConfirmDialog };
}
