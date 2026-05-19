import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { LogisticsQuoteBundleDetailDto } from '../types'
import { polarityColor, severityColor } from '../utils'

const { Text } = Typography

type ReputationAnalysisCardProps = {
  bundle: LogisticsQuoteBundleDetailDto
}

export function ReputationAnalysisCard({ bundle }: ReputationAnalysisCardProps) {
  const signalColumns = [
    {
      title: '维度',
      dataIndex: 'signalType',
      key: 'signalType'
    },
    {
      title: '方向',
      dataIndex: 'polarity',
      key: 'polarity',
      render: (value: string) => (
        <Tag color={polarityColor(value)} style={{ marginInlineEnd: 0 }}>
          {value}
        </Tag>
      )
    },
    {
      title: '强度',
      dataIndex: 'severity',
      key: 'severity',
      render: (value: string) => (
        <Tag color={severityColor(value)} style={{ marginInlineEnd: 0 }}>
          {value}
        </Tag>
      )
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType'
    },
    {
      title: '主题',
      dataIndex: 'topic',
      key: 'topic'
    },
    {
      title: '证据',
      dataIndex: 'evidenceText',
      key: 'evidenceText'
    }
  ]

  return (
    <Card title="社会评价分析" bordered={false} style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8} xl={4}>
          <Statistic title="总分" value={bundle.reputationSnapshot.overallScore ?? '-'} />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Statistic title="合规" value={bundle.reputationSnapshot.complianceScore ?? '-'} />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Statistic title="时效" value={bundle.reputationSnapshot.timelinessScore ?? '-'} />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Statistic title="价格透明" value={bundle.reputationSnapshot.priceTransparencyScore ?? '-'} />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Statistic title="赔付" value={bundle.reputationSnapshot.claimsScore ?? '-'} />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <Statistic title="服务" value={bundle.reputationSnapshot.serviceScore ?? '-'} />
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        message={`建议等级 ${bundle.reputationSnapshot.recommendationLevel || '-'}`}
        description={
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Text>{bundle.reputationSnapshot.recentRiskSummary || '暂无近期风险摘要'}</Text>
            <Text type="secondary">{bundle.reputationSnapshot.analysisSummary || '-'}</Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      <Table
        columns={signalColumns}
        dataSource={bundle.reputationSignals}
        pagination={false}
        rowKey={(record) => `${record.signalType}-${record.topic}-${record.sourceType}`}
        size="small"
        scroll={{ x: 920 }}
      />
    </Card>
  )
}
