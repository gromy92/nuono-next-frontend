import { Button, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OperationQuoteFeeItemRow } from '../operationQuoteModels'
import type { LogisticsQuoteOperationPriceItemDto } from '../types'
import { operationPriceStatusColor, transportModeColor } from '../utils'

const { Paragraph, Text } = Typography

type OperationQuoteFeeItemTableProps = {
  rows: OperationQuoteFeeItemRow[]
  loading: boolean
  canAdjust: boolean
  emptyText: string
  onAdjust: (item: LogisticsQuoteOperationPriceItemDto) => void
}

export function OperationQuoteFeeItemTable({
  rows,
  loading,
  canAdjust,
  emptyText,
  onAdjust
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
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button size="small" disabled={!canAdjust} onClick={() => onAdjust(record.sourceItem)}>
          调整数值
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
      scroll={{ x: 1700 }}
      locale={{ emptyText }}
    />
  )
}
