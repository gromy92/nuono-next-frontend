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

export function useMasterDataMenuColumns({
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
  return { menuColumns, renderExpandedMerchantStores };
}
