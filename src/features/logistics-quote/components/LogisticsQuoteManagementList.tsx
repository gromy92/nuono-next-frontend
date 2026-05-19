import { Button, Card, Space, Table, Tag, Typography } from 'antd'
import type { LogisticsQuoteBundleListItemDto } from '../types'
import { bundleStatusColor, recommendationColor } from '../utils'

const { Text } = Typography

type LogisticsQuoteManagementListProps = {
  bundles: LogisticsQuoteBundleListItemDto[]
  selectedBundleId?: number | null
  onCreateBundle: () => void
  onSelectBundle: (bundleId: number) => void
}

function resolveSourceStatus(item: LogisticsQuoteBundleListItemDto) {
  if (item.fileCount <= 0) {
    return { label: '待补文件', color: 'warning' }
  }
  if (item.noteCount <= 0) {
    return { label: '待补补充文案', color: 'warning' }
  }
  if (item.latestVersionStatus === 'PUBLISHED') {
    return { label: '已归档发布', color: 'success' }
  }
  if (item.latestVersionStatus === 'DRAFT' || item.analysisStatus === 'READY_FOR_REVIEW') {
    return { label: '待版本确认', color: 'processing' }
  }
  return { label: '待整理', color: 'default' }
}

export function LogisticsQuoteManagementList({
  bundles,
  selectedBundleId,
  onCreateBundle,
  onSelectBundle
}: LogisticsQuoteManagementListProps) {
  return (
    <Card
      title="货代资料管理"
      bordered={false}
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
      extra={
        <Button type="primary" onClick={onCreateBundle}>
          新增报价资料
        </Button>
      }
    >
      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={bundles}
        scroll={{ x: 980 }}
        rowClassName={(record) => (record.id === selectedBundleId ? 'ant-table-row-selected' : '')}
        locale={{ emptyText: '当前还没有货代报价资料包' }}
        columns={[
          {
            title: '货代 / 资料包',
            key: 'bundle',
            width: 300,
            render: (_, record) => (
              <Space direction="vertical" size={4}>
                <Text strong>{record.bundleName}</Text>
                <Text type="secondary">{record.forwarderName}</Text>
              </Space>
            )
          },
          {
            title: '文件',
            dataIndex: 'fileCount',
            key: 'fileCount',
            width: 90,
            render: (value: number) => <Text>{value} 个</Text>
          },
          {
            title: '当前版本',
            key: 'version',
            width: 180,
            render: (_, record) => (
              <Space direction="vertical" size={4}>
                <Text>{record.latestVersionNo || '未生成'}</Text>
                <Tag color={bundleStatusColor(record.latestVersionStatus)} style={{ marginInlineEnd: 0 }}>
                  {record.latestVersionStatus}
                </Tag>
              </Space>
            )
          },
          {
            title: '资料状态',
            key: 'sourceStatus',
            width: 140,
            render: (_, record) => {
              const status = resolveSourceStatus(record)
              return <Tag color={status.color}>{status.label}</Tag>
            }
          },
          {
            title: '风评',
            key: 'reputation',
            width: 100,
            render: (_, record) => (
              <Tag color={recommendationColor(record.recommendationLevel)} style={{ marginInlineEnd: 0 }}>
                {record.recommendationLevel || '-'}
              </Tag>
            )
          },
          {
            title: '更新时间',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 170,
            render: (value?: string) => value || '-'
          },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
              <Button
                size="small"
                type={record.id === selectedBundleId ? 'primary' : 'default'}
                onClick={() => onSelectBundle(record.id)}
              >
                {record.id === selectedBundleId ? '查看中' : '查看详情'}
              </Button>
            )
          }
        ]}
      />
    </Card>
  )
}
