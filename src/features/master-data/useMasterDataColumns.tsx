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

export function useMasterDataColumns({
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

  const roleAssignColumns = useMemo<ColumnsType<MasterDataUser>>(
    () => [
      {
        title: '登录账号',
        dataIndex: 'accountNo',
        key: 'accountNo',
        width: 120,
        onCell: responsiveCell('登录账号')
      },
      {
        title: '姓名',
        dataIndex: 'realName',
        key: 'realName',
        width: 96,
        onCell: responsiveCell('姓名'),
        render: (value?: string) => value || '-'
      },
      {
        title: '分配角色',
        key: 'assignRole',
        width: 178,
        onCell: responsiveCell('分配角色'),
        render: (_: unknown, record) =>
          assignableRoles.some((role: any) => role.id === record.roleId) ? (
            <Select
              data-testid="role-assign-select"
              value={record.roleId}
              style={{ width: '100%' }}
              options={assignableRoleOptions}
              loading={assigningUserId === record.id}
              disabled={assigningUserId === record.id}
              onChange={(value) => void handleAssignRole(record, value)}
            />
          ) : (
            <Text type="secondary">{roleNameLabel(record.roleName)}</Text>
          )
      },
      {
        title: '负责店铺',
        key: 'stores',
        width: 540,
        onCell: responsiveCell('负责店铺'),
        render: (_: unknown, record) => {
          const allStoresRole = isAllStoresRole(record);
          return (
            <Space size={6} wrap className="nuono-store-assignment-cell">
              <StoreSummaryInline record={record} maxVisible={2} />
              {allStoresRole ? null : (
                <Button
                  data-testid="store-assign-button"
                  type="link"
                  size="small"
                  style={{ paddingInline: 0 }}
                  onClick={() => void openStoreAssignment(record)}
                >
                  编辑
                </Button>
              )}
            </Space>
          );
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 78,
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
        width: 128,
        onCell: responsiveCell('更新时间'),
        render: (value?: string) => formatDateTime(value)
      },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        fixed: 'right' as const,
        onCell: responsiveCell('操作'),
        render: (_: unknown, record) => (
          <Space className="nuono-row-actions" wrap={false} size={10}>
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
    [assignableRoleOptions, assignableRoles, assigningUserId, confirmResetPassword, confirmToggleStatus, handleAssignRole, openStoreAssignment, openUserModal, resettingUserId, togglingUserId]
  );

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

  const menuColumns = useMemo<ColumnsType<MasterDataMenu>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      { title: '菜单名称', dataIndex: 'name', key: 'name', width: 220 },
      {
        title: '父菜单',
        key: 'parentId',
        width: 180,
        render: (_: unknown, record) =>
          record.parentId ? menuNameMap.get(record.parentId)?.name || record.parentId : <Tag color="blue">顶级</Tag>
      },
      {
        title: '接口路径',
        dataIndex: 'urlPath',
        key: 'urlPath',
        width: 860,
        render: (value?: string) => value || '-'
      },
      {
        title: '操作',
        key: 'action',
        width: 160,
        fixed: 'right' as const,
        render: (_: unknown, record) => (
          <Space size={8}>
            <Button data-testid="menu-edit-button" ghost size="small" type="primary" onClick={() => openMenuModal(record)}>
              编辑
            </Button>
            <Button data-testid="menu-delete-button" danger ghost size="small" onClick={() => confirmDeleteMenu(record)}>
              删除
            </Button>
          </Space>
        )
      }
    ],
    [confirmDeleteMenu, menuNameMap, openMenuModal]
  );

  const renderExpandedMerchantStores = useCallback(
    (record: MasterDataUser) => {
      const detail = expandedMerchantDetail?.id === record.id ? expandedMerchantDetail : null;
      const storeRows: any[] = detail?.storeLinks ?? [];

      return (
        <div className="nuono-legacy-expanded-stores">
          <div className="nuono-legacy-expanded-title">
            {record.realName || record.companyName || record.accountNo} 的店铺
          </div>
          <Table<any>
            data-testid="merchant-store-table"
            className="nuono-legacy-store-table nuono-fit-table"
            tableLayout="fixed"
            size="small"
            rowKey={(item) => `${item.id}-${item.storeCode}-${item.site || ''}`}
            loading={expandedMerchantLoading && expandedMerchantId === record.id}
            pagination={false}
            dataSource={storeRows}
            columns={[
              {
                title: '店铺名称',
                key: 'projectName',
                width: 140,
                render: (_: unknown, item) => item.projectName || item.projectCode || item.storeCode
              },
              {
                title: '店铺编码',
                dataIndex: 'storeCode',
                key: 'storeCode',
                width: 120
              },
              {
                title: '站点',
                dataIndex: 'site',
                key: 'site',
                width: 80,
                render: (value?: string) => value || <Text style={{ color: '#999' }}>-</Text>
              },
              {
                title: '采集额度',
                key: 'collectLimit',
                width: 90,
                render: (_: unknown, item) => `${item.collectLimit ?? 0}次`
              },
              {
                title: '翻译额度',
                key: 'translateLimit',
                width: 90,
                render: (_: unknown, item) => `${item.chatgptTranslateLimit ?? 0}次`
              },
              {
                title: '上架额度',
                key: 'listLimit',
                width: 90,
                render: (_: unknown, item) => `${item.listLimit ?? 0}次`
              },
              {
                title: '月约仓额度',
                key: 'whApLimit',
                width: 100,
                render: (_: unknown, item) => `${item.whApLimit ?? 0}次/月`
              },
              {
                title: 'Noon账号',
                key: 'noonPartnerUser',
                width: 160,
                render: (_: unknown, item) =>
                  item.noonPartnerProjectUser || item.noonPartnerUser || <Text style={{ color: '#999' }}>-</Text>
              },
              {
                title: '店铺ID',
                key: 'noonPartnerId',
                width: 100,
                render: (_: unknown, item) => item.noonPartnerId || item.projectCode || '-'
              },
              {
                title: '绑定状态',
                key: 'bindingStatus',
                width: 90,
                render: (_: unknown, item) =>
                  item.bindStatus === 1 ? (
                    <Tag bordered={false} color="green">已绑定</Tag>
                  ) : (
                    <Tag bordered={false} color="red">未绑定</Tag>
                  )
              },
              {
                title: '操作',
                key: 'action',
                width: 100,
                fixed: 'right' as const,
                render: (_: unknown, item) => (
                  <Button type="link" size="small" style={{ paddingInline: 0 }} onClick={() => openQuotaModal(record, detail ?? undefined, item)}>
                    修改额度
                  </Button>
                )
              }
            ]}
            scroll={{ x: 1160 }}
            locale={{ emptyText: <Empty description="当前没有挂载店铺" /> }}
          />
        </div>
      );
    },
    [expandedMerchantDetail, expandedMerchantId, expandedMerchantLoading, openQuotaModal]
  );

  return {
    userManageColumns,
    teamManageColumns,
    roleAssignColumns,
    roleColumns,
    menuColumns,
    renderExpandedMerchantStores
  };
}
