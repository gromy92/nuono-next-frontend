import { Card, List, Space, Table, Tag, Typography } from 'antd'
import type { LogisticsQuoteBundleDetailDto } from '../types'
import { formatUnitPrice, severityColor, transportModeColor } from '../utils'

const { Paragraph, Text } = Typography

type StructuredQuoteSectionProps = {
  bundle: LogisticsQuoteBundleDetailDto
}

export function StructuredQuoteSection({ bundle }: StructuredQuoteSectionProps) {
  const serviceColumns = [
    {
      title: '服务',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (value: string, record: LogisticsQuoteBundleDetailDto['services'][number]) => (
        <Space direction="vertical" size={4}>
          <Text strong>{value}</Text>
          <Space wrap size={[6, 6]}>
            <Tag color={transportModeColor(record.transportMode)} style={{ marginInlineEnd: 0 }}>
              {record.transportMode || '-'}
            </Tag>
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              {record.businessType || '-'}
            </Tag>
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
              {record.serviceScope || '-'}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '线路',
      key: 'route',
      render: (_: unknown, record: LogisticsQuoteBundleDetailDto['services'][number]) => (
        <Text>{record.routeCode || record.countryCode || '-'}</Text>
      )
    },
    {
      title: '时效',
      dataIndex: 'transitTimeText',
      key: 'transitTimeText'
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks'
    }
  ]

  const ruleColumns = [
    {
      title: '规则',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (value: string, record: LogisticsQuoteBundleDetailDto['rules'][number]) => (
        <Space direction="vertical" size={4}>
          <Text strong>{value}</Text>
          <Space wrap size={[6, 6]}>
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
              {record.ruleType}
            </Tag>
            {record.cargoCategory ? (
              <Tag color="default" style={{ marginInlineEnd: 0 }}>
                {record.cargoCategory}
              </Tag>
            ) : null}
          </Space>
        </Space>
      )
    },
    {
      title: '服务',
      dataIndex: 'serviceName',
      key: 'serviceName'
    },
    {
      title: '计费',
      key: 'billing',
      render: (_: unknown, record: LogisticsQuoteBundleDetailDto['rules'][number]) => (
        <Text>
          {formatUnitPrice(record.unitPrice, record.currency)} / {record.billingUnit || '-'}
        </Text>
      )
    },
    {
      title: '口径',
      dataIndex: 'calcBasis',
      key: 'calcBasis'
    },
    {
      title: '说明',
      dataIndex: 'summary',
      key: 'summary'
    }
  ]

  const restrictionColumns = [
    {
      title: '限制',
      dataIndex: 'restrictionType',
      key: 'restrictionType',
      render: (value: string, record: LogisticsQuoteBundleDetailDto['restrictions'][number]) => (
        <Space direction="vertical" size={4}>
          <Space wrap size={[6, 6]}>
            <Text strong>{value}</Text>
            <Tag color={severityColor(record.severity)} style={{ marginInlineEnd: 0 }}>
              {record.severity || '-'}
            </Tag>
          </Space>
          <Text type="secondary">
            {record.operator || '-'} {record.value || '-'} {record.unit || ''}
          </Text>
        </Space>
      )
    },
    {
      title: '服务',
      dataIndex: 'serviceName',
      key: 'serviceName'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    }
  ]

  return (
    <>
      <Card title="服务拆分" bordered={false} style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
        <Table
          columns={serviceColumns}
          dataSource={bundle.services}
          pagination={false}
          rowKey={(record) => `${record.serviceName}-${record.routeCode ?? 'route'}`}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>

      <Card title="标准化规则" bordered={false} style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
        <Table
          columns={ruleColumns}
          dataSource={bundle.rules}
          pagination={false}
          rowKey={(record) => `${record.serviceName}-${record.ruleName}-${record.ruleType}`}
          size="small"
          scroll={{ x: 1100 }}
        />
      </Card>

      <Card title="限制条件" bordered={false} style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
        <Table
          columns={restrictionColumns}
          dataSource={bundle.restrictions}
          pagination={false}
          rowKey={(record) => `${record.serviceName}-${record.restrictionType}-${record.description}`}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Card title="证据挂接" bordered={false} style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
        <List
          dataSource={bundle.evidences}
          locale={{ emptyText: '暂无证据映射' }}
          renderItem={(item) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space wrap size={[8, 8]}>
                  <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                    {item.targetType}
                  </Tag>
                  <Text strong>{item.targetName}</Text>
                </Space>
                <Text type="secondary">
                  来源 {item.sourceType} · {item.sourceName} · {item.locator || '-'}
                </Text>
                <Paragraph style={{ margin: 0 }}>{item.evidenceText || '-'}</Paragraph>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </>
  )
}
