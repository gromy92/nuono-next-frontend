import { Alert, Button, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatSnapshotValue } from '../utils';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import type { ProductPublishConflictField } from '../types';

const { Text } = Typography;

type ProductPublishConflictAlertProps = {
  workspace: ProductManagementWorkspace;
};

function formatConflictValue(value: unknown) {
  if (value == null || value === '') {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return formatSnapshotValue(value);
}

export function ProductPublishConflictAlert({ workspace }: ProductPublishConflictAlertProps) {
  const { productSnapshotState, productActionSubmitting, previewProductAction } = workspace;
  const publishConflict =
    productSnapshotState.status === 'success' ? productSnapshotState.data.publishConflict : undefined;
  const fields = publishConflict?.fields ?? [];

  if (!publishConflict || fields.length === 0) {
    return null;
  }

  const columns: ColumnsType<ProductPublishConflictField> = [
    {
      title: '字段',
      key: 'label',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.label || record.path}</Text>
          <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>{record.scope === 'site' ? '站点经营面' : '商品主档'}</Text>
        </Space>
      )
    },
    {
      title: '本地草稿',
      dataIndex: 'localValue',
      key: 'localValue',
      ellipsis: true,
      render: (value) => formatConflictValue(value)
    },
    {
      title: 'Noon 当前内容',
      dataIndex: 'noonValue',
      key: 'noonValue',
      ellipsis: true,
      render: (value) => formatConflictValue(value)
    }
  ];

  return (
    <Alert
      type="warning"
      showIcon
      message={publishConflict.message || '发布前发现 Noon 当前内容与本地草稿存在冲突'}
      description={
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text style={{ color: '#334155' }}>
            请选择继续用本地草稿覆盖 Noon，或使用 Noon 当前内容覆盖本地草稿后重新编辑。
          </Text>
          <Table
            size="small"
            rowKey={(record) => record.path}
            columns={columns}
            dataSource={fields}
            pagination={false}
            tableLayout="fixed"
          />
          <Space wrap>
            <Button
              type="primary"
              loading={productActionSubmitting}
              onClick={() => void previewProductAction('publish-current', { publishConflictResolution: 'use_local' })}
            >
              使用本地内容覆盖 Noon
            </Button>
            <Button
              loading={productActionSubmitting}
              onClick={() => void previewProductAction('pull', { syncMergePolicy: 'use_noon' })}
            >
              使用 Noon 覆盖本地草稿
            </Button>
          </Space>
        </Space>
      }
    />
  );
}
