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

export type MasterDataBoardMode = 'user-account' | 'user-role' | 'system-role' | 'system-menu';

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

type UserDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: MasterDataUserDetail }
  | { status: 'error'; message: string };

type RoleFormValues = Omit<MasterDataSaveRolePayload, 'operatorUserId'>;
type MenuFormValues = Omit<MasterDataSaveMenuPayload, 'operatorUserId'>;
type UserFormValues = {
  accountNo: string;
  realName?: string;
  phone?: string;
  email?: string;
  password?: string;
  accountType?: string;
  companyName?: string;
  roleId?: number;
  expiredTime?: dayjs.Dayjs;
  storeGroupKeys?: string[];
};

type QuotaFormValues = {
  listLimit?: number;
  collectLimit?: number;
  whApLimit?: number;
  chatgptTranslateLimit?: number;
};

type PaymentFormValues = {
  amount: number;
  paymentDate: dayjs.Dayjs;
  remark?: string;
};

type StoreQuotaTarget = MasterDataUserDetail['storeLinks'][number];

export function MasterDataBoard({ mode, operatorUserId, operatorRoleLevel, operatorStores = [], refreshSignal, onDataChanged }: Props) {
  const { message: messageApi } = AntdApp.useApp();
  const [users, setUsers] = useState<MasterDataUser[]>([]);
  const [roles, setRoles] = useState<MasterDataRole[]>([]);
  const [menus, setMenus] = useState<MasterDataMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [userKeyword, setUserKeyword] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<number>();
  const [userTypeFilter, setUserTypeFilter] = useState<string>();
  const [userStatusFilter, setUserStatusFilter] = useState<string>();
  const [menuKeyword, setMenuKeyword] = useState('');
  const [assigningUserId, setAssigningUserId] = useState<number>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailState, setDetailState] = useState<UserDetailState>({ status: 'idle' });
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MasterDataRole | null>(null);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MasterDataMenu | null>(null);
  const [menuSubmitting, setMenuSubmitting] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalKind, setUserModalKind] = useState<'merchant' | 'member'>('member');
  const [editingUser, setEditingUser] = useState<MasterDataUser | null>(null);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userSubmitError, setUserSubmitError] = useState<string>();
  const [storeAssignmentOpen, setStoreAssignmentOpen] = useState(false);
  const [storeAssignmentLoading, setStoreAssignmentLoading] = useState(false);
  const [storeAssignmentSubmitting, setStoreAssignmentSubmitting] = useState(false);
  const [storeAssignmentUser, setStoreAssignmentUser] = useState<MasterDataUser | null>(null);
  const [storeAssignmentGroupKeys, setStoreAssignmentGroupKeys] = useState<string[]>([]);
  const [storeAssignmentCurrentGroups, setStoreAssignmentCurrentGroups] = useState<StoreTransferGroup[]>([]);
  const [storeAssignmentError, setStoreAssignmentError] = useState<string | null>(null);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaSubmitting, setQuotaSubmitting] = useState(false);
  const [quotaTargetUser, setQuotaTargetUser] = useState<MasterDataUser | null>(null);
  const [quotaTargetStore, setQuotaTargetStore] = useState<StoreQuotaTarget | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalLoading, setPaymentModalLoading] = useState(false);
  const [paymentTargetUser, setPaymentTargetUser] = useState<MasterDataUser | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<MasterDataPaymentRecord[]>([]);
  const [paymentAddModalOpen, setPaymentAddModalOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [expandedMerchantId, setExpandedMerchantId] = useState<number | null>(null);
  const [expandedMerchantDetail, setExpandedMerchantDetail] = useState<MasterDataUserDetail | null>(null);
  const [expandedMerchantLoading, setExpandedMerchantLoading] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<number>();
  const [resettingUserId, setResettingUserId] = useState<number>();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [roleForm] = Form.useForm<RoleFormValues>();
  const [menuForm] = Form.useForm<MenuFormValues>();
  const [userForm] = Form.useForm<UserFormValues>();
  const [quotaForm] = Form.useForm<QuotaFormValues>();
  const [paymentForm] = Form.useForm<PaymentFormValues>();
  const lastRefreshSignalRef = useRef(refreshSignal);
  const watchedRoleId = Form.useWatch('roleId', userForm);
  const watchedStoreGroupKeys = (Form.useWatch('storeGroupKeys', userForm) as string[] | undefined) ?? [];
  const isMerchantAccountView = mode === 'user-account' && operatorRoleLevel === 0;
  const panelStyle = useMemo(
    () => ({
      border: '1px solid #ece7ff',
      borderRadius: 16,
      boxShadow: 'none',
      background: 'rgba(255,255,255,0.94)'
    }),
    []
  );

  const resolveUserView = useCallback(
    () =>
      mode === 'user-account'
        ? isMerchantAccountView
          ? 'merchant'
          : 'team'
        : mode === 'user-role'
          ? 'role'
          : undefined,
    [isMerchantAccountView, mode]
  );

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const userView = resolveUserView();
      const [nextUsers, nextRoles, nextMenus] = await Promise.all([
        fetchMasterDataUsers({
          operatorUserId,
          operatorRoleLevel,
          view: userView
        }),
        fetchMasterDataRoles(),
        fetchMasterDataMenus()
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles);
      setMenus(nextMenus);
    } catch (error) {
      messageApi.error(normalizeError(error, '主数据管理暂时不可用'));
    } finally {
      setLoading(false);
    }
  }, [operatorRoleLevel, operatorUserId, resolveUserView]);

  const refreshCurrentList = useCallback(async () => {
    setListRefreshing(true);
    try {
      if (mode === 'user-account' || mode === 'user-role') {
        const nextUsers = await fetchMasterDataUsers({
          operatorUserId,
          operatorRoleLevel,
          view: resolveUserView()
        });
        setUsers(nextUsers);
      } else if (mode === 'system-role') {
        setRoles(await fetchMasterDataRoles());
      } else if (mode === 'system-menu') {
        setMenus(await fetchMasterDataMenus());
      }
      messageApi.success('列表已刷新');
    } catch (error) {
      messageApi.error(normalizeError(error, '刷新列表失败'));
    } finally {
      setListRefreshing(false);
    }
  }, [mode, operatorRoleLevel, operatorUserId, resolveUserView]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (refreshSignal == null || refreshSignal === lastRefreshSignalRef.current) {
      return;
    }
    lastRefreshSignalRef.current = refreshSignal;
    void loadBoard();
  }, [loadBoard, refreshSignal]);

  useEffect(() => {
    if (mode === 'user-role') {
      setUserStatusFilter('normal');
      return;
    }
    setUserStatusFilter(undefined);
  }, [mode]);

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

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: roleNameLabel(role.name),
        value: role.id
      })),
    [roles]
  );

  const assignableRoles = useMemo(() => {
    if (operatorRoleLevel == null) {
      return roles;
    }
    return roles.filter((role) => role.level == null || role.level > operatorRoleLevel);
  }, [operatorRoleLevel, roles]);

  const assignableRoleOptions = useMemo(
    () =>
      assignableRoles.map((role) => ({
        label: roleNameLabel(role.name),
        value: role.id
      })),
    [assignableRoles]
  );

  const merchantDefaultRoleId = useMemo(
    () => roles.find((role) => role.level === 1)?.id,
    [roles]
  );

  const groupedOperatorStores = useMemo(() => {
    return buildStoreTransferGroupsFromSources(operatorStores);
  }, [operatorStores]);

  const storeTransferData = useMemo(
    () => toTransferData(groupedOperatorStores),
    [groupedOperatorStores]
  );

  const storeAssignmentTransferGroups = useMemo(() => {
    const map = new Map<string, StoreTransferGroup>();
    groupedOperatorStores.forEach((group) => mergeStoreTransferGroup(map, group));
    storeAssignmentCurrentGroups.forEach((group) => mergeStoreTransferGroup(map, group));
    return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'));
  }, [groupedOperatorStores, storeAssignmentCurrentGroups]);

  const storeAssignmentTransferData = useMemo(
    () => toTransferData(storeAssignmentTransferGroups),
    [storeAssignmentTransferGroups]
  );

  const allOperatorStoreGroupKeys = useMemo(
    () => groupedOperatorStores.map((group) => group.key),
    [groupedOperatorStores]
  );

  const watchedRole = useMemo(
    () => roles.find((role) => role.id === watchedRoleId),
    [roles, watchedRoleId]
  );

  const watchedRoleAllStores = useMemo(
    () => isAllStoresRole(watchedRole),
    [watchedRole]
  );

  useEffect(() => {
    if (!userModalOpen || userModalKind !== 'member' || editingUser) {
      return;
    }
    if (watchedRoleAllStores) {
      userForm.setFieldValue('storeGroupKeys', allOperatorStoreGroupKeys);
    }
  }, [allOperatorStoreGroupKeys, editingUser, userForm, userModalKind, userModalOpen, watchedRoleAllStores]);

  const menuNameMap = useMemo(() => {
    const map = new Map<number, MasterDataMenu>();
    menus.forEach((menu) => map.set(menu.id, menu));
    return map;
  }, [menus]);

  const roleTreeOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: roleNameLabel(role.name),
        value: role.id
      })),
    [roles]
  );

  const menuTreeData = useMemo(() => {
    const nodeMap = new Map<number, { title: string; value: number; children: Array<any> }>();
    menus.forEach((menu) => {
      nodeMap.set(menu.id, {
        title: menu.name,
        value: menu.id,
        children: []
      });
    });

    const roots: Array<any> = [];
    menus.forEach((menu) => {
      const node = nodeMap.get(menu.id);
      if (!node) {
        return;
      }
      if (menu.parentId && nodeMap.has(menu.parentId)) {
        nodeMap.get(menu.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [menus]);

  const filteredUserRows = useMemo(() => {
    const normalizedKeyword = userKeyword.trim().toLowerCase();
    const shouldApplyAccountFilters = mode === 'user-account';
    const shouldApplyStatusFilter = shouldApplyAccountFilters || mode === 'user-role';
    return users.filter((item) => {
      const hitKeyword =
        !normalizedKeyword ||
        [item.accountNo, item.realName, item.phone, item.email, item.companyName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
      const hitRole = !shouldApplyAccountFilters || !userRoleFilter || item.roleId === userRoleFilter;
      const hitType = !shouldApplyAccountFilters || !userTypeFilter || (item.accountType || '').toLowerCase() === userTypeFilter.toLowerCase();
      const hitStatus = !shouldApplyStatusFilter || !userStatusFilter
        || (isMerchantAccountView
          ? (userStatusFilter === 'normal' && item.status === 1 && !dayjs(item.expiredTime).isBefore(dayjs(), 'day'))
            || (userStatusFilter === 'expired' && Boolean(item.expiredTime) && dayjs(item.expiredTime).isBefore(dayjs(), 'day'))
          : (userStatusFilter === 'normal' && item.status === 1)
            || (userStatusFilter === 'disabled' && item.status !== 1));
      return hitKeyword && hitRole && hitType && hitStatus;
    });
  }, [isMerchantAccountView, mode, userKeyword, userRoleFilter, userStatusFilter, userTypeFilter, users]);

  const filteredMenus = useMemo(() => {
    const keyword = menuKeyword.trim().toLowerCase();
    if (!keyword) {
      return menus;
    }
    return menus.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [menuKeyword, menus]);

  const roleAssignmentRows = useMemo(
    () => filteredUserRows.filter((item) => (item.accountType || 'internal').toLowerCase() !== 'external'),
    [filteredUserRows]
  );

  const roleAssignmentStats = useMemo(() => {
    const isManagerRole = (roleName?: string) => {
      const name = roleName || '';
      return name.includes('主管') || name.includes('管理') || name.includes('老板');
    };
    const isOpsRole = (roleName?: string) => {
      const name = roleName || '';
      return name.includes('运营') && !name.includes('主管');
    };
    return [
      { label: '共角色', value: roleAssignmentRows.length },
      { label: '管理', value: roleAssignmentRows.filter((item) => isManagerRole(item.roleName)).length },
      { label: '运营', value: roleAssignmentRows.filter((item) => isOpsRole(item.roleName)).length },
      { label: '采购', value: roleAssignmentRows.filter((item) => (item.roleName || '').includes('采购')).length },
      { label: '仓管', value: roleAssignmentRows.filter((item) => (item.roleName || '').includes('仓管')).length }
    ];
  }, [roleAssignmentRows]);

  const expandStoreGroupKeys = useCallback(
    (groupKeys: string[] = []) => expandStoreTransferGroupKeys(groupedOperatorStores, groupKeys),
    [groupedOperatorStores]
  );

  const expandStoreAssignmentGroupKeys = useCallback(
    (groupKeys: string[] = []) => expandStoreTransferGroupKeys(storeAssignmentTransferGroups, groupKeys),
    [storeAssignmentTransferGroups]
  );

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

  const openStoreAssignment = useCallback(
    async (user: MasterDataUser) => {
      setStoreAssignmentOpen(true);
      setStoreAssignmentUser(user);
      setStoreAssignmentCurrentGroups([]);
      setStoreAssignmentGroupKeys([]);
      setStoreAssignmentError(null);
      setStoreAssignmentLoading(true);
      try {
        const detail = await fetchMasterDataUserDetail(user.id);
        const currentGroups = buildStoreTransferGroupsFromLinks(detail.storeLinks);
        setStoreAssignmentCurrentGroups(currentGroups);
        if (isAllStoresRole(user)) {
          setStoreAssignmentGroupKeys(currentGroups.length ? currentGroups.map((group) => group.key) : allOperatorStoreGroupKeys);
          return;
        }
        setStoreAssignmentGroupKeys(currentGroups.map((group) => group.key));
      } catch (error) {
        messageApi.error(normalizeError(error, '读取用户店铺分配失败'));
      } finally {
        setStoreAssignmentLoading(false);
      }
    },
    [allOperatorStoreGroupKeys]
  );

  const submitStoreAssignment = useCallback(async () => {
    if (!storeAssignmentUser) {
      return;
    }
    setStoreAssignmentSubmitting(true);
    try {
      setStoreAssignmentError(null);
      const payload: MasterDataAssignStoresPayload = {
        operatorUserId,
        storeCodes: expandStoreAssignmentGroupKeys(storeAssignmentGroupKeys)
      };
      const result = await assignMasterDataStores(storeAssignmentUser.id, payload);
      messageApi.success(result.message || '负责店铺已更新');
      setStoreAssignmentOpen(false);
      setStoreAssignmentCurrentGroups([]);
      await loadBoard();
      if (detailState.status === 'success' && detailState.data.id === storeAssignmentUser.id) {
        const nextDetail = await fetchMasterDataUserDetail(storeAssignmentUser.id);
        setDetailState({ status: 'success', data: nextDetail });
      }
      onDataChanged?.();
    } catch (error) {
      const errorMessage = normalizeError(error, '分配店铺失败');
      setStoreAssignmentError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setStoreAssignmentSubmitting(false);
    }
  }, [detailState, expandStoreAssignmentGroupKeys, loadBoard, onDataChanged, operatorUserId, storeAssignmentGroupKeys, storeAssignmentUser]);

  const openQuotaModal = useCallback((user: MasterDataUser, detail?: MasterDataUserDetail, store?: StoreQuotaTarget) => {
    setQuotaTargetUser(user);
    setQuotaTargetStore(store ?? null);
    quotaForm.resetFields();
    const quotaSource = store ?? detail ?? user;
    quotaForm.setFieldsValue({
      listLimit: quotaSource.listLimit ?? 0,
      collectLimit: quotaSource.collectLimit ?? 0,
      whApLimit: quotaSource.whApLimit ?? 0,
      chatgptTranslateLimit: quotaSource.chatgptTranslateLimit ?? 0
    });
    setQuotaModalOpen(true);
  }, [quotaForm]);

  const submitQuota = useCallback(async () => {
    if (!quotaTargetUser) {
      return;
    }
    try {
      const values = await quotaForm.validateFields();
      setQuotaSubmitting(true);
      const payload: MasterDataUpdateQuotaPayload = {
        ...values,
        operatorUserId
      };
      const result = quotaTargetStore
        ? await updateMasterDataStoreQuota(quotaTargetUser.id, quotaTargetStore.id, payload)
        : await updateMasterDataQuota(quotaTargetUser.id, payload);
      messageApi.success(result.message || '额度已更新');
      setQuotaModalOpen(false);
      setQuotaTargetStore(null);
      await loadBoard();
      if (detailState.status === 'success' && detailState.data.id === quotaTargetUser.id) {
        const nextDetail = await fetchMasterDataUserDetail(quotaTargetUser.id);
        setDetailState({ status: 'success', data: nextDetail });
      }
      if (expandedMerchantId === quotaTargetUser.id) {
        const nextDetail = await fetchMasterDataUserDetail(quotaTargetUser.id);
        setExpandedMerchantDetail(nextDetail);
      }
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '更新额度失败'));
    } finally {
      setQuotaSubmitting(false);
    }
  }, [detailState, expandedMerchantId, loadBoard, operatorUserId, quotaForm, quotaTargetStore, quotaTargetUser]);

  const openPaymentModal = useCallback(async (user: MasterDataUser) => {
    setPaymentTargetUser(user);
    setPaymentModalOpen(true);
    setPaymentModalLoading(true);
    try {
      const payload = await fetchMasterDataPayments(user.id);
      setPaymentRecords(payload);
    } catch (error) {
      setPaymentRecords([]);
      messageApi.error(normalizeError(error, '读取费用记录失败'));
    } finally {
      setPaymentModalLoading(false);
    }
  }, []);

  const submitPayment = useCallback(async () => {
    if (!paymentTargetUser) {
      return;
    }
    try {
      const values = await paymentForm.validateFields();
      setPaymentSubmitting(true);
      const payload: MasterDataAddPaymentPayload = {
        amount: values.amount,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        remark: values.remark,
        operatorUserId
      };
      const result = await addMasterDataPayment(paymentTargetUser.id, payload);
      messageApi.success(result.message || '费用记录已添加');
      setPaymentAddModalOpen(false);
      paymentForm.resetFields();
      const nextRecords = await fetchMasterDataPayments(paymentTargetUser.id);
      setPaymentRecords(nextRecords);
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '添加费用记录失败'));
    } finally {
      setPaymentSubmitting(false);
    }
  }, [operatorUserId, paymentForm, paymentTargetUser]);

  const handleAssignRole = useCallback(
    async (user: MasterDataUser, roleId: number) => {
      setAssigningUserId(user.id);
      try {
        const payload = await assignMasterDataRole({
          userId: user.id,
          roleId,
          operatorUserId
        });
        messageApi.success(payload.message || '角色分配已更新');
        await loadBoard();
        if (detailState.status === 'success' && detailState.data.id === user.id) {
          const nextDetail = await fetchMasterDataUserDetail(user.id);
          setDetailState({ status: 'success', data: nextDetail });
        }
        onDataChanged?.();
      } catch (error) {
        messageApi.error(normalizeError(error, '角色分配失败'));
      } finally {
        setAssigningUserId(undefined);
      }
    },
    [detailState, loadBoard, onDataChanged, operatorUserId]
  );

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

  const submitConfirmDialog = useCallback(async () => {
    if (!confirmDialog) {
      return;
    }

    setConfirmSubmitting(true);
    try {
      if (confirmDialog.type === 'toggle-user') {
        await handleToggleStatus(confirmDialog.user);
      }
      if (confirmDialog.type === 'reset-password') {
        await handleResetPassword(confirmDialog.user);
      }
      if (confirmDialog.type === 'clear-stores') {
        setStoreAssignmentGroupKeys([]);
      }
      if (confirmDialog.type === 'delete-role') {
        if (confirmDialog.role.systemRole) {
          messageApi.error('系统预设角色不能删除。');
          return;
        }
        const payload = await deleteMasterDataRole(confirmDialog.role.id, operatorUserId);
        messageApi.success(payload.message || '角色已删除');
        await loadBoard();
        onDataChanged?.();
      }
      if (confirmDialog.type === 'delete-menu') {
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
  }, [confirmDialog, handleResetPassword, handleToggleStatus, loadBoard, onDataChanged, operatorUserId]);

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

  return (
    <MasterDataBoardView model={{ mode, loading, panelStyle, listRefreshing, refreshCurrentList, isMerchantAccountView, openUserModal, openRoleModal, openMenuModal, userKeyword, setUserKeyword, userTypeFilter, setUserTypeFilter, userStatusFilter, setUserStatusFilter, filteredUserRows, userManageColumns, teamManageColumns, expandedMerchantId, renderExpandedMerchantStores, roleAssignmentStats, roleAssignmentRows, roleAssignColumns, roles, roleColumns, filteredMenus, menuColumns, menuKeyword, setMenuKeyword, detailOpen, setDetailOpen, detailState, openQuotaModal, confirmSubmitting, confirmDialog, confirmOkDanger, confirmOkDisabled, setConfirmDialog, submitConfirmDialog, userSubmitting, userModalOpen, userModalKind, editingUser, userForm, submitUser, setUserSubmitError, messageApi, userSubmitError, assignableRoleOptions, storeTransferData, watchedRoleAllStores, allOperatorStoreGroupKeys, watchedStoreGroupKeys, setUserModalOpen, storeAssignmentSubmitting, storeAssignmentOpen, storeAssignmentUser, storeAssignmentLoading, setStoreAssignmentOpen, setStoreAssignmentCurrentGroups, setStoreAssignmentError, submitStoreAssignment, storeAssignmentError, storeAssignmentTransferData, storeAssignmentGroupKeys, setStoreAssignmentGroupKeys, quotaSubmitting, quotaModalOpen, quotaTargetStore, quotaTargetUser, setQuotaModalOpen, setQuotaTargetStore, submitQuota, quotaForm, paymentModalOpen, paymentTargetUser, setPaymentModalOpen, setPaymentRecords, paymentRecords, paymentModalLoading, setPaymentAddModalOpen, paymentAddModalOpen, paymentSubmitting, paymentForm, submitPayment, roleSubmitting, roleModalOpen, editingRole, setRoleModalOpen, submitRole, roleForm, roleTreeOptions, menuTreeData, menuSubmitting, menuModalOpen, editingMenu, setMenuModalOpen, submitMenu, menuForm }} />
  );
}
