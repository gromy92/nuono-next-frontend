import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { firstFormValidationMessage, normalizeError } from '../../shared/api';
import type { ConfirmDialogState } from './MasterDataConfirmDialog';
import {
  createMasterDataUser,
  fetchMasterDataUserDetail,
  resetMasterDataUserPassword,
  toggleMasterDataUserStatus,
  updateMasterDataUser
} from './api';
import type {
  MasterDataMessageApi,
  MasterDataSaveUserPayload,
  MasterDataUser,
  MasterDataUserDetail,
  MasterDataUserDetailState,
  MasterDataUserFormValues
} from './types';

type Options = {
  operatorUserId?: number;
  merchantDefaultRoleId?: number;
  expandStoreGroupKeys: (groupKeys?: string[]) => string[];
  watchedRoleAllStores: boolean;
  allOperatorStoreGroupKeys: string[];
  loadBoard: () => Promise<void>;
  onDataChanged?: () => void;
  setDetailState: Dispatch<SetStateAction<MasterDataUserDetailState>>;
  setDetailOpen: Dispatch<SetStateAction<boolean>>;
  setExpandedMerchantId: Dispatch<SetStateAction<number | null>>;
  setExpandedMerchantDetail: Dispatch<SetStateAction<MasterDataUserDetail | null>>;
  setExpandedMerchantLoading: Dispatch<SetStateAction<boolean>>;
  expandedMerchantId: number | null;
  messageApi: MasterDataMessageApi;
  setConfirmDialog: Dispatch<SetStateAction<ConfirmDialogState | null>>;
  userForm: FormInstance<MasterDataUserFormValues>;
};

