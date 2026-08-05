import { Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OfficialWarehouseAsnLine } from '../api'
import {
  asnLineBatchNumbers,
  asnLineBatchReferenceText,
  asnLineSourceTags
} from '../asnLineSourcePresentation'

const { Text } = Typography

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
        {asnLineSourceTags(line).map((tag) => (
          <Tag key={`${tag.kind}:${tag.text}`} color={tag.kind === 'shipping' ? 'blue' : tag.kind === 'manual' ? 'gold' : undefined}>
            {tag.text}
          </Tag>
        ))}
      </Space>
    )
  },
  {
    title: '物流单号',
    render: (_, line) => (
      <Text type={asnLineBatchNumbers(line) ? undefined : 'secondary'}>
        {asnLineBatchReferenceText(line)}
      </Text>
    )
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
