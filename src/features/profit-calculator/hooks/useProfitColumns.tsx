import { Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ProductListRowPayload } from '../../product-domain/productListTypes'
import { CommissionCell, OutboundFeeCell } from '../components/FeeComparisonCells'
import { ProductIdentityCell, ProfitPlaceholderCell } from '../components/ProductIdentityCell'
import { displayPrice, displayText } from '../profitPageDomain'
import type { ProfitCalculatorPageProps } from '../profitPageTypes'
import { profitRowKey } from '../profitWorkspaceModel'

const { Text } = Typography

export function useProfitColumns({
  props,
  openOutboundFeeDetail,
  openCommissionDetail
}: {
  props: ProfitCalculatorPageProps
  openOutboundFeeDetail: (record: ProductListRowPayload) => void
  openCommissionDetail: (record: ProductListRowPayload) => void
}): ColumnsType<ProductListRowPayload> {
  return [
    {
      title: '商品信息',
      key: 'identity',
      width: 520,
      render: (_, record) => <ProductIdentityCell record={record} />
    },
    {
      title: '类目/品牌',
      key: 'categoryBrand',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>{displayText(record.productFulltype)}</Text>
          <Text type="secondary">品牌：{displayText(record.brand)}</Text>
        </Space>
      )
    },
    {
      title: '价格',
      key: 'salePrice',
      width: 120,
      render: (_, record) => (
        <Text strong>{displayPrice(record)} {record.currency || ''}</Text>
      )
    },
    {
      title: '系统佣金',
      key: 'officialCommission',
      width: 170,
      render: (_, record) => (
        <CommissionCell
          value={props.commissionByRowKey[profitRowKey(record)]}
          actual={props.actualCommissionByRowKey[profitRowKey(record)]}
          actualLoading={props.actualCommissionLoading}
          onOpenDetail={() => openCommissionDetail(record)}
        />
      )
    },
    {
      title: '系统出舱费',
      key: 'officialOutboundFee',
      width: 170,
      render: (_, record) => (
        <OutboundFeeCell
          value={props.outboundFeeByRowKey[profitRowKey(record)]}
          noon={props.noonOutboundFeeByRowKey[profitRowKey(record)]}
          actual={props.actualOutboundFeeByRowKey[profitRowKey(record)]}
          actualLoading={props.actualOutboundFeeLoading}
          noonLoading={props.noonOutboundFeeLoading}
          onOpenDetail={() => openOutboundFeeDetail(record)}
        />
      )
    },
    { title: 'FBN空运利润', key: 'fbnAirProfit', width: 150, render: () => <ProfitPlaceholderCell /> },
    { title: 'FBP空运利润', key: 'fbpAirProfit', width: 150, render: () => <ProfitPlaceholderCell /> },
    { title: '海运利润', key: 'oceanProfit', width: 150, render: () => <ProfitPlaceholderCell /> },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => <Tag>{record.liveStatus || record.statusCode || '-'}</Tag>
    }
  ]
}
