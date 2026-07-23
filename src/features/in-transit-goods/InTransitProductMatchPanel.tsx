import { Alert, Button, Space, Table, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { InTransitProductMatchCandidate } from './types'
import { stripedRowClassName } from './InTransitGoodsPage.utils'

const { Text } = Typography

const columns: ColumnsType<InTransitProductMatchCandidate> = [
  { title: '箱号', dataIndex: 'boxNo', key: 'boxNo', width: 150 },
  {
    title: '来源商品',
    key: 'source',
    width: 260,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Text strong>{row.sourceBarcode}</Text>
        <Text type="secondary">来源 PSKU：{row.sourcePsku || '-'}</Text>
        <Text type="secondary">{row.productName || row.sourceMsku || '-'}</Text>
      </Space>
    )
  },
  { title: '发货数量', dataIndex: 'shippedQuantity', key: 'shippedQuantity', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 260,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Tag color="gold">待匹配</Tag>
        <Text type="secondary">{row.matchMessage || '请先补齐商品 Barcode'}</Text>
      </Space>
    )
  }
]

type Props = {
  items: InTransitProductMatchCandidate[]
  loading: boolean
  rematching: boolean
  onRematch: () => void
}

export function InTransitProductMatchPanel({ items, loading, rematching, onRematch }: Props) {
  if (!loading && items.length === 0) return null
  return (
    <div className="in-transit-detail">
      <Alert
        type="warning"
        showIcon
        message={`${items.length} 条物流商品待匹配`}
        description="原始批次、箱号和商品行已保存；创建 ASN 前需先完成商品匹配。"
        action={
          <Button icon={<ReloadOutlined />} loading={rematching} onClick={onRematch}>
            重新匹配
          </Button>
        }
      />
      <Table
        rowKey="id"
        rowClassName={stripedRowClassName}
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
      />
    </div>
  )
}
