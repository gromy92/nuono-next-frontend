import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { OrderFinanceSkuSummaryRow } from './types'
import {
  formatAmountWithoutCurrency,
  OrderSummaryCell,
  ProductSummaryCell
} from './OrderFinancePresentation'
import { formatRate } from './orderFinanceModel'

export function useOrderFinanceColumns(
  openOrderDetail: (row: OrderFinanceSkuSummaryRow) => void
) {
  return useMemo<ColumnsType<OrderFinanceSkuSummaryRow>>(() => [
    {
      title: '商品',
      dataIndex: 'partnerSku',
      key: 'product',
      width: 360,
      fixed: 'left',
      render: (_, row) => <ProductSummaryCell row={row} />
    },
    {
      title: '订单汇总',
      key: 'orderSummary',
      width: 190,
      render: (_, row) => (
        <OrderSummaryCell row={row} onOpen={() => openOrderDetail(row)} />
      )
    },
    {
      title: 'Net Proceeds',
      dataIndex: 'netProceeds',
      key: 'netProceeds',
      align: 'right',
      width: 150,
      render: (value: number) => formatAmountWithoutCurrency(value)
    },
    {
      title: '佣金',
      dataIndex: 'referralFee',
      key: 'referralFee',
      align: 'right',
      width: 130,
      render: (value: number) => formatAmountWithoutCurrency(value)
    },
    {
      title: '履约费',
      dataIndex: 'fulfillmentLogisticsFee',
      key: 'fulfillmentLogisticsFee',
      align: 'right',
      width: 140,
      render: (value: number) => formatAmountWithoutCurrency(value)
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      width: 140,
      render: (value: number) => formatAmountWithoutCurrency(value)
    },
    {
      title: '平均单件履约费',
      dataIndex: 'avgFulfillmentFeePerItem',
      key: 'avgFulfillmentFeePerItem',
      align: 'right',
      width: 160,
      render: (value: number | null) => (
        value === null || value === undefined ? '-' : formatAmountWithoutCurrency(value)
      )
    },
    {
      title: '费用率',
      dataIndex: 'feeRate',
      key: 'feeRate',
      align: 'right',
      width: 110,
      render: (value: number | null) => formatRate(value)
    }
  ], [openOrderDetail])
}
