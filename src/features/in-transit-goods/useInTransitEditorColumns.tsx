import { useMemo } from 'react'
import { Button, Space, Typography } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type {
  InTransitActualFreightBill,
  InTransitActualFreightComponent,
  InTransitGoodsLine
} from './types'
import { formatCny, formatNodeDateTime, formatQuantity } from './InTransitGoodsPage.utils'

const { Text } = Typography

type EditorColumnsProps = {
  submittingLine: boolean
  onOpenEditLine: (row: InTransitGoodsLine) => void
  onRemoveLine: (row: InTransitGoodsLine) => void
}

export function useInTransitEditorColumns({
  submittingLine,
  onOpenEditLine,
  onRemoveLine
}: EditorColumnsProps) {
  const lineColumns = useMemo<ColumnsType<InTransitGoodsLine>>(() => [
    { title: '箱号', dataIndex: 'boxNo', key: 'boxNo', width: 150, render: (value) => value || '-' },
    {
      title: '商品',
      key: 'goods',
      width: 220,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.psku}</Text>
          <Text type="secondary">{row.productName || '-'}</Text>
        </Space>
      )
    },
    { title: '店铺', key: 'store', width: 140, render: (_value, row) => [row.storeCode, row.siteCode].filter(Boolean).join(' / ') || '-' },
    {
      title: '数量',
      key: 'quantity',
      width: 170,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>发货 {row.shippedQuantity ?? '-'}</Text>
          <Text>入仓 {row.receivedQuantity ?? '-'}</Text>
          <Text>剩余 {row.remainingQuantity ?? '-'}</Text>
        </Space>
      )
    },
    {
      title: '箱规',
      key: 'carton',
      width: 180,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>箱数 {row.cartonCount ?? '-'}</Text>
          <Text>单箱 {row.unitsPerCarton ?? '-'}</Text>
          <Text>重量 {row.cartonWeightKg ?? '-'}</Text>
          <Text>体积 {row.cartonVolumeCbm ?? '-'}</Text>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_value, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onOpenEditLine(row)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} loading={submittingLine} onClick={() => onRemoveLine(row)}>删除</Button>
        </Space>
      )
    }
  ], [onOpenEditLine, onRemoveLine, submittingLine])

  const freightBillColumns = useMemo<ColumnsType<InTransitActualFreightBill>>(() => [
    {
      title: '账单',
      key: 'bill',
      width: 190,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.billNo || `#${row.id}`}</Text>
          <Text type="secondary">{row.sourceSystem || '-'}</Text>
        </Space>
      )
    },
    { title: '货代', key: 'forwarder', width: 140, render: (_value, row) => row.forwarderName || row.forwarderCode || '-' },
    { title: '路线', key: 'route', width: 140, render: (_value, row) => [row.transportMode, row.destinationCode, row.targetSiteCode].filter(Boolean).join(' / ') || '-' },
    {
      title: '金额',
      key: 'amount',
      width: 210,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>合计 {formatCny(row.cnyTotalAmount)}</Text>
          <Text type="secondary">运费 {formatCny(row.freightAmountCny)}</Text>
          <Text type="secondary">清关 {formatCny(row.customsAmountCny)}</Text>
        </Space>
      )
    },
    { title: '发生时间', key: 'businessOccurredAt', width: 160, render: (_value, row) => formatNodeDateTime(row.businessOccurredAt) }
  ], [])

  const freightComponentColumns = useMemo<ColumnsType<InTransitActualFreightComponent>>(() => [
    {
      title: '箱号 / PSKU',
      key: 'box',
      width: 220,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.boxNo || row.externalBoxNo || '-'}</Text>
          <Text type="secondary">{row.psku || '-'}</Text>
        </Space>
      )
    },
    {
      title: '费用项',
      key: 'fee',
      width: 180,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>{row.rawFeeName || row.standardFeeType || '-'}</Text>
          <Text type="secondary">{row.standardFeeType || '-'}</Text>
        </Space>
      )
    },
    {
      title: '计费',
      key: 'charge',
      width: 160,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>{formatQuantity(row.chargeQuantity)} {row.chargeUnit || ''}</Text>
          <Text type="secondary">计费重 {formatQuantity(row.chargeableWeightKg)}</Text>
        </Space>
      )
    },
    { title: '金额', key: 'amount', width: 120, render: (_value, row) => formatCny(row.cnyAmount) }
  ], [])

  return { lineColumns, freightBillColumns, freightComponentColumns }
}
