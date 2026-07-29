import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Input, Select, Space, Tooltip } from 'antd'
import type { CompetitorWatchProduct } from '../types'
import { CompetitorProductTable } from './CompetitorProductTable'
import {
  PRODUCT_SORT_OPTIONS,
  ZERO_COUNT_FILTER_OPTIONS,
  parseProductFilterValues,
  productFilterValues,
  type ProductFilterValue,
  type ProductSortValue
} from './productListFilters'

export function CompetitorProductListTab({
  products,
  loading,
  page,
  pageSize,
  total,
  productSearch,
  keywordSearch,
  competitorSearch,
  monitorZeroOnly,
  candidateZeroOnly,
  sortBy,
  storeReady,
  actionLoading,
  openActionTooltip,
  reportOpen,
  onSearchChange,
  onFilterChange,
  onReset,
  onManualMonitoring,
  onPageChange,
  onKeywordEdit,
  onRefresh,
  onManualAdd,
  onDetail,
  onReport,
  onReportTooltipChange
}: {
  products: CompetitorWatchProduct[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  productSearch: string
  keywordSearch: string
  competitorSearch: string
  monitorZeroOnly: boolean
  candidateZeroOnly: boolean
  sortBy: ProductSortValue
  storeReady: boolean
  actionLoading: string | null
  openActionTooltip: string | null
  reportOpen: boolean
  onSearchChange: (
    field: 'productSearch' | 'keywordSearch' | 'competitorSearch',
    value: string
  ) => void
  onFilterChange: (filters: {
    monitorZeroOnly: boolean
    candidateZeroOnly: boolean
    sortBy: ProductSortValue
  }) => void
  onReset: () => void
  onManualMonitoring: () => void
  onPageChange: (page: number, pageSize: number) => void
  onKeywordEdit: (product: CompetitorWatchProduct) => void
  onRefresh: (product: CompetitorWatchProduct) => void
  onManualAdd: (product: CompetitorWatchProduct) => void
  onDetail: (product: CompetitorWatchProduct) => void
  onReport: (product: CompetitorWatchProduct) => void
  onReportTooltipChange: (value: string | null) => void
}) {
  const filters = productFilterValues(
    monitorZeroOnly,
    candidateZeroOnly,
    sortBy
  )
  return (
    <>
      <Card
        size="small"
        className="competitor-analysis-search-card"
        variant="borderless"
      >
        <div className="competitor-analysis-search-grid">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索我方SKU、商品标题、Noon码"
            value={productSearch}
            onChange={(event) =>
              onSearchChange('productSearch', event.target.value)
            }
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索关键词"
            value={keywordSearch}
            onChange={(event) =>
              onSearchChange('keywordSearch', event.target.value)
            }
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索竞品Z/N码、品牌、标题"
            value={competitorSearch}
            onChange={(event) =>
              onSearchChange('competitorSearch', event.target.value)
            }
          />
          <Select
            allowClear
            className="competitor-analysis-zero-filter-select"
            data-testid="competitor-analysis-filter-select"
            maxTagCount={2}
            mode="multiple"
            options={[...ZERO_COUNT_FILTER_OPTIONS, ...PRODUCT_SORT_OPTIONS]}
            placeholder="筛选"
            value={filters}
            onChange={(values) =>
              onFilterChange(
                parseProductFilterValues(values as ProductFilterValue[])
              )
            }
          />
          <Space wrap>
            <Tooltip title="按当前店铺/站点提交已有确认竞品的监控商品">
              <Button
                icon={<ReloadOutlined />}
                loading={actionLoading === 'store-monitoring'}
                disabled={!storeReady}
                onClick={onManualMonitoring}
              >
                手动监控
              </Button>
            </Tooltip>
            <Button onClick={onReset}>重置</Button>
          </Space>
        </div>
      </Card>

      <Card
        size="small"
        className="competitor-analysis-list-card"
        variant="borderless"
      >
        <CompetitorProductTable
          products={products}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          actionLoading={actionLoading}
          openActionTooltip={openActionTooltip}
          reportOpen={reportOpen}
          onPageChange={onPageChange}
          onKeywordEdit={onKeywordEdit}
          onRefresh={onRefresh}
          onManualAdd={onManualAdd}
          onDetail={onDetail}
          onReport={onReport}
          onReportTooltipChange={onReportTooltipChange}
        />
      </Card>
    </>
  )
}