export function useMasterDataUserActions({
  operatorUserId, merchantDefaultRoleId,
  expandStoreGroupKeys, watchedRoleAllStores, allOperatorStoreGroupKeys,
  loadBoard, onDataChanged,
  setDetailState, setDetailOpen, setExpandedMerchantId,
  setExpandedMerchantDetail, setExpandedMerchantLoading,
  expandedMerchantId, messageApi, setConfirmDialog,
  userForm
}: Options) {
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalKind, setUserModalKind] = useState<'merchant' | 'member'>('member');
  const [editingUser, setEditingUser] = useState<MasterDataUser | null>(null);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userSubmitError, setUserSubmitError] = useState<string>();
  const [togglingUserId, setTogglingUserId] = useState<number>();
  const [resettingUserId, setResettingUserId] = useState<number>();
  const openUserDetail = useCallback(async (userId: number) => {
    setDetailOpen(true);
    setDetailState({ status: 'loading' });
    try {
      const payload = await fetchMasterDataUserDetail(userId);
      setDetailState({ status: 'success', data: payload });
    } catch (error) {
      setDetailState({ status: 'error', message: normalizeError(error, '用户详情暂时不可用') });
    }
  }, []);

  const toggleMerchantStores = useCallback(async (user: MasterDataUser) => {
    if (expandedMerchantId === user.id) {
      setExpandedMerchantId(null);
      setExpandedMerchantDetail(null);
      return;
    }

    setExpandedMerchantId(user.id);
    setExpandedMerchantDetail(null);
    setExpandedMerchantLoading(true);
    try {
      const payload = await fetchMasterDataUserDetail(user.id);
      setExpandedMerchantDetail(payload);
    } catch (error) {
      messageApi.error(normalizeError(error, '加载店铺列表失败'));
      setExpandedMerchantDetail(null);
    } finally {
      setExpandedMerchantLoading(false);
    }
  }, [expandedMerchantId]);

  const openUserModal = useCallback(
    (kind: 'merchant' | 'member', user?: MasterDataUser) => {
      setUserModalKind(kind);
      setEditingUser(user ?? null);
      setUserSubmitError(undefined);
      userForm.resetFields();
      if (user) {
        userForm.setFieldsValue({
          accountNo: user.accountNo,
          realName: user.realName,
          phone: user.phone,
          email: user.email,
          accountType: user.accountType,
          companyName: user.companyName,
          roleId: user.roleId,
          expiredTime: user.expiredTime ? dayjs(user.expiredTime) : undefined
        });
      } else {
        userForm.setFieldsValue({
          accountType: kind === 'merchant' ? 'external' : 'internal',
          roleId: kind === 'merchant' ? merchantDefaultRoleId : undefined,
          storeGroupKeys: []
        });
      }
      setUserModalOpen(true);
    },
    [merchantDefaultRoleId, userForm]
  );

  const submitUser = useCallback(async () => {
    setUserSubmitError(undefined);
    try {
      const values = await userForm.validateFields();
      setUserSubmitting(true);
      const payload: MasterDataSaveUserPayload = {
        accountNo: values.accountNo,
        realName: values.realName,
        phone: values.phone,
        email: values.email,
        password: values.password,
        accountType: userModalKind === 'merchant' ? values.accountType : 'internal',
        companyName: values.companyName,
        operatorUserId,
        expiredTime: values.expiredTime ? values.expiredTime.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined
      };

      if (userModalKind === 'merchant') {
        payload.roleId = editingUser?.roleId || merchantDefaultRoleId;
      } else {
        payload.roleId = editingUser?.roleId || values.roleId;
        payload.storeCodes = watchedRoleAllStores
          ? expandStoreGroupKeys(allOperatorStoreGroupKeys)
          : expandStoreGroupKeys(values.storeGroupKeys || []);
      }

      if (!payload.roleId) {
        throw new Error(userModalKind === 'merchant' ? '当前还没有老板角色样本，暂时不能创建商家。' : '请选择角色。');
      }

      if (editingUser) {
        const result = await updateMasterDataUser(editingUser.id, payload);
        messageApi.success(result.message || '账号已更新');
      } else {
        const result = await createMasterDataUser(payload);
        messageApi.success(result.message || '账号已创建');
      }
      setUserModalOpen(false);
      await loadBoard();
      onDataChanged?.();
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        setUserSubmitError(validationMessage);
        messageApi.warning(validationMessage);
        return;
      }
      const errorMessage = normalizeError(error, '账号保存失败');
      setUserSubmitError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setUserSubmitting(false);
    }
  }, [allOperatorStoreGroupKeys, editingUser, expandStoreGroupKeys, loadBoard, merchantDefaultRoleId, messageApi, onDataChanged, operatorUserId, userForm, userModalKind, watchedRoleAllStores]);

  const handleToggleStatus = useCallback(
    async (user: MasterDataUser) => {
      setTogglingUserId(user.id);
      try {
        const payload = await toggleMasterDataUserStatus(user.id, {
          status: user.status === 1 ? 0 : 1,
          operatorUserId
        });
        messageApi.success(payload.message || '账号状态已更新');
        await loadBoard();
        onDataChanged?.();
      } catch (error) {
        messageApi.error(normalizeError(error, '调整账号状态失败'));
      } finally {
        setTogglingUserId(undefined);
      }
    },
    [loadBoard, onDataChanged, operatorUserId]
  );

  const handleResetPassword = useCallback(
    async (user: MasterDataUser) => {
      setResettingUserId(user.id);
      try {
        const payload = await resetMasterDataUserPassword(user.id, {
          operatorUserId
        });
        messageApi.success(payload.message || '密码已重置');
      } catch (error) {
        messageApi.error(normalizeError(error, '重置密码失败'));
      } finally {
        setResettingUserId(undefined);
      }
    },
    [operatorUserId]
  );

  const confirmToggleStatus = useCallback(
    (user: MasterDataUser, disableActionText: '停用' | '禁用' = '禁用') => {
      const actionText = user.status === 1 ? disableActionText : '启用';
      setConfirmDialog({ type: 'toggle-user', user, actionText });
    },
    []
  );

  const confirmResetPassword = useCallback(
    (user: MasterDataUser) => {
      setConfirmDialog({ type: 'reset-password', user });
    },
    []
  );

  return {
    userModalOpen, setUserModalOpen, userModalKind, editingUser,
    userSubmitting, userSubmitError, setUserSubmitError,
    togglingUserId, resettingUserId,
    openUserDetail, toggleMerchantStores, openUserModal, submitUser,
    handleToggleStatus, handleResetPassword, confirmToggleStatus, confirmResetPassword
  };
}
