import { Alert, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReactNode } from 'react'
import type { ShippingCostComponent, ShippingSuggestionLine, ShippingSuggestionOption } from './types'
import {
  formatBillableQuantity,
  formatShippingComponentCalculation,
  formatShippingMetric,
  formatShippingMoney,
  formatShippingUnitQuote,
  isCombinationShippingOption,
  shippingCostTypeLabel
} from './shippingCostDomain'
import { ShippingForwarderBreakdown } from './ShippingForwarderBreakdown'

const { Text } = Typography

export function ShippingCostBreakdown({ option }: { option: ShippingSuggestionOption }) {
  const componentColumns: ColumnsType<ShippingCostComponent> = [
    {
      title: '费用项',
      dataIndex: 'componentName',
      width: 210,
      render: (_, component) => (
        <div className="warehouse-dispatch-cost-name">
          <Text strong>{component.componentName}</Text>
          <Text type="secondary">{shippingCostTypeLabel(component.componentType)}</Text>
        </div>
      )
    },
    { title: '录入报价', key: 'quote', width: 170,
      render: (_, component) => formatShippingUnitQuote(component) },
    { title: '整批计费量', key: 'billableQuantity', width: 130, align: 'right',
      render: (_, component) => formatBillableQuantity(component.billableQuantity, component.billingUnit) },
    { title: '涉及商品', dataIndex: 'productLineCount', width: 95, align: 'right', responsive: ['md'],
      render: (value: number) => `${value} 行` },
    { title: '费用小计', key: 'amount', width: 140, align: 'right',
      render: (_, component) => <Text strong>{formatShippingMoney(component.amount, component.currency)}</Text> }
  ]
  const productColumns: ColumnsType<ShippingSuggestionLine> = [
    {
      title: '商品',
      key: 'product',
      width: 220,
      render: (_, line) => (
        <div className="warehouse-dispatch-cost-product">
          <Text strong copyable>{line.partnerSku}</Text>
          <Text type="secondary" ellipsis={{ tooltip: line.productTitle }}>{line.productTitle}</Text>
        </div>
      )
    },
    { title: '数量', dataIndex: 'quantity', width: 65, align: 'right',
      render: (value: number) => `${value} 件` },
    {
      title: '货代 / 线路',
      key: 'route',
      width: 165,
      responsive: ['md'],
      render: (_, line) => (
        <div className="warehouse-dispatch-cost-name">
          <Text>{line.targetForwarderName || line.targetForwarderCode || '-'}</Text>
          <Text type="secondary" ellipsis={{ tooltip: line.routeName || line.routeCode }}>
            {line.routeName || line.routeCode || '线路待确认'}
          </Text>
        </div>
      )
    },
    { title: '整行重量', dataIndex: 'actualWeightKg', width: 90, align: 'right', responsive: ['lg'],
      render: (value?: number) => formatShippingMetric(value, 3, 'kg') },
    { title: '整行体积', dataIndex: 'volumeCbm', width: 90, align: 'right', responsive: ['lg'],
      render: (value?: number) => formatShippingMetric(value, 4, 'm³') },
    {
      title: '计费量',
      key: 'billing',
      width: 125,
      align: 'right',
      responsive: ['md'],
      render: (_, line) => (
        <div className="warehouse-dispatch-cost-billing">
          <Text strong>{formatBillableQuantity(line.billableQuantity, line.billingUnit)}</Text>
          {line.minimumNotMet && line.minimumBillableUnit !== undefined ? (
            <Text type="warning">
              最低计费 {formatBillableQuantity(line.minimumBillableUnit, line.billingUnit)}
            </Text>
          ) : null}
        </div>
      )
    },
    {
      title: '按报价计算',
      key: 'components',
      width: 225,
      responsive: ['xl'],
      render: (_, line) => line.costComponents.length ? (
        <div className="warehouse-dispatch-product-cost-components">
          {line.costComponents.map((component, index) => (
            <div className="warehouse-dispatch-product-cost-row"
              key={`${component.componentType}-${component.sourceId || index}`}>
              <span>{component.componentName}</span>
              <span>{formatShippingComponentCalculation(component)}</span>
            </div>
          ))}
        </div>
      ) : <Text type="secondary">费用待复核</Text>
    },
    { title: '商品费用', key: 'estimatedAmount', width: 120, align: 'right',
      render: (_, line) => <Text strong>{formatShippingMoney(line.estimatedAmount, line.currency)}</Text> }
  ]

  return (
    <section className="warehouse-dispatch-cost-breakdown">
      <div className="warehouse-dispatch-cost-heading">
        <div>
          <Text strong>{option.optionName} 方案明细</Text>
          <Text type="secondary">按录入报价和当前计费规则估算</Text>
        </div>
        {option.blockedReasons.length
          ? <Tag color="gold">{option.warningCount} 项需复核</Tag>
          : <Tag color="green">费用可核对</Tag>}
      </div>
      <div className="warehouse-dispatch-cost-summary">
        {summaryItem('整批商品', `${option.totalQuantity.toLocaleString()} 件`)}
        {summaryItem('整批重量', formatShippingMetric(option.actualWeightKg, 3, 'kg'))}
        {summaryItem('整批体积', formatShippingMetric(option.volumeCbm, 4, 'm³'))}
        {summaryItem('计费重量', formatShippingMetric(option.chargeableWeightKg, 3, 'kg'))}
        {summaryItem('商品均摊', formatShippingMoney(option.avgUnitAmount, option.currency))}
        {summaryItem('整批费用', formatShippingMoney(option.estimatedTotalAmount, option.currency), true)}
      </div>
      {isCombinationShippingOption(option) ? <ShippingForwarderBreakdown option={option} /> : null}
      {option.costComponents.length ? (
        <div className="warehouse-dispatch-cost-table-block">
          <div className="warehouse-dispatch-route-list-title">整批费用组成</div>
          <Table className="warehouse-dispatch-cost-fit-table" size="small" tableLayout="fixed"
            rowKey={(component) => [component.componentType, component.componentName, component.sourceId,
              component.unitPrice, component.billingUnit].join('-')}
            columns={componentColumns} dataSource={option.costComponents} pagination={false} />
        </div>
      ) : null}
      <div className="warehouse-dispatch-cost-table-block">
        <div className="warehouse-dispatch-route-list-title">逐商品费用</div>
        {option.lines.length ? (
          <Table className="warehouse-dispatch-cost-fit-table" rowKey="id" size="small"
            tableLayout="fixed" columns={productColumns} dataSource={option.lines}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100],
              showTotal: (total) => `共 ${total} 行商品` }} />
        ) : (
          <Alert type="warning" showIcon message="当前物流方案没有商品费用快照，请刷新后重新查看。" />
        )}
      </div>
    </section>
  )
}

function summaryItem(label: string, value: ReactNode, strong = false) {
  return (
    <div className={`warehouse-dispatch-cost-summary-item${strong ? ' is-strong' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
