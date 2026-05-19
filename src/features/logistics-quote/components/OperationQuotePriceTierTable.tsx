import { Button, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OperationQuotePriceTierRow } from '../operationQuoteModels'
import type { LogisticsQuoteOperationPriceItemDto } from '../types'
import { operationPriceStatusColor, transportModeColor } from '../utils'

const { Paragraph, Text } = Typography

type OperationQuotePriceTierTableProps = {
  rows: OperationQuotePriceTierRow[]
  loading: boolean
  canAdjust: boolean
  emptyText: string
  onAdjust: (item: LogisticsQuoteOperationPriceItemDto) => void
}

export function OperationQuotePriceTierTable({
  rows,
  loading,
  canAdjust,
  emptyText,
  onAdjust
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
          <Text strong>{record.effectivePriceText}</Text>
          {record.hasAdjustment ? (
            <Text type="secondary">标准：{record.standardPriceText}</Text>
          ) : (
            <Text type="secondary">未调整</Text>
          )}
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
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button size="small" disabled={!canAdjust} onClick={() => onAdjust(record.sourceItem)}>
          调整单价
        </Button>
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
      scroll={{ x: 1750 }}
      locale={{ emptyText }}
    />
  )
}
