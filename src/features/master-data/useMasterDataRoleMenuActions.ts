import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App as AntdApp,
  Form
} from 'antd';
import dayjs from 'dayjs';
import { firstFormValidationMessage, normalizeError } from '../../shared/api';
import {
  isAllStoresRole,
  roleNameLabel
} from './display';
import type { ConfirmDialogState } from './MasterDataConfirmDialog';
import { MasterDataBoardView } from './MasterDataBoardView';
import {
  buildStoreTransferGroupsFromLinks,
  buildStoreTransferGroupsFromSources,
  expandStoreGroupKeys as expandStoreTransferGroupKeys,
  mergeStoreTransferGroup,
  toTransferData,
  type StoreTransferGroup
} from './storeTransfer';
import {
  addMasterDataPayment,
  assignMasterDataStores,
  assignMasterDataRole,
  createMasterDataUser,
  createMasterDataMenu,
  createMasterDataRole,
  deleteMasterDataMenu,
  deleteMasterDataRole,
  fetchMasterDataMenus,
  fetchMasterDataPayments,
  fetchMasterDataRoles,
  fetchMasterDataUserDetail,
  fetchMasterDataUsers,
  resetMasterDataUserPassword,
  toggleMasterDataUserStatus,
  updateMasterDataQuota,
  updateMasterDataStoreQuota,
  updateMasterDataUser,
  updateMasterDataMenu,
  updateMasterDataRole
} from './api';
import { useMasterDataColumns } from './useMasterDataColumns';
import { useMasterDataDataset } from './useMasterDataDataset';
import type {
  MasterDataAssignStoresPayload,
  MasterDataAddPaymentPayload,
  MasterDataMenu,
  MasterDataPaymentRecord,
  MasterDataRole,
  MasterDataSaveMenuPayload,
  MasterDataSaveRolePayload,
  MasterDataSaveUserPayload,
  MasterDataUpdateQuotaPayload,
  MasterDataUser,
  MasterDataUserDetail
} from './types';

export function useMasterDataRoleMenuActions({
  operatorUserId, roles, menus, setRoles, setMenus,
  menuNameMap, messageApi, onDataChanged, setConfirmDialog, loadBoard
}: any) {
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MasterDataRole | null>(null);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MasterDataMenu | null>(null);
  const [menuSubmitting, setMenuSubmitting] = useState(false);
  const [roleForm] = Form.useForm<any>();
  const [menuForm] = Form.useForm<any>();

  const openRoleModal = useCallback((role?: MasterDataRole) => {
    setEditingRole(role ?? null);
    roleForm.resetFields();
    if (role) {
      roleForm.setFieldsValue({
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description,
        parentId: role.parentId || undefined,
        level: role.level,
        menuIds: role.menuIds
      });
    } else {
      roleForm.setFieldsValue({
        menuIds: [],
        parentId: undefined,
        level: 3
      });
    }
    setRoleModalOpen(true);
  }, [roleForm]);

  const openMenuModal = useCallback((menu?: MasterDataMenu) => {
    setEditingMenu(menu ?? null);
    menuForm.resetFields();
    if (menu) {
      menuForm.setFieldsValue({
        id: menu.id,
        name: menu.name,
        parentId: menu.parentId || undefined,
        urlPath: menu.urlPath
      });
    } else {
      menuForm.setFieldsValue({
        parentId: undefined
      });
    }
    setMenuModalOpen(true);
  }, [menuForm]);

  const submitRole = useCallback(async () => {
    try {
      const values = await roleForm.validateFields();
      setRoleSubmitting(true);
      const payload: MasterDataSaveRolePayload = {
        ...values,
        menuIds: values.menuIds ?? [],
        operatorUserId
      };
      if (editingRole) {
        const result = await updateMasterDataRole(editingRole.id, payload);
        messageApi.success(result.message || '角色已更新');
      } else {
        const result = await createMasterDataRole(payload);
        messageApi.success(result.message || '角色已新增');
      }
      setRoleModalOpen(false);
      await loadBoard();
      onDataChanged?.();
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '角色保存失败'));
    } finally {
      setRoleSubmitting(false);
    }
  }, [editingRole, loadBoard, onDataChanged, operatorUserId, roleForm]);

  const submitMenu = useCallback(async () => {
    try {
      const values = await menuForm.validateFields();
      setMenuSubmitting(true);
      const payload: MasterDataSaveMenuPayload = {
        ...values,
        operatorUserId
      };
      if (editingMenu) {
        const result = await updateMasterDataMenu(editingMenu.id, payload);
        messageApi.success(result.message || '菜单已更新');
      } else {
        const result = await createMasterDataMenu(payload);
        messageApi.success(result.message || '菜单已新增');
      }
      setMenuModalOpen(false);
      await loadBoard();
      onDataChanged?.();
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '菜单保存失败'));
    } finally {
      setMenuSubmitting(false);
    }
  }, [editingMenu, loadBoard, menuForm, onDataChanged, operatorUserId]);

  const confirmDeleteRole = useCallback((role: MasterDataRole) => {
    setConfirmDialog({ type: 'delete-role', role });
  }, []);

  const confirmDeleteMenu = useCallback((menu: MasterDataMenu) => {
    setConfirmDialog({ type: 'delete-menu', menu });
  }, []);

  return {
    roleModalOpen, setRoleModalOpen, editingRole, roleSubmitting, roleForm,
    menuModalOpen, setMenuModalOpen, editingMenu, menuSubmitting, menuForm,
    openRoleModal, openMenuModal, submitRole, submitMenu,
    confirmDeleteRole, confirmDeleteMenu
  };
}
