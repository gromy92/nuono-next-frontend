import { Button, Empty, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ProductStockSourcePreview } from './ProductStockSourcePreview'
import {
  OfficialWarehouseCurrentStockDetail,
  OfficialWarehouseProductThumb
} from './OfficialWarehouseStockCells'
import {
  appointmentStatusLabel,
  asnStatusLabel,
  officialWarehouseStockRowKey
} from './officialWarehouseStatisticsModel'
import { inboundStageLabel, receiptStatusLabel } from './statisticsDomain'
import type {
  OfficialWarehouseInboundStatisticsRow,
  OfficialWarehouseInboundStatisticsView,
  OfficialWarehouseProductInboundReceiptRow,
  OfficialWarehouseStockStatisticsRow,
  OfficialWarehouseStockStatisticsView
} from './statisticsTypes'

const { Text } = Typography

export function OfficialWarehouseProductStatisticsTable({
  stats,
  loading,
  storeCode,
  siteCode,
  onOpenHistory
}: {
  stats: OfficialWarehouseStockStatisticsView
  loading: boolean
  storeCode?: string
  siteCode?: string
  onOpenHistory: (row: OfficialWarehouseStockStatisticsRow) => void
}) {
  const columns: ColumnsType<OfficialWarehouseStockStatisticsRow> = [
    {
      title: '商品详情',
      width: 300,
      render: (_, row) => <OfficialWarehouseProductCell row={row} />
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      width: 210,
      render: (_, row) => <OfficialWarehouseCurrentStockDetail row={row} />
    },
    {
      title: '库存来源',
      render: (_, row) => (
        <ProductStockSourcePreview
          row={row}
          storeCode={storeCode}
          siteCode={siteCode}
          onOpenDetail={() => onOpenHistory(row)}
        />
      )
    },
    {
      title: '查看',
      width: 70,
      render: (_, row) => (
        <Button type="link" onClick={() => onOpenHistory(row)}>
          详情
        </Button>
      )
    }
  ]
  return (
    <Table
      className="official-warehouse-product-stock-table"
      rowKey={(row) => officialWarehouseStockRowKey(row, { storeCode, siteCode })}
      size="small"
      loading={loading}
      tableLayout="fixed"
      columns={columns}
      dataSource={stats.rows}
      pagination={{
        pageSize: 8,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total.toLocaleString()} 个商品`
      }}
      locale={{ emptyText: <Empty description="暂无官方仓库存摘要" /> }}
    />
  )
}

function OfficialWarehouseProductCell({ row }: { row: OfficialWarehouseStockStatisticsRow }) {
  const psku = row.partnerSku || '-'
  const titleCn = row.titleCn?.trim() || (!row.titleEn?.trim() ? row.title?.trim() : '')
  const titleEn = row.titleEn || row.title || '-'
  return (
    <div className="official-warehouse-product-detail">
      <OfficialWarehouseProductThumb row={row} />
      <div className="official-warehouse-product-detail-copy">
        {titleCn ? <Text className="official-warehouse-product-title-cn" strong>{titleCn}</Text> : null}
        <Tooltip title={titleEn} placement="topLeft">
          <Text className="official-warehouse-product-title-en" type="secondary">{titleEn}</Text>
        </Tooltip>
        <Tooltip title={`PSKU: ${psku}`} placement="topLeft">
          <Text className="official-warehouse-product-psku" type="secondary">{psku}</Text>
        </Tooltip>
      </div>
    </div>
  )
}

export function OfficialWarehouseInboundStatisticsTable({
  stats,
  loading
}: {
  stats: OfficialWarehouseInboundStatisticsView
  loading: boolean
}) {
  const columns: ColumnsType<OfficialWarehouseInboundStatisticsRow> = [
    {
      title: 'ASN',
      fixed: 'left',
      width: 210,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text strong>{row.noonAsnNr || row.localAsnNo || '-'}</Text>
          {row.localAsnNo && row.localAsnNo !== row.noonAsnNr ? <Text type="secondary">{row.localAsnNo}</Text> : null}
        </div>
      )
    },
    {
      title: '入仓状态',
      dataIndex: 'inboundStage',
      width: 110,
      render: (value: string) => (
        <Text type={value === 'FAILED' ? 'danger' : undefined}>{inboundStageLabel(value)}</Text>
      )
    },
    { title: '件数', dataIndex: 'totalQuantity', width: 90 },
    {
      title: '预约状态',
      dataIndex: 'appointmentStatus',
      width: 120,
      render: (value: string) => (
        <Text type={value === 'FAILED' ? 'danger' : undefined}>{appointmentStatusLabel(value)}</Text>
      )
    },
    { title: 'Noon状态', dataIndex: 'noonAsnStatus', width: 130, render: asnStatusLabel },
    {
      title: 'Noon仓',
      width: 140,
      render: (_, row) => row.selectedWarehousePartnerCode || row.selectedWarehouseCode || '-'
    }
  ]
  return (
    <Table
      rowKey={(row) => `${row.asnId || row.noonAsnNr || row.localAsnNo}`}
      size="small"
      loading={loading}
      columns={columns}
      dataSource={stats.rows}
      pagination={{
        pageSize: 8,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total.toLocaleString()} 个入仓单`
      }}
      scroll={{ x: 820 }}
      locale={{ emptyText: <Empty description="暂无入仓单记录" /> }}
    />
  )
}

export const productHistoryColumns: ColumnsType<OfficialWarehouseProductInboundReceiptRow> = [
  { title: 'ASN', dataIndex: 'noonAsnNr', width: 120 },
  { title: '预约日', dataIndex: 'asnScheduleDate', width: 110 },
  { title: '完成时间', dataIndex: 'asnCompletedAt', width: 160 },
  { title: '预期', dataIndex: 'qtyExpected', width: 80 },
  { title: '实收', dataIndex: 'receivedQty', width: 80 },
  { title: 'QC失败', dataIndex: 'qcFailedQty', width: 90 },
  {
    title: '状态',
    dataIndex: 'receiptStatus',
    width: 110,
    render: (value: string) => (
      <Tag color={value === 'NORMAL' ? 'green' : 'orange'}>{receiptStatusLabel(value)}</Tag>
    )
  },
  { title: 'Noon仓', dataIndex: 'noonWarehouse', width: 100 },
  { title: '导入时间', dataIndex: 'importedAt', width: 160 }
]
