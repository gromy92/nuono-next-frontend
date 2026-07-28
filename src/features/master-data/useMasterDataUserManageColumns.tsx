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

export function useMasterDataUserManageColumns({
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
  const userManageColumns = useMemo<ColumnsType<MasterDataUser>>(
    () => [
      {
        title: '商家姓名',
        key: 'displayName',
        width: 108,
        onCell: responsiveCell('商家姓名'),
        render: (_: unknown, record) => <Text strong>{record.realName || record.companyName || record.accountNo}</Text>
      },
      {
        title: '手机号',
        dataIndex: 'phone',
        key: 'phone',
        width: 112,
        onCell: responsiveCell('手机号'),
        render: (value?: string) => value || '-'
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        width: 132,
        onCell: responsiveCell('邮箱'),
        render: (value?: string) => value || '-'
      },
      {
        title: '登录账号',
        dataIndex: 'accountNo',
        key: 'accountNo',
        width: 108,
        onCell: responsiveCell('登录账号'),
        render: (value: string) => <Text>{value}</Text>
      },
      {
        title: '类型',
        dataIndex: 'accountType',
        key: 'accountType',
        width: 68,
        onCell: responsiveCell('类型'),
        render: (value?: string) => (
          <Tag color={accountTypeColor(value)} bordered={false} style={{ marginInlineEnd: 0 }}>
            {accountTypeLabel(value)}
          </Tag>
        )
      },
      {
        title: '店铺数',
        dataIndex: 'storeCount',
        key: 'storeCount',
        width: 70,
        onCell: responsiveCell('店铺数'),
        render: (value?: number) => <Tag bordered={false}>{value ?? 0}</Tag>
      },
      {
        title: '服务到期',
        dataIndex: 'expiredTime',
        key: 'expiredTime',
        width: 100,
        onCell: responsiveCell('服务到期'),
        render: (value?: string) => {
          if (!value) {
            return '-';
          }
          const expired = dayjs(value).isBefore(dayjs(), 'day');
          return <Text style={{ color: expired ? '#dc2626' : undefined }}>{formatDateOnly(value)}</Text>;
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 76,
        onCell: responsiveCell('状态'),
        render: (value?: number) => (
          <Space size={6}>
            <Badge status={value === 1 ? 'success' : 'error'} />
            <Text>{value === 1 ? '正常' : '禁用'}</Text>
          </Space>
        )
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 106,
        onCell: responsiveCell('创建时间'),
        render: (value?: string) => formatDateTime(value)
      },
      {
        title: '操作',
        key: 'actions',
        width: 190,
        fixed: 'right' as const,
        onCell: responsiveCell('操作'),
        render: (_: unknown, record) => (
          <Space wrap size={[8, 4]}>
            <Button data-testid="user-edit-button" type="link" size="small" style={{ paddingInline: 0 }} onClick={() => openUserModal('merchant', record)}>
              编辑
            </Button>
            <Button data-testid="user-detail-button" type="link" size="small" style={{ paddingInline: 0 }} onClick={() => void toggleMerchantStores(record)}>
              {expandedMerchantId === record.id ? '收起店铺' : '管理店铺'}
            </Button>
            <Button
              data-testid="user-payment-button"
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              onClick={() => void openPaymentModal(record)}
            >
              费用记录
            </Button>
            <Button
              data-testid="user-toggle-status-button"
              danger={record.status === 1}
              type="link"
              size="small"
              loading={togglingUserId === record.id}
              style={{ paddingInline: 0 }}
              onClick={() => confirmToggleStatus(record, '停用')}
            >
              {record.status === 1 ? '停用' : '启用'}
            </Button>
          </Space>
        )
      }
    ],
    [confirmToggleStatus, expandedMerchantId, openPaymentModal, openUserModal, toggleMerchantStores, togglingUserId]
  );
  return userManageColumns;
}
