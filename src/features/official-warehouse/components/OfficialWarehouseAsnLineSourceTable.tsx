import { Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OfficialWarehouseAsnLine } from '../api'

const { Text } = Typography

function batchNumbers(line: OfficialWarehouseAsnLine) {
  return Array.from(new Set((line.shippingBatchLinks || []).map((link) =>
    link.batchReferenceNo || link.trackingNo || link.externalShipmentNo || link.shippingBatchNo
  ).filter(Boolean))).join('、')
}

const columns: ColumnsType<OfficialWarehouseAsnLine> = [
  {
    title: 'SKU',
    width: 260,
    render: (_, line) => (
      <div className="official-warehouse-stack">
        <Text strong copyable>{line.partnerSku || line.pskuCode || line.noonSku}</Text>
        <Text type="secondary">Noon SKU：{line.noonSku || '-'}</Text>
      </div>
    )
  },
  { title: '总数量', dataIndex: 'quantity', width: 90 },
  {
    title: '商品来源',
    width: 250,
    render: (_, line) => (
      <Space size={4} wrap>
        {Number(line.shippingBatchQuantity || 0) > 0 ? (
          <Tag color="blue">物流单 {Number(line.shippingBatchQuantity).toLocaleString()} 件</Tag>
        ) : null}
        {Number(line.manualQuantity || 0) > 0 ? (
          <Tag color="gold">手工添加 {Number(line.manualQuantity).toLocaleString()} 件</Tag>
        ) : null}
      </Space>
    )
  },
  {
    title: '物流单号',
    render: (_, line) => batchNumbers(line) || <Text type="secondary">不关联物流单</Text>
  }
]

export function OfficialWarehouseAsnLineSourceTable({ lines }: { lines: OfficialWarehouseAsnLine[] }) {
  return (
    <div className="official-warehouse-link-summary">
      <Text strong>商品来源明细</Text>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={lines}
        pagination={false}
        scroll={{ x: 760 }}
      />
    </div>
  )
}
