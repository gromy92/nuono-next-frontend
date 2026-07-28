import { type HTMLAttributes, useCallback, useMemo } from 'react';
import { Badge, Button, Empty, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  accountTypeColor,
  accountTypeLabel,
  formatDateOnly,
  formatDateTime,
  isAllStoresRole,
  roleLevelLabel,
  roleNameLabel
} from './display';
import { StoreSummaryInline } from './StoreSummaryInline';
import type { MasterDataMenu, MasterDataRole, MasterDataUser } from './types';

const { Text } = Typography;

function responsiveCell(label: string) {
  return () => ({ title: undefined, 'data-label': label } as HTMLAttributes<HTMLElement>);
}

export function useMasterDataRoleColumns({
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
}: any) {
  const roleColumns = useMemo<ColumnsType<MasterDataRole>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
      {
        title: '角色名称',
        dataIndex: 'name',
        key: 'name',
        width: 150,
        render: (value?: string) => roleNameLabel(value)
      },
      { title: '角色编码', dataIndex: 'code', key: 'code', width: 160 },
      {
        title: '层级',
        dataIndex: 'level',
        key: 'level',
        width: 90,
        render: (value?: number) => <Tag color="default">{roleLevelLabel(value)}</Tag>
      },
      {
        title: '上级角色',
        key: 'parentId',
        width: 120,
        render: (_: unknown, record) => {
          if (!record.parentId) {
            return '—';
          }
          return roles.find((item: any) => item.id === record.parentId)?.name || record.parentId;
        }
      },
      {
        title: '说明',
        dataIndex: 'description',
        key: 'description',
        width: 180,
        render: (value?: string) => value || '—'
      },
      {
        title: '类型',
        dataIndex: 'systemRole',
        key: 'systemRole',
        width: 100,
        render: (value?: boolean) => (
          <Tag color={value ? 'purple' : 'default'}>{value ? '系统预设' : '自定义'}</Tag>
        )
      },
      {
        title: '菜单范围',
        key: 'menuScope',
        width: 320,
        render: (_: unknown, record) => (
          <Space wrap size={[6, 6]}>
            {record.menuIds.length ? (
              record.menuIds.map((menuId) => (
                <Tag key={`${record.id}-${menuId}`} color="default" style={{ marginInlineEnd: 0 }}>
                  {menuNameMap.get(menuId)?.name || `菜单 ${menuId}`}
                </Tag>
              ))
            ) : (
              <Text style={{ color: '#94a3b8' }}>暂无菜单</Text>
            )}
          </Space>
        )
      },
      {
        title: '操作',
        key: 'action',
        width: 140,
        fixed: 'right' as const,
        render: (_: unknown, record) => (
          <Space size={8}>
            <Button data-testid="role-edit-button" ghost size="small" type="primary" onClick={() => openRoleModal(record)}>
              编辑
            </Button>
            <Button data-testid="role-delete-button" danger ghost size="small" disabled={Boolean(record.systemRole)} onClick={() => confirmDeleteRole(record)}>
              删除
            </Button>
          </Space>
        )
      }
    ],
    [confirmDeleteRole, menuNameMap, openRoleModal, roles]
  );
  return roleColumns;
}
