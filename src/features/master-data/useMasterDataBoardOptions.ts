import { useCallback, useMemo } from 'react';
import { isAllStoresRole, roleNameLabel } from './display';
import {
  buildStoreTransferGroupsFromSources,
  expandStoreGroupKeys as expandStoreTransferGroupKeys,
  toTransferData
} from './storeTransfer';
import type { MasterDataMenu, MasterDataRole } from './types';

type OperatorStore = {
  storeCode: string;
  projectCode?: string;
  projectName?: string;
  site?: string;
};

type MenuTreeNode = {
  title: string;
  value: number;
  children: MenuTreeNode[];
};

type Options = {
  roles: MasterDataRole[];
  menus: MasterDataMenu[];
  operatorRoleLevel?: number;
  operatorStores: OperatorStore[];
  watchedRoleId?: number;
};

export function useMasterDataBoardOptions({
  roles,
  menus,
  operatorRoleLevel,
  operatorStores,
  watchedRoleId
}: Options) {
  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: roleNameLabel(role.name), value: role.id })),
    [roles]
  );

  const assignableRoles = useMemo(() => {
    if (operatorRoleLevel == null) {
      return roles;
    }
    return roles.filter((role) => role.level == null || role.level > operatorRoleLevel);
  }, [operatorRoleLevel, roles]);

  const assignableRoleOptions = useMemo(
    () => assignableRoles.map((role) => ({ label: roleNameLabel(role.name), value: role.id })),
    [assignableRoles]
  );
  const merchantDefaultRoleId = useMemo(
    () => roles.find((role) => role.level === 1)?.id,
    [roles]
  );
  const groupedOperatorStores = useMemo(
    () => buildStoreTransferGroupsFromSources(operatorStores),
    [operatorStores]
  );
  const storeTransferData = useMemo(
    () => toTransferData(groupedOperatorStores),
    [groupedOperatorStores]
  );
  const expandStoreGroupKeys = useCallback(
    (groupKeys: string[] = []) => expandStoreTransferGroupKeys(groupedOperatorStores, groupKeys),
    [groupedOperatorStores]
  );
  const watchedRole = useMemo(
    () => roles.find((role) => role.id === watchedRoleId),
    [roles, watchedRoleId]
  );
  const watchedRoleAllStores = useMemo(() => isAllStoresRole(watchedRole), [watchedRole]);
  const menuNameMap = useMemo(
    () => new Map(menus.map((menu) => [menu.id, menu])),
    [menus]
  );
  const roleTreeOptions = roleOptions;
  const menuTreeData = useMemo(() => {
    const nodeMap = new Map<number, MenuTreeNode>();
    menus.forEach((menu) => {
      nodeMap.set(menu.id, { title: menu.name, value: menu.id, children: [] });
    });

    const roots: MenuTreeNode[] = [];
    menus.forEach((menu) => {
      const node = nodeMap.get(menu.id);
      if (!node) {
        return;
      }
      const parent = menu.parentId ? nodeMap.get(menu.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [menus]);

  return {
    roleOptions,
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
  };
}
