import { Button, Card, List, Space, Tag, Typography } from 'antd'
import type { LogisticsQuoteBundleListItemDto } from '../types'
import { bundleStatusColor, recommendationColor } from '../utils'

const { Text } = Typography

type BundleListCardProps = {
  bundles: LogisticsQuoteBundleListItemDto[]
  selectedBundleId?: number | null
  onSelectBundle: (bundleId: number) => void
}

export function BundleListCard({ bundles, selectedBundleId, onSelectBundle }: BundleListCardProps) {
  return (
    <Card
      title="来源包列表"
      bordered={false}
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
    >
      <List
        dataSource={bundles}
        locale={{ emptyText: '当前还没有来源包样本' }}
        renderItem={(item) => {
          const active = item.id === selectedBundleId
          return (
            <List.Item style={{ paddingInline: 0 }}>
              <Button
                type={active ? 'primary' : 'default'}
                style={{
                  width: '100%',
                  height: 'auto',
                  textAlign: 'left',
                  padding: 14
                }}
                onClick={() => onSelectBundle(item.id)}
              >
                <Space direction="vertical" size={4} style={{ width: '100%', alignItems: 'flex-start' }}>
                  <Text strong style={{ color: active ? '#ffffff' : undefined }}>
                    {item.bundleName}
                  </Text>
                  <Space wrap size={[6, 6]}>
                    <Tag color="default" style={{ marginInlineEnd: 0 }}>
                      {item.forwarderName}
                    </Tag>
                    <Tag color={bundleStatusColor(item.analysisStatus)} style={{ marginInlineEnd: 0 }}>
                      {item.analysisStatus}
                    </Tag>
                    <Tag color={bundleStatusColor(item.latestVersionStatus)} style={{ marginInlineEnd: 0 }}>
                      {item.latestVersionStatus}
                    </Tag>
                    <Tag color={recommendationColor(item.recommendationLevel)} style={{ marginInlineEnd: 0 }}>
                      风评 {item.recommendationLevel}
                    </Tag>
                  </Space>
                  <Text style={{ color: active ? 'rgba(255,255,255,0.85)' : '#64748b' }}>
                    {item.latestVersionNo} · 文件 {item.fileCount} · 文案 {item.noteCount}
                  </Text>
                </Space>
              </Button>
            </List.Item>
          )
        }}
      />
    </Card>
  )
}
