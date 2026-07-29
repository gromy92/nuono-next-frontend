import { type HTMLAttributes, useMemo } from 'react';
import { Button, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime, roleNameLabel } from './display';
import { StoreSummaryInline } from './StoreSummaryInline';
import type { MasterDataColumnModel } from './useMasterDataColumns';
import type { MasterDataUser } from './types';

function responsiveCell(label: string) {
  return () => ({ title: undefined, 'data-label': label } as HTMLAttributes<HTMLElement>);
}

type TeamManageColumnModel = Pick<
  MasterDataColumnModel,
  | 'openUserModal'
  | 'resettingUserId'
  | 'confirmResetPassword'
  | 'togglingUserId'
  | 'confirmToggleStatus'
>;

export function useMasterDataTeamManageColumns({
  confirmResetPassword,
  confirmToggleStatus,
  openUserModal,
  resettingUserId,
  togglingUserId
}: TeamManageColumnModel) {
  const teamManageColumns = useMemo<ColumnsType<MasterDataUser>>(
    () => [
      {
        title: '登录账号',
        dataIndex: 'accountNo',
        key: 'accountNo',
        width: 112,
        onCell: responsiveCell('登录账号')
      },
      {
        title: '姓名',
        dataIndex: 'realName',
        key: 'realName',
        width: 86,
        onCell: responsiveCell('姓名'),
        render: (value?: string) => value || '-'
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
        title: '角色',
        dataIndex: 'roleName',
        key: 'roleName',
        width: 88,
        onCell: responsiveCell('角色'),
        render: (value?: string) => (
          <Tag color="blue" bordered={false} style={{ marginInlineEnd: 0 }}>
            {roleNameLabel(value)}
          </Tag>
        )
      },
      {
        title: '负责店铺',
        key: 'stores',
        width: 260,
        onCell: responsiveCell('负责店铺'),
        render: (_: unknown, record) => <StoreSummaryInline record={record} />
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 72,
        onCell: responsiveCell('状态'),
        render: (value?: number) => (
          <Tag color={value === 1 ? 'success' : 'default'} bordered={false} style={{ marginInlineEnd: 0 }}>
            {value === 1 ? '正常' : '禁用'}
          </Tag>
        )
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
        onCell: responsiveCell('更新时间'),
        render: (value?: string) => formatDateTime(value)
      },
      {
        title: '操作',
        key: 'actions',
        width: 210,
        fixed: 'right' as const,
        onCell: responsiveCell('操作'),
        render: (_: unknown, record) => (
          <Space wrap size={[8, 4]}>
            <Button
              data-testid="user-edit-button"
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              onClick={() => openUserModal('member', record)}
            >
              编辑
            </Button>
            <Button
              data-testid="user-reset-password-button"
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              loading={resettingUserId === record.id}
              onClick={() => confirmResetPassword(record)}
            >
              重置密码
            </Button>
            <Button
              data-testid="user-toggle-status-button"
              danger={record.status === 1}
              type="link"
              size="small"
              loading={togglingUserId === record.id}
              style={{ paddingInline: 0 }}
              onClick={() => confirmToggleStatus(record)}
            >
              {record.status === 1 ? '禁用' : '启用'}
            </Button>
          </Space>
        )
      }
    ],
    [confirmResetPassword, confirmToggleStatus, openUserModal, resettingUserId, togglingUserId]
  );
  return teamManageColumns;
}
