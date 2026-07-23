import { CheckCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ShippingSuggestionOption } from './types'
import {
  formatShippingMetric,
  formatShippingMoney,
  isCombinationShippingOption
} from './shippingCostDomain'
import { ShippingForwarderBreakdown } from './ShippingForwarderBreakdown'

const { Text } = Typography

type ShippingOptionComparisonProps = {
  options: ShippingSuggestionOption[]
  selectedSubmissionOptionId?: string
  detailOptionId: string
  selectionLocked: boolean
  onView: (optionId: string) => void
  onSelect: (optionId: string) => void
}

export function ShippingOptionComparison({
  options,
  selectedSubmissionOptionId,
  detailOptionId,
  selectionLocked,
  onView,
  onSelect
}: ShippingOptionComparisonProps) {
  const columns: ColumnsType<ShippingSuggestionOption> = [
    {
      title: '物流方案',
      dataIndex: 'optionName',
      width: 200,
      render: (_, option) => (
        <Space size={6} wrap>
          <Text strong>{option.optionName}</Text>
          {isCombinationShippingOption(option) ? <Tag color="purple">组合方案</Tag> : null}
          {option.id === selectedSubmissionOptionId ? <Tag color="blue">已选方案</Tag> : null}
          {option.id === detailOptionId ? <Tag color="cyan">查看中</Tag> : null}
        </Space>
      )
    },
    {
      title: '货代',
      key: 'forwarders',
      width: 160,
      responsive: ['md'],
      render: (_, option) => option.targetForwarderNames.join(' / ') || '未指定货代'
    },
    {
      title: '整批重量',
      dataIndex: 'actualWeightKg',
      width: 110,
      align: 'right',
      responsive: ['lg'],
      render: (value?: number) => formatShippingMetric(value, 3, 'kg')
    },
    {
      title: '整批体积',
      dataIndex: 'volumeCbm',
      width: 110,
      align: 'right',
      responsive: ['lg'],
      render: (value?: number) => formatShippingMetric(value, 4, 'm³')
    },
    {
      title: '整批费用',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (_, option) => <Text strong>{formatShippingMoney(option.estimatedTotalAmount, option.currency)}</Text>
    },
    {
      title: '状态',
      key: 'reviewStatus',
      width: 85,
      responsive: ['sm'],
      render: (_, option) => option.warningCount > 0 || option.blockedReasons.length
        ? <Tag color="gold">需复核</Tag>
        : <Tag color="green">可用</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 215,
      render: (_, option) => (
        <Space size={6} wrap>
          <Button
            size="small"
            type={option.id === selectedSubmissionOptionId ? 'primary' : 'default'}
            icon={<CheckCircleOutlined />}
            disabled={selectionLocked || option.id === selectedSubmissionOptionId}
            title={selectionLocked ? '发货单已下发，物流方案不能修改' : undefined}
            onClick={() => onSelect(option.id)}
          >
            {option.id === selectedSubmissionOptionId ? '已选择' : '选择此方案'}
          </Button>
          <Button
            size="small"
            type={option.id === detailOptionId ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={() => onView(option.id)}
          >
            {option.id === detailOptionId ? '正在查看' : '查看明细'}
          </Button>
        </Space>
      )
    }
  ]
  return (
    <section className="warehouse-dispatch-cost-comparison">
      <div className="warehouse-dispatch-route-list-title">全部物流方案</div>
      <Table
        className="warehouse-dispatch-cost-fit-table"
        rowKey="id"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={options}
        pagination={false}
        rowClassName={(option) => [
          option.id === selectedSubmissionOptionId ? 'warehouse-dispatch-cost-selected-row' : '',
          option.id === detailOptionId ? 'warehouse-dispatch-cost-viewing-row' : ''
        ].filter(Boolean).join(' ')}
        expandable={{
          defaultExpandAllRows: false,
          rowExpandable: isCombinationShippingOption,
          expandedRowRender: (option) => <ShippingForwarderBreakdown option={option} />
        }}
      />
    </section>
  )
}
