import { App, Empty, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { fetchOrderFinanceSkuOrders } from './api'
import type { OrderFinanceOrderGroup, OrderFinanceQuery, OrderFinanceSkuSummaryRow } from './types'
import type { OrderFinanceLineRecord, OrderFinanceOrderRecord } from './orderFinanceModel'
import {
  amountValue,
  formatMoney,
  groupOrderFinanceOrders,
  minDate,
  maxDate,
} from './orderFinanceModel'

const { Text } = Typography

export function OrderFinanceOrderDetail({ query, row }: { query: OrderFinanceQuery; row: OrderFinanceSkuSummaryRow }) {
  const { message } = App.useApp()
  const [groups, setGroups] = useState<OrderFinanceOrderGroup[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadGroups = async () => {
      setLoading(true)
      try {
        const payload = await fetchOrderFinanceSkuOrders(query, row)
        if (!cancelled) {
          setGroups(groupOrderFinanceOrders(payload, row))
        }
      } catch (error) {
        if (!cancelled) {
          message.error(error instanceof Error ? error.message : '订单明细加载失败')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void loadGroups()
    return () => {
      cancelled = true
    }
  }, [message, query, row])

  const lines = useMemo<OrderFinanceLineRecord[]>(() => (
    groups.flatMap((group, groupIndex) => (
      (group.lines || []).map((line, lineIndex) => ({
        ...line,
        orderNr: line.orderNr || group.orderNr || 'NA',
        orderDate: line.orderDate || group.orderDate,
        currency: line.currency || group.currency || row.currency || '未知',
        detailKey: [
          group.currency || row.currency || 'currency',
          group.orderNr || line.orderNr || 'order',
          line.transactionDate || 'date',
          line.transactionType || 'type',
          line.itemNr || 'item',
          groupIndex,
          lineIndex
        ].join('::')
      }))
    ))
  ), [groups, row.currency])
  const orderRows = useMemo<OrderFinanceOrderRecord[]>(() => (
    groups.map((group, groupIndex) => {
      const orderLines = lines.filter((line) => (line.orderNr || 'NA') === (group.orderNr || 'NA'))
      const currency = group.currency || orderLines[0]?.currency || row.currency || '未知'
      const orderNr = group.orderNr || orderLines[0]?.orderNr || 'NA'
      const transactionDates = orderLines.map((line) => line.transactionDate).filter(Boolean).sort()
      return {
        detailKey: [currency, orderNr, groupIndex].join('::'),
        orderNr,
        orderDate: group.orderDate || orderLines[0]?.orderDate,
        transactionDateFrom: group.transactionDateFrom || transactionDates[0],
        transactionDateTo: group.transactionDateTo || transactionDates[transactionDates.length - 1],
        currency,
        lines: orderLines,
        totalAmount: orderLines.reduce((sum, line) => sum + totalFeeAmount(line), 0)
      }
    })
  ), [groups, lines, row.currency])

  if (loading) {
    return (
      <div className="order-finance-detail-loading">
        <Text type="secondary">正在加载订单明细...</Text>
      </div>
    )
  }

  if (!orderRows.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无订单明细" />
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <div className="order-finance-detail-summary">
        <span>订单 {groups.length}</span>
        <span>交易行 {lines.length}</span>
        <span>后续更新 {row.orderUpdateRowCount || 0}</span>
        <span>Total {formatMoney(row.totalAmount, row.currency)}</span>
      </div>
      <Table<OrderFinanceOrderRecord>
        rowKey="detailKey"
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={detailColumns}
        dataSource={orderRows}
        scroll={{ x: 760 }}
      />
    </Space>
  )
}

const detailColumns: ColumnsType<OrderFinanceOrderRecord> = [
  {
    title: 'Order Nr',
    dataIndex: 'orderNr',
    key: 'orderNr',
    width: 180,
    render: (value: string | null, order) => (
      <Space direction="vertical" size={2}>
        <Text strong>{value || '-'}</Text>
        <Text type="secondary">订单日 {order.orderDate || '-'}</Text>
        <Text type="secondary">
          交易日 {order.transactionDateFrom === order.transactionDateTo
            ? order.transactionDateFrom || '-'
            : `${order.transactionDateFrom || '-'} 至 ${order.transactionDateTo || '-'}`}
        </Text>
      </Space>
    )
  },
  {
    title: '费用',
    key: 'fees',
    width: 580,
    render: (_, order) => <OrderLineBreakdown order={order} />
  }
]

export function OrderLineBreakdown({ order }: { order: OrderFinanceOrderRecord }) {
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {order.lines.map((line) => {
        const normalized = String(line.transactionType || '').toLowerCase()
        const isUpdate = normalized === 'order_update'
        return (
          <div key={line.detailKey} className="order-finance-order-line-breakdown">
            <div className="order-finance-order-line-type">
              <Tag color={isUpdate ? 'orange' : 'green'}>{isUpdate ? '更新' : '下单'}</Tag>
            </div>
            <FeeBreakdown line={line} />
            <Text type="secondary">时间 {line.transactionDate || line.orderDate || '-'}</Text>
          </div>
        )
      })}
      <div className="order-finance-order-line-total">
        <Text strong>汇总</Text>
        <Text strong>{formatMoney(order.totalAmount, order.currency)}</Text>
      </div>
    </Space>
  )
}

export function FeeBreakdown({ line }: { line: OrderFinanceLineRecord }) {
  const components = feeComponents(line)
  if (!components.length) {
    return <Text type="secondary">无费用项</Text>
  }
  return (
    <div className="order-finance-fee-list">
      {components.map((component) => (
        <span key={component.key} className="order-finance-fee-item">
          <Text type="secondary">{component.label}</Text>
          <Text strong>{formatMoney(component.value, line.currency)}</Text>
        </span>
      ))}
    </div>
  )
}

export function feeComponents(line: OrderFinanceLineRecord) {
  return [
    { key: 'netProceeds', label: 'Net Proceeds', value: amountValue(line.netProceeds) },
    { key: 'referralFee', label: '佣金', value: amountValue(line.referralFee) },
    { key: 'fulfillmentLogisticsFee', label: '履约物流费', value: amountValue(line.fulfillmentLogisticsFee) },
    { key: 'shippingCredits', label: 'Shipping Credits', value: amountValue(line.shippingCredits) },
    { key: 'otherOrderFee', label: '其他订单费', value: amountValue(line.otherOrderFee) },
    { key: 'orderSubsidies', label: '订单补贴', value: amountValue(line.orderSubsidies) },
    { key: 'nonOrderFees', label: '非订单费', value: amountValue(line.nonOrderFees) },
    { key: 'nonOrderSubsidies', label: '非订单补贴', value: amountValue(line.nonOrderSubsidies) },
    { key: 'others', label: 'Others', value: amountValue(line.others) }
  ].filter((component) => Math.abs(component.value) > 0.000001)
}

export function totalFeeAmount(line: OrderFinanceLineRecord) {
  return feeComponents(line).reduce((sum, component) => sum + component.value, 0)
}
