import { Drawer, Space, Table, Tag, Typography } from 'antd'
import { itemMeta } from '../calendarConfigDomain'
import { configTypeTag, statusTag } from '../versionLibraryPresentation'
import type { useOperationConfigLibraryController } from '../hooks/useOperationConfigLibraryController'

const { Text } = Typography

export function OperationConfigDetailDrawer({ state }: { state: ReturnType<typeof useOperationConfigLibraryController> }) {
  const { detail, setDetail, detailLoading } = state
  return (
        <Drawer
          title={detail?.displayName || '版本详情'}
          open={Boolean(detail)}
          onClose={() => setDetail(null)}
          width={720}
          loading={detailLoading}
        >
          {detail ? (
            <Space direction="vertical" size={16} className="operations-config-suite-layout" data-testid="operation-config-version-detail">
              <Space direction="vertical" size={4}>
                <Text strong>{detail.displayName}</Text>
                <Space>
                  {configTypeTag(detail)}
                  {statusTag(detail)}
                  {detail.sourceLabel && detail.sourceLabel !== detail.statusLabel ? <Tag>{detail.sourceLabel}</Tag> : null}
                </Space>
                <Text type="secondary">{detail.summary}</Text>
              </Space>
              <Table
                size="small"
                rowKey={(item) => `${item.groupName || 'default'}-${item.itemName}`}
                pagination={false}
                dataSource={detail.items}
                columns={[
                  {
                    title: '分组',
                    dataIndex: 'groupName',
                    key: 'groupName',
                    width: 120,
                    render: (value?: string | null) => value || '默认'
                  },
                  {
                    title: '配置项',
                    dataIndex: 'itemName',
                    key: 'itemName',
                    width: 180
                  },
                  {
                    title: '默认信息',
                    key: 'meta',
                    render: (_: unknown, item) => itemMeta(item) || item.note || '默认'
                  }
                ]}
              />
            </Space>
          ) : null}
        </Drawer>
  )
}
