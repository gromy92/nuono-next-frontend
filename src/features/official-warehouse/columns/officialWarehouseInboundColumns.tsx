import { Image, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OfficialWarehouseAsnInboundLine } from '../api'
import { PRODUCT_IMAGE_FALLBACK } from '../officialWarehouseCandidatePresentation'
import {
  inboundLineStatusTag,
  inboundReceiptQuantity
} from '../officialWarehouseAsnPresentation'

const { Text } = Typography

export function buildOfficialWarehouseInboundColumns(): ColumnsType<OfficialWarehouseAsnInboundLine> {
  return [
    {
      title: '商品',
      width: 280,
      render: (_, row) => (
        <div className="official-warehouse-product-cell">
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              fallback={PRODUCT_IMAGE_FALLBACK}
              width={42}
              height={42}
              preview={false}
            />
          ) : (
            <div className="official-warehouse-image-placeholder" />
          )}
          <div className="official-warehouse-stack">
            <Text strong>{row.title || row.partnerSku || row.noonSku || '未识别商品'}</Text>
            <Text type="secondary">PSKU：{row.partnerSku || '-'}</Text>
            {row.reportOnly ? <Tag color="gold">来自 FBN 入仓报表</Tag> : null}
          </div>
        </div>
      )
    },
    { title: 'Noon SKU', dataIndex: 'noonSku', width: 180 },
    {
      title: 'ASN数量',
      dataIndex: 'asnQuantity',
      width: 88,
      render: (value: number, row) => row.reportOnly && !value ? '-' : Number(value || 0).toLocaleString()
    },
    {
      title: '预计入仓',
      dataIndex: 'expectedQuantity',
      width: 92,
      render: inboundReceiptQuantity
    },
    {
      title: '已入仓',
      dataIndex: 'receivedQuantity',
      width: 88,
      render: inboundReceiptQuantity
    },
    {
      title: '差异',
      width: 100,
      render: (_, row) => {
        if (row.receiptLineCount <= 0) return '-'
        if (row.shortQuantity > 0) return <Text type="danger">少收 {Number(row.shortQuantity).toLocaleString()}</Text>
        if (row.overQuantity > 0) return <Text className="official-warehouse-over-received">超收 {Number(row.overQuantity).toLocaleString()}</Text>
        return '-'
      }
    },
    {
      title: '异常',
      width: 150,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Space size={4} wrap>
            {row.qcFailedQuantity > 0 ? <Tag color="volcano">QC {Number(row.qcFailedQuantity).toLocaleString()}</Tag> : null}
            {row.unidentifiedQuantity > 0 ? <Tag color="purple">未识别 {Number(row.unidentifiedQuantity).toLocaleString()}</Tag> : null}
            {!row.qcFailedQuantity && !row.unidentifiedQuantity ? <Text type="secondary">-</Text> : null}
          </Space>
          {row.qcFailedReason ? <Text type="danger">{row.qcFailedReason}</Text> : null}
        </div>
      )
    },
    {
      title: '入仓状态',
      dataIndex: 'inboundStatus',
      width: 112,
      render: inboundLineStatusTag
    }
  ]
}
