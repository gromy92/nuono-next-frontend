import { type Key, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { TabsProps } from 'antd';
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace';
import type { SidebarMenuItem } from './SidebarNavigation';
import type { AppMenuKey } from './WorkspaceRouting';
import type { WorkspaceOwnedTabsController } from '../route-catalog/WorkspaceOwnedTabs';
import {
  isWorkspaceMenuKey,
  shouldShowWorkspaceMenuInTabs,
  workspaceMenuDefinition,
  workspaceMenuPathLabel,
  workspaceMenuSectionKey,
  workspaceMenuTabLabel,
  workspaceTabKeyForMenuKey
} from './WorkspaceMenuRegistry';
function normalizeWorkspaceTabMenuKey(menuKey: AppMenuKey): AppMenuKey {
  return workspaceTabKeyForMenuKey(menuKey);
}

function isRememberedWorkspaceTabKey(key: string): key is AppMenuKey {
  return isWorkspaceMenuKey(key) && shouldShowWorkspaceMenuInTabs(key);
}

function nextWorkspaceMenuKeyAfterClose(keys: AppMenuKey[], targetKey: AppMenuKey) {
  const targetIndex = keys.indexOf(targetKey);
  const remainingKeys = keys.filter((key) => key !== targetKey);
  if (!remainingKeys.length) {
    return null;
  }
  return remainingKeys[Math.min(Math.max(targetIndex, 0), remainingKeys.length - 1)];
}

function shouldShowActiveMenuPathLabel(menuKey: AppMenuKey) {
  return menuKey !== 'noon-call-store-data' && menuKey !== 'system-report-noon-data-gaps';
}

type UseShellWorkspaceNavigationParams = {
  activeMenuKey: AppMenuKey;
  ownedTabsController: WorkspaceOwnedTabsController;
  sessionAllowedMenuKeySet: Set<AppMenuKey>;
  visibleWorkspaceMenuItems: SidebarMenuItem[];
};

export function useShellWorkspaceNavigation({
  activeMenuKey,
  ownedTabsController,
  sessionAllowedMenuKeySet,
  visibleWorkspaceMenuItems
}: UseShellWorkspaceNavigationParams) {
  const [userRoleActiveTabKey, setUserRoleActiveTabKey] =
    useState<RoleManagementWorkspaceTabKey>('user-role');
  const [openedWorkspaceTabKeys, setOpenedWorkspaceTabKeys] = useState<AppMenuKey[]>([
    'product-manage'
  ]);

  const activeOwnedTab = ownedTabsController.tabs.find(
    (tab) => tab.key === ownedTabsController.activeOwnedTabKey
  );
  const activeMenuPathLabel = shouldShowActiveMenuPathLabel(activeMenuKey)
    ? activeOwnedTab?.parentMenuKey === activeMenuKey && activeOwnedTab.pathLabel
      ? activeOwnedTab.pathLabel
      : workspaceMenuPathLabel(activeMenuKey)
    : null;

  const workspaceTabItems = useMemo(() => {
    const items: Array<{ key: string; label: ReactNode; closable: boolean }> = openedWorkspaceTabKeys
      .filter((key) => shouldShowWorkspaceMenuInTabs(key) && (key === 'product-manage' || sessionAllowedMenuKeySet.has(key)))
      .map((key) => ({
        key,
        label: workspaceMenuTabLabel(key),
        closable: workspaceMenuDefinition(key).closable
      }));

    ownedTabsController.tabs.forEach((tab) => {
      items.push({ key: tab.key, label: tab.label, closable: tab.closable });
    });

    return items;
  }, [
    openedWorkspaceTabKeys,
    ownedTabsController.tabs,
    sessionAllowedMenuKeySet,
  ]);

  const activeWorkspaceTabKey =
    activeOwnedTab?.parentMenuKey === activeMenuKey
      ? activeOwnedTab.key
      : normalizeWorkspaceTabMenuKey(activeMenuKey);

  const handleWorkspaceTabChange = useCallback(
    (key: string) => {
      if (ownedTabsController.tabs.some((tab) => tab.key === key)) {
        ownedTabsController.activateOwnedTab(key);
        return;
      }

      if (isWorkspaceMenuKey(key) && shouldShowWorkspaceMenuInTabs(key)) {
        if (key === 'user-role') {
          setUserRoleActiveTabKey('user-role');
        }
        ownedTabsController.activateParentMenu(key);
        return;
      }
    },
    [ownedTabsController]
  );

  const handleWorkspaceTabEdit = useCallback<NonNullable<TabsProps['onEdit']>>(
    (targetKey, action) => {
      if (action !== 'remove') {
        return;
      }

      if (typeof targetKey === 'string' && ownedTabsController.tabs.some((tab) => tab.key === targetKey)) {
        void ownedTabsController.requestCloseOwnedTab(targetKey);
        return;
      }

      if (typeof targetKey !== 'string' || !isRememberedWorkspaceTabKey(targetKey)) {
        return;
      }

      const nextOpenedWorkspaceTabKeys = openedWorkspaceTabKeys.filter((key) => key !== targetKey);
      if (!nextOpenedWorkspaceTabKeys.length) {
        return;
      }
      setOpenedWorkspaceTabKeys(nextOpenedWorkspaceTabKeys);
      if (targetKey === activeWorkspaceTabKey) {
        const nextActiveMenuKey = nextWorkspaceMenuKeyAfterClose(openedWorkspaceTabKeys, targetKey);
        if (!nextActiveMenuKey) {
          return;
        }
        ownedTabsController.activateParentMenu(nextActiveMenuKey);
      }
    },
    [
      activeWorkspaceTabKey,
      openedWorkspaceTabKeys,
      ownedTabsController
    ]
  );

  const activeSidebarOpenKeys = useMemo(() => {
    const activeSectionKey = workspaceMenuSectionKey(activeMenuKey);
    if (activeSectionKey === 'user') {
      return sessionAllowedMenuKeySet.has('system-role') ? ['user', 'system'] : ['user'];
    }
    return activeSectionKey ? [activeSectionKey] : [];
  }, [activeMenuKey, sessionAllowedMenuKeySet]);
  const shouldRenderWorkspaceTabs = shouldShowWorkspaceMenuInTabs(normalizeWorkspaceTabMenuKey(activeMenuKey));
  const [sidebarOpenKeys, setSidebarOpenKeys] = useState<string[]>(activeSidebarOpenKeys);
  const activeSidebarRootKey = activeSidebarOpenKeys[0];

  useEffect(() => {
    const visibleRootKeys = new Set(visibleWorkspaceMenuItems.map((item) => item.key));
    setSidebarOpenKeys((currentValue) => {
      const retainedKeys = currentValue.filter((key) => visibleRootKeys.has(key));
      const nextKeys = Array.from(new Set([...retainedKeys, ...activeSidebarOpenKeys]));
      return nextKeys.join('|') === currentValue.join('|') ? currentValue : nextKeys;
    });
  }, [activeSidebarOpenKeys, visibleWorkspaceMenuItems]);

  useEffect(() => {
    const nextKey = normalizeWorkspaceTabMenuKey(activeMenuKey);
    if (
      !shouldShowWorkspaceMenuInTabs(nextKey) ||
      (nextKey !== 'product-manage' && !sessionAllowedMenuKeySet.has(nextKey))
    ) {
      return;
    }
    setOpenedWorkspaceTabKeys((currentValue) =>
      currentValue.includes(nextKey) ? currentValue : [...currentValue, nextKey]
    );
  }, [activeMenuKey, sessionAllowedMenuKeySet]);

  useEffect(() => {
    setOpenedWorkspaceTabKeys((currentValue) =>
      currentValue.filter((key) => sessionAllowedMenuKeySet.has(key))
    );
  }, [sessionAllowedMenuKeySet]);

  useEffect(() => {
    if (activeMenuKey === 'user-store-noon') {
      setUserRoleActiveTabKey('user-store-noon');
      return;
    }
    if (activeMenuKey === 'user-role') {
      setUserRoleActiveTabKey((currentValue) =>
        currentValue === 'user-role-org' || currentValue === 'user-role-overview' ? currentValue : 'user-role'
      );
    }
  }, [activeMenuKey]);

  const handleSidebarMenuClick = useCallback(
    ({ key }: { key: Key }) => {
      if (typeof key !== 'string') {
        return;
      }
      const nextKey = key as AppMenuKey;
      if (!sessionAllowedMenuKeySet.has(nextKey)) {
        return;
      }
      if (nextKey === 'user-role') {
        setUserRoleActiveTabKey('user-role');
      }
      ownedTabsController.activateParentMenu(nextKey);
    },
    [ownedTabsController, sessionAllowedMenuKeySet]
  );

  return {
    activeMenuPathLabel,
    activeSidebarOpenKeys,
    activeSidebarRootKey,
    activeWorkspaceTabKey,
    handleSidebarMenuClick,
    handleWorkspaceTabChange,
    handleWorkspaceTabEdit,
    openedWorkspaceTabKeys,
    setSidebarOpenKeys,
    setUserRoleActiveTabKey,
    shouldRenderWorkspaceTabs,
    sidebarOpenKeys,
    userRoleActiveTabKey,
    workspaceTabItems
  };
}
