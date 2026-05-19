import { Alert, Card, Descriptions, Space, Tag, Typography } from 'antd'
import type { LogisticsQuoteBundleDetailDto } from '../types'
import { bundleStatusColor, recommendationColor } from '../utils'

const { Text } = Typography

type BundleHeaderCardProps = {
  bundle: LogisticsQuoteBundleDetailDto
  workbenchMode: string
}

export function BundleHeaderCard({ bundle, workbenchMode }: BundleHeaderCardProps) {
  return (
    <Card
      bordered={false}
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
      title={
        <Space wrap size={[8, 8]}>
          <Text strong style={{ fontSize: 16 }}>
            {bundle.bundleName}
          </Text>
          <Tag color={bundleStatusColor(bundle.analysisStatus)} style={{ marginInlineEnd: 0 }}>
            {bundle.analysisStatus}
          </Tag>
          <Tag color={bundleStatusColor(bundle.quoteVersion.status)} style={{ marginInlineEnd: 0 }}>
            {bundle.quoteVersion.status}
          </Tag>
          <Tag color={recommendationColor(bundle.reputationSnapshot.recommendationLevel)} style={{ marginInlineEnd: 0 }}>
            风评 {bundle.reputationSnapshot.recommendationLevel || '-'}
          </Tag>
        </Space>
      }
    >
      <Descriptions column={2} size="small" colon={false}>
        <Descriptions.Item label="货代">{bundle.forwarder.name}</Descriptions.Item>
        <Descriptions.Item label="别名">{bundle.forwarder.alias || '-'}</Descriptions.Item>
        <Descriptions.Item label="版本">{bundle.quoteVersion.versionNo}</Descriptions.Item>
        <Descriptions.Item label="生效时间">{bundle.quoteVersion.effectiveFrom || '-'}</Descriptions.Item>
        <Descriptions.Item label="工作口径">{workbenchMode}</Descriptions.Item>
        <Descriptions.Item label="报价总结" span={2}>
          {bundle.quoteVersion.summary || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="来源摘要" span={2}>
          {bundle.analysisSummary || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="货代备注" span={2}>
          {bundle.forwarder.notes || '-'}
        </Descriptions.Item>
      </Descriptions>
      {bundle.sourceReadbackHint ? (
        <Alert
          style={{ marginTop: 16 }}
          type={workbenchMode === 'local-db' ? 'success' : 'info'}
          showIcon
          message={workbenchMode === 'local-db' ? '当前来源状态' : '当前样本状态'}
          description={bundle.sourceReadbackHint}
        />
      ) : null}
    </Card>
  )
}
