import { Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OperationQuotePriceTierRow } from '../operationQuoteModels'
import { operationPriceStatusColor, transportModeColor } from '../utils'

const { Paragraph, Text } = Typography

type OperationQuotePriceTierTableProps = {
  rows: OperationQuotePriceTierRow[]
  loading: boolean
  emptyText: string
}

export function OperationQuotePriceTierTable({
  rows,
  loading,
  emptyText
}: OperationQuotePriceTierTableProps) {
  const columns: ColumnsType<OperationQuotePriceTierRow> = [
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
      title: '商品类别',
      key: 'category',
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.cargoCategoryName}</Text>
          <Tag color={operationPriceStatusColor(record.priceStatus)} style={{ marginInlineEnd: 0 }}>
            {record.priceStatus || 'NORMAL'}
          </Tag>
        </Space>
      )
    },
    {
      title: '适用品类说明',
      dataIndex: 'applicableDescription',
      width: 360,
      render: (value: string) => (
        <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }} style={{ marginBottom: 0 }}>
          {value}
        </Paragraph>
      )
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
      title: '时效',
      dataIndex: 'transitTimeText',
      width: 120
    },
    {
      title: '单箱单装',
      dataIndex: 'singleBoxPolicy',
      width: 140
    },
    {
      title: '最低起送/计费',
      dataIndex: 'minShipmentRule',
      width: 180
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
      scroll={{ x: 1600 }}
      locale={{ emptyText }}
    />
  )
}
