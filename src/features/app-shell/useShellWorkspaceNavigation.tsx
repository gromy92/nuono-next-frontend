import { type Key, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { TabsProps } from 'antd';
import type { SidebarMenuItem } from './SidebarNavigation';
import type { WorkspaceOwnedTabsController } from '../route-catalog/WorkspaceOwnedTabs';
import {
  activeWorkspacePathLabel,
  activeWorkspaceSidebarOpenKeys,
  initialWorkspaceTabKeys,
  visibleWorkspaceTabKeys
} from '../route-catalog/navigationProjection';
import {
  isWorkspaceMenuKey,
  shouldShowWorkspaceMenuInTabs,
  workspaceMenuDefinition,
  workspaceMenuTabLabel,
  workspaceTabKeyForMenuKey,
  type AppMenuKey
} from '../route-catalog/RouteCatalog';
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
  const [openedWorkspaceTabKeys, setOpenedWorkspaceTabKeys] = useState<AppMenuKey[]>(
    () => initialWorkspaceTabKeys(activeMenuKey, sessionAllowedMenuKeySet)
  );

  const activeOwnedTab = ownedTabsController.tabs.find(
    (tab) => tab.key === ownedTabsController.activeOwnedTabKey
  );
  const activeMenuPathLabel = activeWorkspacePathLabel(activeMenuKey, activeOwnedTab);

  const workspaceTabItems = useMemo(() => {
    const items: Array<{ key: string; label: ReactNode; closable: boolean }> =
      visibleWorkspaceTabKeys(openedWorkspaceTabKeys, sessionAllowedMenuKeySet)
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

  const activeSidebarOpenKeys = useMemo(
    () => activeWorkspaceSidebarOpenKeys(activeMenuKey),
    [activeMenuKey]
  );
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
      !sessionAllowedMenuKeySet.has(nextKey)
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

  const handleSidebarMenuClick = useCallback(
    ({ key }: { key: Key }) => {
      if (typeof key !== 'string') {
        return;
      }
      const nextKey = key as AppMenuKey;
      if (!sessionAllowedMenuKeySet.has(nextKey)) {
        return;
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
    shouldRenderWorkspaceTabs,
    sidebarOpenKeys,
    workspaceTabItems
  };
}
