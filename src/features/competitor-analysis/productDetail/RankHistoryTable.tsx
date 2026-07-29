import { ClockCircleOutlined } from '@ant-design/icons'
import { Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatNotInRankRangeText } from '../competitorRankFormatting'
import type { CompetitorWatchProduct } from '../types'
import type { RankHistoryRow } from './rankHistoryModel'

const { Text } = Typography

export function RankHistoryTable({
  product,
  rows,
  loading
}: {
  product: CompetitorWatchProduct
  rows: RankHistoryRow[]
  loading: boolean
}) {
  return (
    <Table
      rowKey="id"
      dataSource={rows}
      columns={rankColumns(product)}
      pagination={false}
      loading={loading}
      size="small"
      scroll={{ x: 920 }}
    />
  )
}

function rankColumns(product: CompetitorWatchProduct): ColumnsType<RankHistoryRow> {
  return [
    { title: '日期', dataIndex: 'factDate', key: 'factDate', width: 110 },
    { title: '关键词', dataIndex: 'keyword', key: 'keyword', width: 160 },
    {
      title: '商品',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      render: (value, point) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 240 }}>
          <Text ellipsis={{ tooltip: value }}>{value}</Text>
          <Text type="secondary">{point.noonProductCode}</Text>
        </Space>
      )
    },
    {
      title: '类型',
      key: 'type',
      width: 120,
      render: (_value, point) => (
        <Space size={4} wrap>
          {point.isSelf ? <Tag color="blue">本品</Tag> : <Tag>竞品</Tag>}
          {point.isSponsored ? <Tag color="purple">广告</Tag> : null}
        </Space>
      )
    },
    {
      title: '排名',
      key: 'rank',
      width: 112,
      render: (_value, point) =>
        point.rankStatus === 'ranked' ? (
          <Text strong>第 {point.rankNo} 名</Text>
        ) : (
          <Tag icon={<ClockCircleOutlined />}>
            {formatNotInRankRangeText(point.scanDepth)}
          </Tag>
        )
    },
    {
      title: '价格',
      key: 'price',
      width: 110,
      render: (_value, point) =>
        point.priceAmount
          ? `${point.priceAmount} ${point.currencyCode || ''}`
          : product.siteCode === 'SA'
            ? 'SAR'
            : 'AED'
    }
  ]
}
