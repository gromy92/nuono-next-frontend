import { ReloadOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Input, Select, Space } from 'antd'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

const currencyOptions = [
  { label: 'SAR', value: 'SAR' },
  { label: 'AED', value: 'AED' }
]

type OrderFinanceToolbarProps = {
  dateRange: [Dayjs, Dayjs]
  currency?: string
  search: string
  partnerSkuText: string
  loading: boolean
  syncLoading: boolean
  onDateRangeChange: (value: [Dayjs, Dayjs]) => void
  onCurrencyChange: (value?: string) => void
  onSearchChange: (value: string) => void
  onPartnerSkuTextChange: (value: string) => void
  onRefresh: () => void
  onSync: () => void
}

export function OrderFinanceToolbar({
  dateRange,
  currency,
  search,
  partnerSkuText,
  loading,
  syncLoading,
  onDateRangeChange,
  onCurrencyChange,
  onSearchChange,
  onPartnerSkuTextChange,
  onRefresh,
  onSync
}: OrderFinanceToolbarProps) {
  return (
    <Card variant="borderless" style={{ boxShadow: 'none' }}>
      <div className="order-finance-toolbar">
        <Space align="start" size={10} wrap>
          <RangePicker
            allowClear={false}
            value={dateRange}
            onChange={(value) => {
              const [start, end] = value || []
              if (start && end) onDateRangeChange([start, end])
            }}
          />
          <Select
            allowClear
            placeholder="全部币种"
            style={{ width: 120 }}
            value={currency}
            options={currencyOptions}
            onChange={onCurrencyChange}
          />
          <Input.Search
            allowClear
            placeholder="标题 / SKU 搜索"
            style={{ width: 220 }}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onSearch={onSearchChange}
          />
          <Input.TextArea
            allowClear
            placeholder="Partner SKU，可换行或逗号分隔"
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ width: 260 }}
            value={partnerSkuText}
            onChange={(event) => onPartnerSkuTextChange(event.target.value)}
          />
        </Space>
        <Space size={10} wrap>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<SyncOutlined />} onClick={onSync} loading={syncLoading}>
            补齐 Noon 订单财务
          </Button>
        </Space>
      </div>
    </Card>
  )
}
