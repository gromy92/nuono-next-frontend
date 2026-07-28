import { Button, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { normalizeError } from '../../shared/api';
import { testStoreSyncConnection } from '../store-sync/api';
import type { StoreSyncStore } from '../store-sync/types';
import {
  renderCompactStoreText,
  renderStoreManagers,
  storeConnectionStatusColor
} from './storeManagementPresentation';

const { Text } = Typography;

export function useStoreManagementColumns({
  bindingForm,
  canManageBinding,
  ownerId,
  refresh,
  setBindingModalOpen,
  setBindingMode,
  setBindingStore,
  setStoreConnectionTestFeedback,
  storeConnectionTestFeedback
}: any) {
  const columns = useMemo<ColumnsType<StoreSyncStore>>(() => {
    const baseColumns: ColumnsType<StoreSyncStore> = [
      {
        title: '店铺名称',
        dataIndex: 'projectName',
        key: 'projectName',
        width: 250,
        render: (value: string | undefined, record) => (
          renderCompactStoreText(value || record.storeCode, '-', true)
        )
      },
      {
        title: '店铺Code',
        dataIndex: 'storeCode',
        key: 'storeCode',
        width: 116,
        render: (value: string | undefined) => renderCompactStoreText(value)
      },
      {
        title: '站点',
        dataIndex: 'siteStores',
        key: 'siteStores',
        width: 92,
        render: (siteStores: StoreSyncStore['siteStores']) => {
          if (!siteStores.length) {
            return <Text style={{ color: '#94a3b8' }}>-</Text>;
          }
          const siteLabels = Array.from(new Set(siteStores.map((siteStore) => siteStore.site || '未标注站点')));
          return renderCompactStoreText(siteLabels.join(' / '));
        }
      },
      {
        title: '运营负责人',
        dataIndex: 'managers',
        key: 'opsManagers',
        width: 150,
        render: (managers: StoreSyncStore['managers']) => renderStoreManagers(managers, 'ops')
      },
      {
        title: '仓管负责人',
        dataIndex: 'managers',
        key: 'warehouseManagers',
        width: 138,
        render: (managers: StoreSyncStore['managers']) => renderStoreManagers(managers, 'warehouse')
      },
      {
        title: '采购负责人',
        dataIndex: 'managers',
        key: 'purchaseManagers',
        width: 126,
        render: (managers: StoreSyncStore['managers']) => renderStoreManagers(managers, 'purchase')
      },
      {
        title: 'Noon后台邮箱',
        dataIndex: 'noonUser',
        key: 'noonUser',
        width: 300,
        render: (value: string | undefined) => renderCompactStoreText(value, '未绑定')
      },
      {
        title: '店铺ID',
        dataIndex: 'noonPartnerId',
        key: 'noonPartnerId',
        width: 96,
        render: (value: string | undefined) => renderCompactStoreText(value)
      },
      {
        title: '连通状态',
        dataIndex: 'connectionStatus',
        key: 'connectionStatus',
        width: 96,
        render: (value: string | undefined) => (
          <Tag
            color={storeConnectionStatusColor(value)}
            style={{ marginInlineEnd: 0, fontWeight: value === '正常' ? 600 : 400 }}
          >
            {value || '未绑定'}
          </Tag>
        )
      }
    ];

    if (!canManageBinding) {
      return baseColumns;
    }

    return [
      ...baseColumns,
      {
        title: '操作',
        key: 'actions',
        width: 178,
        fixed: 'right' as const,
        render: (_: unknown, record) => (
          <Space className="nuono-row-actions" wrap={false} size={10}>
            <Button
              data-testid="store-bind-button"
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              onClick={() => {
                bindingForm.resetFields();
                setBindingMode(record.isAuthorized ? 'rebind' : 'bind');
                setBindingStore(record);
                bindingForm.setFieldsValue({});
                setBindingModalOpen(true);
              }}
            >
              {record.isAuthorized ? '修改账号' : '绑定账号'}
            </Button>
            <Button
              data-testid="store-test-connection-button"
              data-store-code={record.storeCode}
              type="link"
              size="small"
              loading={storeConnectionTestFeedback?.storeCode === record.storeCode && storeConnectionTestFeedback.status === 'loading'}
              disabled={
                !record.isAuthorized ||
                (storeConnectionTestFeedback?.storeCode === record.storeCode && storeConnectionTestFeedback.status === 'loading')
              }
              style={{ paddingInline: 0, color: record.isAuthorized ? undefined : '#94a3b8' }}
              onClick={async () => {
                if (!record.isAuthorized || !ownerId) {
                  return;
                }

                setStoreConnectionTestFeedback({
                  storeCode: record.storeCode,
                  projectName: record.projectName || record.storeCode,
                  status: 'loading',
                  message: `正在测试 ${record.projectName || record.storeCode} 的 Noon 连通状态...`
                });
                try {
                  const payload = await testStoreSyncConnection(ownerId, record.storeCode);
                  if (payload.connected) {
                    setStoreConnectionTestFeedback({
                      storeCode: record.storeCode,
                      projectName: record.projectName || record.storeCode,
                      status: 'success',
                      message: `店铺“${record.projectName || record.storeCode}”${payload.message ?? '连接正常'}`
                    });
                  } else {
                    setStoreConnectionTestFeedback({
                      storeCode: record.storeCode,
                      projectName: record.projectName || record.storeCode,
                      status: 'warning',
                      message: payload.message ?? '连接失败，请重新绑定账号'
                    });
                  }
                  await refresh(ownerId, { preserveConnectionFeedback: true });
                } catch (error) {
                  const errorMessage =
                    error instanceof DOMException && error.name === 'TimeoutError'
                      ? '连接超时，请稍后重试或重新绑定账号'
                      : normalizeError(error, '测试连通失败');
                  setStoreConnectionTestFeedback({
                    storeCode: record.storeCode,
                    projectName: record.projectName || record.storeCode,
                    status: 'error',
                    message: errorMessage.includes('连接') ? errorMessage : `连接失败：${errorMessage}`
                  });
                }
              }}
            >
              {storeConnectionTestFeedback?.storeCode === record.storeCode && storeConnectionTestFeedback.status === 'loading'
                ? '测试中'
                : record.isAuthorized
                  ? '测试连通'
                  : '未绑定'}
            </Button>
          </Space>
        )
      }
    ];
  }, [bindingForm, canManageBinding, ownerId, refresh, storeConnectionTestFeedback]);
  return columns;
}
