import { Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ShippingSuggestionOption } from './types'
import type { ShippingForwarderCostBreakdown as ShippingForwarderCostBreakdownRow } from './workbenchModels'
import {
  buildShippingForwarderCostBreakdowns,
  formatShippingAmountTotals,
  formatShippingMetric,
  shippingCostTypeLabel
} from './shippingCostDomain'

const { Text } = Typography

export function ShippingForwarderBreakdown({ option }: { option: ShippingSuggestionOption }) {
  const columns: ColumnsType<ShippingForwarderCostBreakdownRow> = [
    {
      title: '货代 / 线路',
      key: 'forwarder',
      width: 220,
      render: (_, row) => (
        <div className="warehouse-dispatch-cost-name">
          <Text strong>{row.forwarderName || row.forwarderCode || '货代待确认'}</Text>
          <Text type="secondary" ellipsis={{ tooltip: row.routeNames.join(' / ') }}>
            {row.routeNames.join(' / ') || (row.lines.length ? '线路待确认' : '未分配商品')}
          </Text>
        </div>
      )
    },
    { title: 'PSKU', dataIndex: 'pskuCount', width: 80, align: 'right', responsive: ['sm'],
      render: (value: number) => `${value} 个` },
    { title: '商品数量', dataIndex: 'totalQuantity', width: 100, align: 'right',
      render: (value: number) => `${value.toLocaleString()} 件` },
    { title: '实际重量', dataIndex: 'actualWeightKg', width: 110, align: 'right', responsive: ['md'],
      render: (value?: number) => formatShippingMetric(value, 3, 'kg') },
    { title: '体积', dataIndex: 'volumeCbm', width: 105, align: 'right', responsive: ['md'],
      render: (value?: number) => formatShippingMetric(value, 4, 'm³') },
    { title: '计费重量', dataIndex: 'chargeableWeightKg', width: 110, align: 'right', responsive: ['lg'],
      render: (value?: number) => formatShippingMetric(value, 3, 'kg') },
    {
      title: '货代费用',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (_, row) => (
        <div className="warehouse-dispatch-forwarder-amount">
          <Text strong>{formatShippingAmountTotals(row.amounts)}</Text>
          {row.pendingAmountLineCount > 0 ? <Text type="warning">{row.pendingAmountLineCount} 行待复核</Text> : null}
        </div>
      )
    },
    {
      title: '费用组成',
      key: 'components',
      width: 240,
      responsive: ['lg'],
      render: (_, row) => row.costComponents.length ? (
        <div className="warehouse-dispatch-forwarder-cost-components">
          {row.costComponents.map((component) => (
            <div className="warehouse-dispatch-forwarder-cost-row" key={component.key}>
              <span>{component.componentName || shippingCostTypeLabel(component.componentType)}</span>
              <span>{formatShippingAmountTotals(component.amounts)}</span>
            </div>
          ))}
        </div>
      ) : <Text type="secondary">费用分项待复核</Text>
    }
  ]
  return (
    <div className="warehouse-dispatch-forwarder-breakdown">
      <div className="warehouse-dispatch-route-list-title">组合货代分项</div>
      <Table className="warehouse-dispatch-cost-fit-table" rowKey="key" size="small"
        tableLayout="fixed" columns={columns} dataSource={buildShippingForwarderCostBreakdowns(option)}
        pagination={false} />
    </div>
  )
}
