import { useEffect, useState } from 'react';
import {
  App as AntdApp,
  Form
} from 'antd';
import type { ConfirmDialogState } from './MasterDataConfirmDialog';
import { MasterDataBoardView } from './MasterDataBoardView';
import { useMasterDataBoardOptions } from './useMasterDataBoardOptions';
import { useMasterDataColumns } from './useMasterDataColumns';
import { useMasterDataConfirmationActions } from './useMasterDataConfirmationActions';
import { useMasterDataDataset } from './useMasterDataDataset';
import { useMasterDataRoleMenuActions } from './useMasterDataRoleMenuActions';
import { useMasterDataStoreFinanceActions } from './useMasterDataStoreFinanceActions';
import { useMasterDataUserActions } from './useMasterDataUserActions';
import type {
  MasterDataBoardMode,
  MasterDataUserDetail,
  MasterDataUserDetailState,
  MasterDataUserFormValues
} from './types';
export type { MasterDataBoardMode } from './types';

type Props = {
  mode: MasterDataBoardMode;
  operatorUserId?: number;
  operatorRoleId?: number;
  operatorRoleLevel?: number;
  operatorStores?: Array<{
    storeCode: string;
    projectCode?: string;
    projectName?: string;
    site?: string;
  }>;
  refreshSignal?: number;
  onDataChanged?: () => void;
};

