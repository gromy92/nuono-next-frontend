import { Card, Space, Tabs } from 'antd';
import { useMemo } from 'react';
import type { TabsProps } from 'antd';
import type { AuthSessionStore } from '../auth/session';
import type { StoreSyncOverviewState } from '../store-sync/types';
import { MasterDataBoard } from './MasterDataBoard';
import { OrgTreeBoard } from './OrgTreeBoard';
import { PermissionOverviewBoard } from './PermissionOverviewBoard';
import { StoreManagementBoard } from './StoreManagementBoard';

export type RoleManagementWorkspaceTabKey =
  | 'user-role'
  | 'user-store-noon'
  | 'user-role-org'
  | 'user-role-overview';

type RoleManagementWorkspaceProps = {
  activeKey: RoleManagementWorkspaceTabKey;
  operatorUserId?: number;
  operatorRoleLevel?: number;
  operatorStores?: AuthSessionStore[];
  canShowStoreManagement: boolean;
  refreshSignal: number;
  storeSyncState: StoreSyncOverviewState;
  activeOwnerId?: number;
  selectedOwnerId?: number;
  canSelectStoreOwner: boolean;
  canManageStoreBinding: boolean;
  onActiveKeyChange: (key: RoleManagementWorkspaceTabKey) => void;
  onOwnerChange: (ownerId: number) => void;
  onStoreRefresh: (ownerId?: number, options?: { preserveConnectionFeedback?: boolean }) => Promise<void> | void;
  onDataChanged: (source?: 'store-management') => void;
};

export function RoleManagementWorkspace({
  activeKey,
  operatorUserId,
  operatorRoleLevel,
  operatorStores = [],
  canShowStoreManagement,
  refreshSignal,
  storeSyncState,
  activeOwnerId,
  selectedOwnerId,
  canSelectStoreOwner,
  canManageStoreBinding,
  onActiveKeyChange,
  onOwnerChange,
  onStoreRefresh,
  onDataChanged
}: RoleManagementWorkspaceProps) {
  const items = useMemo(
    () =>
      [
        {
          key: 'user-role',
          label: '角色分配',
          children: (
            <MasterDataBoard
              mode="user-role"
              operatorUserId={operatorUserId}
              operatorRoleLevel={operatorRoleLevel}
              operatorStores={operatorStores}
              refreshSignal={refreshSignal}
              onDataChanged={() => onDataChanged()}
            />
          )
        },
        canShowStoreManagement
          ? {
              key: 'user-store-noon',
              label: '店铺管理',
              children: (
                <StoreManagementBoard
                  state={storeSyncState}
                  ownerId={activeOwnerId}
                  selectedOwnerId={selectedOwnerId}
                  canSelectOwner={canSelectStoreOwner}
                  canManageBinding={canManageStoreBinding}
                  onOwnerChange={onOwnerChange}
                  onRefresh={onStoreRefresh}
                  onDataChanged={() => onDataChanged('store-management')}
                />
              )
            }
          : null,
        {
          key: 'user-role-org',
          label: '组织架构',
          children: (
            <OrgTreeBoard
              operatorUserId={operatorUserId}
              operatorRoleLevel={operatorRoleLevel}
              refreshSignal={refreshSignal}
            />
          )
        },
        {
          key: 'user-role-overview',
          label: '权限总览',
          children: <PermissionOverviewBoard operatorRoleLevel={operatorRoleLevel} refreshSignal={refreshSignal} />
        }
      ].filter(Boolean) as TabsProps['items'],
    [
      activeOwnerId,
      canManageStoreBinding,
      canSelectStoreOwner,
      canShowStoreManagement,
      onDataChanged,
      onOwnerChange,
      onStoreRefresh,
      operatorRoleLevel,
      operatorStores,
      operatorUserId,
      refreshSignal,
      selectedOwnerId,
      storeSyncState
    ]
  );

  return (
    <Card variant="borderless" className="nuono-role-management-shell" style={{ boxShadow: 'none', background: '#ffffff' }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Tabs
          className="nuono-role-management-tabs"
          data-testid="role-management-tabs"
          activeKey={activeKey}
          items={items}
          onChange={(key) => onActiveKeyChange(key as RoleManagementWorkspaceTabKey)}
        />
      </Space>
    </Card>
  );
}
