import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { normalizeError } from '../../shared/api';
import {
  fetchMasterDataMenus,
  fetchMasterDataRoles,
  fetchMasterDataUsers
} from './api';
import type {
  MasterDataBoardMode,
  MasterDataMenu,
  MasterDataMessageApi,
  MasterDataRole,
  MasterDataUser
} from './types';

type Options = {
  mode: MasterDataBoardMode;
  operatorUserId?: number;
  operatorRoleLevel?: number;
  refreshSignal?: number;
  messageApi: MasterDataMessageApi;
};

export function useMasterDataDataset({
  mode,
  operatorUserId,
  operatorRoleLevel,
  refreshSignal,
  messageApi
}: Options) {
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
  const lastRefreshSignalRef = useRef(refreshSignal);
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

  return {
    users, setUsers, roles, setRoles, menus, setMenus,
    loading, listRefreshing, userKeyword, setUserKeyword,
    userRoleFilter, setUserRoleFilter, userTypeFilter, setUserTypeFilter,
    userStatusFilter, setUserStatusFilter, menuKeyword, setMenuKeyword,
    assigningUserId, setAssigningUserId, isMerchantAccountView, panelStyle,
    resolveUserView, loadBoard, refreshCurrentList,
    filteredUserRows, filteredMenus, roleAssignmentRows, roleAssignmentStats
  };
}