function useMasterDataBoardModel({
  mode,
  operatorUserId,
  operatorRoleLevel,
  operatorStores = [],
  refreshSignal,
  onDataChanged
}: Props) {
  const { message: messageApi } = AntdApp.useApp();
  const dataset = useMasterDataDataset({ mode, operatorUserId, operatorRoleLevel, refreshSignal, messageApi });
  const {
    roles, menus,
    loading, listRefreshing, userKeyword, setUserKeyword,
    userTypeFilter, setUserTypeFilter,
    userStatusFilter, setUserStatusFilter, menuKeyword, setMenuKeyword,
    assigningUserId, setAssigningUserId, isMerchantAccountView, panelStyle,
    loadBoard, refreshCurrentList,
    filteredUserRows, filteredMenus, roleAssignmentRows, roleAssignmentStats
  } = dataset;
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailState, setDetailState] = useState<MasterDataUserDetailState>({ status: 'idle' });
  const [expandedMerchantId, setExpandedMerchantId] = useState<number | null>(null);
  const [expandedMerchantDetail, setExpandedMerchantDetail] = useState<MasterDataUserDetail | null>(null);
  const [expandedMerchantLoading, setExpandedMerchantLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [userForm] = Form.useForm<MasterDataUserFormValues>();
  const watchedRoleId = Form.useWatch('roleId', userForm);
  const watchedStoreGroupKeys = (Form.useWatch('storeGroupKeys', userForm) as string[] | undefined) ?? [];

  const boardOptions = useMasterDataBoardOptions({
    roles,
    menus,
    operatorRoleLevel,
    operatorStores,
    watchedRoleId
  });
  const {
    assignableRoles,
    assignableRoleOptions,
    merchantDefaultRoleId,
    groupedOperatorStores,
    storeTransferData,
    expandStoreGroupKeys,
    watchedRoleAllStores,
    menuNameMap,
    roleTreeOptions,
    menuTreeData
  } = boardOptions;

  const storeFinanceActions = useMasterDataStoreFinanceActions({
    operatorUserId, groupedOperatorStores,
    loadBoard, detailState, setDetailState, onDataChanged,
    expandedMerchantId, setExpandedMerchantDetail, messageApi
  });
  const {
    storeAssignmentOpen, setStoreAssignmentOpen, storeAssignmentLoading,
    storeAssignmentSubmitting, storeAssignmentUser, storeAssignmentGroupKeys,
    setStoreAssignmentGroupKeys,
    setStoreAssignmentCurrentGroups, storeAssignmentError, setStoreAssignmentError,
    storeAssignmentTransferData, allOperatorStoreGroupKeys,
    openStoreAssignment, submitStoreAssignment,
    quotaModalOpen, setQuotaModalOpen, quotaSubmitting, quotaTargetUser,
    quotaTargetStore, setQuotaTargetStore, quotaForm, openQuotaModal, submitQuota,
    paymentModalOpen, setPaymentModalOpen, paymentModalLoading, paymentTargetUser,
    paymentRecords, setPaymentRecords, paymentAddModalOpen, setPaymentAddModalOpen,
    paymentSubmitting, paymentForm, openPaymentModal, submitPayment
  } = storeFinanceActions;

  const roleMenuActions = useMasterDataRoleMenuActions({
    operatorUserId, messageApi, onDataChanged, setConfirmDialog, loadBoard
  });
  const {
    roleModalOpen, setRoleModalOpen, editingRole, roleSubmitting, roleForm,
    menuModalOpen, setMenuModalOpen, editingMenu, menuSubmitting, menuForm,
    openRoleModal, openMenuModal, submitRole, submitMenu,
    confirmDeleteRole, confirmDeleteMenu
  } = roleMenuActions;

  const userActions = useMasterDataUserActions({
    operatorUserId, merchantDefaultRoleId,
    expandStoreGroupKeys, watchedRoleAllStores, allOperatorStoreGroupKeys,
    loadBoard, onDataChanged,
    setDetailState, setDetailOpen, setExpandedMerchantId,
    setExpandedMerchantDetail, setExpandedMerchantLoading,
    expandedMerchantId, messageApi, setConfirmDialog,
    userForm
  });
  const {
    userModalOpen, setUserModalOpen, userModalKind, editingUser,
    userSubmitting, userSubmitError, setUserSubmitError,
    togglingUserId, resettingUserId,
    toggleMerchantStores, openUserModal, submitUser,
    handleToggleStatus, handleResetPassword, confirmToggleStatus, confirmResetPassword
  } = userActions;

  useEffect(() => {
    if (userModalOpen && userModalKind === 'member' && !editingUser && watchedRoleAllStores) {
      userForm.setFieldValue('storeGroupKeys', allOperatorStoreGroupKeys);
    }
  }, [allOperatorStoreGroupKeys, editingUser, userForm, userModalKind, userModalOpen, watchedRoleAllStores]);

  const { handleAssignRole, submitConfirmDialog } = useMasterDataConfirmationActions({
    operatorUserId,
    assigningUserIdSetter: setAssigningUserId,
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
  });

  const {
    userManageColumns,
    teamManageColumns,
    roleAssignColumns,
    roleColumns,
    menuColumns,
    renderExpandedMerchantStores
  } = useMasterDataColumns({
    assignableRoleOptions,
    assignableRoles,
    assigningUserId,
    confirmDeleteMenu,
    confirmDeleteRole,
    confirmResetPassword,
    confirmToggleStatus,
    expandedMerchantDetail,
    expandedMerchantId,
    expandedMerchantLoading,
    handleAssignRole,
    menuNameMap,
    openMenuModal,
    openPaymentModal,
    openQuotaModal,
    openRoleModal,
    openStoreAssignment,
    openUserModal,
    resettingUserId,
    roles,
    toggleMerchantStores,
    togglingUserId
  });

  const confirmOkDanger =
    confirmDialog?.type === 'delete-role' ||
    confirmDialog?.type === 'delete-menu' ||
    confirmDialog?.type === 'clear-stores' ||
    (confirmDialog?.type === 'toggle-user' && confirmDialog.user.status === 1);
  const confirmOkDisabled = confirmDialog?.type === 'delete-role' && confirmDialog.role.systemRole;

  return {
    mode, loading, panelStyle,
    userModes: {
      mode, listRefreshing, refreshCurrentList,
      isMerchantAccountView, openUserModal,
      userKeyword, setUserKeyword,
      userTypeFilter, setUserTypeFilter,
      userStatusFilter, setUserStatusFilter,
      filteredUserRows, userManageColumns, teamManageColumns,
      expandedMerchantId, renderExpandedMerchantStores,
      roleAssignmentStats, roleAssignmentRows,
      roleAssignColumns
    },
    systemModes: {
      mode, panelStyle, listRefreshing, refreshCurrentList,
      openRoleModal, openMenuModal,
      roles, roleColumns,
      filteredMenus, menuColumns,
      menuKeyword, setMenuKeyword
    },
    userDetailModal: {
      isMerchantAccountView, detailOpen, setDetailOpen,
      detailState, openQuotaModal
    },
    userEditorModals: {
      confirmSubmitting, confirmDialog,
      confirmOkDanger, confirmOkDisabled,
      setConfirmDialog, submitConfirmDialog,
      userSubmitting, userModalOpen, userModalKind,
      editingUser, userForm, submitUser,
      setUserSubmitError, messageApi, userSubmitError,
      assignableRoleOptions, storeTransferData,
      watchedRoleAllStores, allOperatorStoreGroupKeys, watchedStoreGroupKeys,
      setUserModalOpen
    },
    storeQuotaModals: {
      setConfirmDialog, storeAssignmentSubmitting,
      storeAssignmentOpen, storeAssignmentUser, storeAssignmentLoading,
      setStoreAssignmentOpen, setStoreAssignmentCurrentGroups,
      setStoreAssignmentError, submitStoreAssignment, storeAssignmentError,
      storeAssignmentTransferData, storeAssignmentGroupKeys,
      setStoreAssignmentGroupKeys, quotaSubmitting, quotaModalOpen,
      quotaTargetStore, quotaTargetUser,
      setQuotaModalOpen, setQuotaTargetStore, submitQuota,
      quotaForm
    },
    paymentModals: {
      paymentModalOpen, paymentTargetUser,
      setPaymentModalOpen, setPaymentRecords,
      paymentRecords, paymentModalLoading,
      setPaymentAddModalOpen, paymentAddModalOpen,
      paymentSubmitting, paymentForm,
      submitPayment
    },
    roleMenuModals: {
      roleSubmitting, roleModalOpen, editingRole,
      setRoleModalOpen, submitRole, roleForm,
      roleTreeOptions, menuTreeData,
      menuSubmitting, menuModalOpen, editingMenu,
      setMenuModalOpen, submitMenu,
      menuForm
    }
  };
}

export type MasterDataBoardModel = ReturnType<typeof useMasterDataBoardModel>;

export function MasterDataBoard(props: Props) {
  return <MasterDataBoardView model={useMasterDataBoardModel(props)} />;
}
