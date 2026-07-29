import { Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  formatMoney,
  profitScenarioColor,
  type ProfitCalculationPayload
} from '../../profit-calculator/domain'

const { Text } = Typography

export function scenarioColumns(): ColumnsType<ProfitCalculationPayload['scenarios'][number]> {
  return [
    {
      title: '方案',
      dataIndex: 'label',
      width: 130,
      render: (value: string) => <Text strong>{value}</Text>
    },
    {
      title: '预估利润',
      dataIndex: 'profitRmb',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Text strong style={{ color: profitScenarioColor(value) }}>
          ¥{formatMoney(value)}
        </Text>
      )
    },
    {
      title: '利润率',
      dataIndex: 'marginRatePct',
      width: 90,
      align: 'right',
      render: (value: number) => `${formatMoney(value)}%`
    },
    {
      title: '销售收入',
      dataIndex: 'grossRevenueRmb',
      width: 110,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '平台扣费',
      dataIndex: 'platformDeductionRmb',
      width: 110,
      align: 'right',
      render: (value: number, row) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
          <Text>¥{formatMoney(value)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatMoney(row.commissionAmountMarket)} + {formatMoney(row.platformFeeAmountMarket)} + 税
          </Text>
        </Space>
      )
    },
    {
      title: '采购',
      dataIndex: 'purchasePriceRmb',
      width: 90,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '国内物流',
      dataIndex: 'domesticShippingFeeRmb',
      width: 100,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '头程',
      dataIndex: 'firstLegFeeRmb',
      width: 90,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    },
    {
      title: '总成本',
      dataIndex: 'totalCostRmb',
      width: 100,
      align: 'right',
      render: (value: number) => `¥${formatMoney(value)}`
    }
  ]
}
