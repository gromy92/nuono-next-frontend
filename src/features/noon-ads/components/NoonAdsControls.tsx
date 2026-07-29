import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Space, Tag, Typography } from 'antd'
import type { NoonAdvertisingDataStatus } from '../types'
import type { DateRangeValue } from '../model/pageModel'
import { formatNumber } from '../presentation/formatters'

const { RangePicker } = DatePicker
const { Text } = Typography

export function NoonAdsTableActions({
  count,
  onExport
}: {
  count: number
  onExport: () => void
}) {
  return (
    <div className="noon-ads-table-actions">
      <Text type="secondary">{formatNumber(count)} 行</Text>
      <Button size="small" icon={<DownloadOutlined />} onClick={onExport}>
        导出
      </Button>
    </div>
  )
}

export function NoonAdvertisingTabControls({
  dateRange,
  dataStatus,
  disabled,
  loading,
  trendDataStatus,
  onDateRangeChange,
  onRefresh
}: {
  dateRange: DateRangeValue
  dataStatus: NoonAdvertisingDataStatus
  disabled: boolean
  loading: boolean
  trendDataStatus: NoonAdvertisingDataStatus
  onDateRangeChange: (value: DateRangeValue) => void
  onRefresh: () => void
}) {
  return (
    <div className="noon-ads-tab-controls">
      <Space wrap>
        <RangePicker
          value={dateRange}
          allowClear={false}
          onChange={(value) => {
            if (value?.[0] && value?.[1]) {
              onDateRangeChange([value[0], value[1]])
            }
          }}
        />
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          disabled={disabled}
          onClick={onRefresh}
        >
          刷新
        </Button>
      </Space>
      <Space wrap>
        <Tag color={dataStatus.dataAvailable ? 'green' : 'default'}>{dataStatus.dataAvailable ? '已导入' : '无数据'}</Tag>
        <Text type="secondary">Batch {formatNumber(dataStatus.batchCount)}</Text>
        <Text type="secondary">广告计划行 {formatNumber(dataStatus.campaignRowCount)}</Text>
        <Text type="secondary">关键词/搜索词行 {formatNumber(dataStatus.queryRowCount)}</Text>
        {dataStatus.earliestReportDate && dataStatus.latestReportDate ? (
          <Text type="secondary">{dataStatus.earliestReportDate} 至 {dataStatus.latestReportDate}</Text>
        ) : null}
        <Text type="secondary">
          近7天趋势 {trendDataStatus.dataAvailable && trendDataStatus.earliestReportDate && trendDataStatus.latestReportDate
            ? `${trendDataStatus.earliestReportDate} 至 ${trendDataStatus.latestReportDate}`
            : '样本不足'}
        </Text>
      </Space>
    </div>
  )
}
