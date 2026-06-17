import { useMemo } from 'react'
import { Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  InTransitForwarderFreightComparisonRow,
  InTransitSkuFreightCostHistoryRow
} from './types'
import { formatCny, formatNodeDateTime, formatQuantity } from './InTransitGoodsPage.utils'

const { Text } = Typography

export function useInTransitSkuFreightColumns() {
  const skuFreightHistoryColumns = useMemo<ColumnsType<InTransitSkuFreightCostHistoryRow>>(() => [
    { title: '发生时间', key: 'businessOccurredAt', width: 160, render: (_value, row) => formatNodeDateTime(row.businessOccurredAt) },
    { title: '货代', key: 'forwarder', width: 140, render: (_value, row) => row.forwarderName || `#${row.standardForwarderId ?? '-'}` },
    { title: '费用项', key: 'fee', width: 120, render: (_value, row) => row.standardFeeType || '-' },
    { title: '数量', key: 'quantity', width: 160, render: (_value, row) => `${formatQuantity(row.chargeQuantity)} ${row.chargeUnit || ''}` },
    {
      title: '金额',
      key: 'amount',
      width: 170,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>{formatCny(row.totalAmountCny)}</Text>
          <Text type="secondary">单件 {formatCny(row.unitAmountCny)}</Text>
        </Space>
      )
    }
  ], [])

  const forwarderComparisonColumns = useMemo<ColumnsType<InTransitForwarderFreightComparisonRow>>(() => [
    { title: '货代', key: 'forwarder', width: 150, render: (_value, row) => row.forwarderName || row.forwarderCode || `#${row.standardForwarderId ?? '-'}` },
    { title: '路线', key: 'route', width: 150, render: (_value, row) => [row.transportMode, row.destinationCode, row.targetSiteCode].filter(Boolean).join(' / ') || '-' },
    { title: '费用项', key: 'fee', width: 120, render: (_value, row) => row.standardFeeType || '-' },
    { title: '样本', key: 'shipmentCount', width: 90, render: (_value, row) => row.shipmentCount ?? '-' },
    { title: '单价', key: 'amountPerUnit', width: 130, render: (_value, row) => formatCny(row.amountPerUnit) }
  ], [])

  return { skuFreightHistoryColumns, forwarderComparisonColumns }
}
