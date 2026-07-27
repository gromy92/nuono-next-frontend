import { Select, Space, Tag, Typography } from 'antd'
import type {
  LogisticsPartitionSummary,
  LogisticsSiteFilter,
  LogisticsTransportFilter
} from './logisticsPartitionDomain'

const { Text } = Typography

const SITE_OPTIONS = [
  { label: '全部站点', value: 'all' },
  { label: 'SA', value: 'SA' },
  { label: 'AE', value: 'AE' }
]

const TRANSPORT_OPTIONS = [
  { label: '全部运输方式', value: 'all' },
  { label: '空运', value: 'AIR' },
  { label: '海运', value: 'SEA' }
]

export function LogisticsPartitionFilters({
  siteFilter,
  transportFilter,
  onSiteFilterChange,
  onTransportFilterChange
}: {
  siteFilter: LogisticsSiteFilter
  transportFilter: LogisticsTransportFilter
  onSiteFilterChange: (value: LogisticsSiteFilter) => void
  onTransportFilterChange: (value: LogisticsTransportFilter) => void
}) {
  return (
    <Space size={8}>
      <Select value={siteFilter} options={SITE_OPTIONS} style={{ width: 120 }}
        onChange={onSiteFilterChange} aria-label="筛选站点" />
      <Select value={transportFilter} options={TRANSPORT_OPTIONS} style={{ width: 140 }}
        onChange={onTransportFilterChange} aria-label="筛选运输方式" />
    </Space>
  )
}

export function LogisticsPartitionTags({ summary }: { summary: LogisticsPartitionSummary }) {
  if (summary.incomplete) return <Text type="warning">分区缺失</Text>
  return (
    <Space size={[4, 4]} wrap>
      {summary.siteCodes.map((siteCode) => <Tag color="blue" key={siteCode}>{siteCode}</Tag>)}
      {summary.transportModes.map((mode) => (
        <Tag color={mode === 'AIR' ? 'cyan' : 'geekblue'} key={mode}>
          {mode === 'AIR' ? '空运' : '海运'}
        </Tag>
      ))}
      {summary.historicalMixed ? <Tag color="orange">历史混合</Tag> : null}
    </Space>
  )
}
