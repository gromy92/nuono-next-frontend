import { Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OperationQuoteFeeItemRow } from '../operationQuoteModels'
import { operationPriceStatusColor, transportModeColor } from '../utils'

const { Paragraph, Text } = Typography

type OperationQuoteFeeItemTableProps = {
  rows: OperationQuoteFeeItemRow[]
  loading: boolean
  emptyText: string
}

export function OperationQuoteFeeItemTable({
  rows,
  loading,
  emptyText
}: OperationQuoteFeeItemTableProps) {
  const columns: ColumnsType<OperationQuoteFeeItemRow> = [
    {
      title: '货代 / 版本',
      key: 'forwarder',
      width: 190,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.forwarderName}</Text>
          <Text type="secondary">{record.quoteVersionNo}</Text>
          <Tag color={transportModeColor(record.transportMode)} style={{ marginInlineEnd: 0 }}>
            {record.transportModeText}
          </Tag>
        </Space>
      )
    },
    {
      title: '费用类型',
      key: 'feeType',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.feeType}</Text>
          <Tag color={operationPriceStatusColor(record.priceStatus)} style={{ marginInlineEnd: 0 }}>
            {record.priceStatus || 'NORMAL'}
          </Tag>
        </Space>
      )
    },
    {
      title: '费用名称',
      dataIndex: 'feeName',
      width: 220
    },
    {
      title: '单价',
      key: 'price',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.currentPriceText}</Text>
          <Text type="secondary">正式报价</Text>
        </Space>
      )
    },
    {
      title: '计价单位',
      dataIndex: 'billingUnitText',
      width: 110
    },
    {
      title: '最低收费规则',
      dataIndex: 'minChargeRule',
      width: 190
    },
    {
      title: '适用条件',
      dataIndex: 'conditionText',
      width: 260,
      render: (value: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} style={{ marginBottom: 0 }}>
          {value}
        </Paragraph>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 260,
      render: (value: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} style={{ marginBottom: 0 }}>
          {value}
        </Paragraph>
      )
    }
  ]

  return (
    <Table
      size="small"
      rowKey="key"
      loading={loading}
      dataSource={rows}
      columns={columns}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      scroll={{ x: 1550 }}
      locale={{ emptyText }}
    />
  )
}
