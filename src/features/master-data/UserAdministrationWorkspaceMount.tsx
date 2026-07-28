import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceMountProps } from '../route-catalog/workspaceMount';
import { useWorkspaceOwnedTabs } from '../route-catalog/WorkspaceOwnedTabs';
import { resolveSessionAllowedMenuKeys } from '../route-catalog/sessionAccessPolicy';
import { useStoreSyncContext } from '../store-sync/StoreSyncContext';
import {
  RoleManagementWorkspace,
  type RoleManagementWorkspaceTabKey
} from './RoleManagementWorkspace';

export function UserAdministrationWorkspaceMount(props: WorkspaceMountProps) {
  const { menuKey, session } = props;
  const storeSync = useStoreSyncContext();
  const { activateParentMenu } = useWorkspaceOwnedTabs();
  const [activeKey, setActiveKey] = useState<RoleManagementWorkspaceTabKey>(
    menuKey === 'user-store-noon' ? 'user-store-noon' : 'user-role'
  );
  const canShowStoreManagement = useMemo(
    () => resolveSessionAllowedMenuKeys(session).includes('user-store-noon'),
    [session]
  );

  useEffect(() => {
    if (menuKey === 'user-store-noon') {
      setActiveKey('user-store-noon');
    } else if (menuKey === 'user-role') {
      setActiveKey((current) =>
        current === 'user-role-org' || current === 'user-role-overview'
          ? current
          : 'user-role'
      );
    }
  }, [menuKey]);

  const changeActiveKey = useCallback((nextKey: RoleManagementWorkspaceTabKey) => {
    setActiveKey(nextKey);
    activateParentMenu(nextKey === 'user-store-noon' ? 'user-store-noon' : 'user-role');
  }, [activateParentMenu]);

  return (
    <RoleManagementWorkspace
      activeKey={activeKey}
      operatorUserId={session.userId}
      operatorRoleLevel={session.level}
      operatorStores={session.userStores ?? []}
      canShowStoreManagement={canShowStoreManagement}
      refreshSignal={storeSync.roleManagementRefreshSignal}
      storeSyncState={storeSync.storeSyncState}
      activeOwnerId={storeSync.activeOwnerId}
      selectedOwnerId={storeSync.storeSyncOwnerId}
      canSelectStoreOwner={storeSync.canSelectStoreOwner}
      canManageStoreBinding={storeSync.canManageStoreBinding}
      onOwnerChange={storeSync.setStoreSyncOwnerId}
      onStoreRefresh={storeSync.loadStoreSync}
      onDataChanged={storeSync.notifyRoleManagementDataChanged}
      onActiveKeyChange={changeActiveKey}
    />
  );
}
