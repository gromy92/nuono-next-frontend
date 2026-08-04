import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Typography
} from 'antd'
import type { SalesProductRow } from '../types'
import type { useSalesAnalyticsDataset } from '../hooks/useSalesAnalyticsDataset'
import type { useSalesProductDetail } from '../hooks/useSalesProductDetail'
import {
  classificationSelectOptions,
  latestDateFromProducts
} from '../presentation/formatters'
import { productColumns } from '../presentation/productColumns'
import { SalesFactSummary, missingFieldFilterOptions } from '../presentation/statusPresentation'
import { ComparisonDialog } from './ComparisonDialog'
import { ProductDetailDialog } from './ProductDetailDialog'

const { RangePicker } = DatePicker
const { Text, Title } = Typography

export function SalesAnalyticsWorkbench({
  dataset,
  detail,
  refreshActivities
}: {
  dataset: ReturnType<typeof useSalesAnalyticsDataset>
  detail: ReturnType<typeof useSalesProductDetail>
  refreshActivities: () => Promise<void>
}) {
  const latestSalesDate = latestDateFromProducts(dataset.products)

  return (
    <div data-testid="sales-analytics-workbench" style={{ display: 'grid', gap: 12 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Title level={4} style={{ margin: 0 }}>销量分析</Title>
          <Space wrap>
            <Button onClick={dataset.clearFilters}>清空筛选</Button>
            <Button
              type="primary"
              onClick={() => dataset.setCompareOpen(true)}
              disabled={dataset.selectedProducts.length < 2 || dataset.selectedProducts.length > 5}
            >
              对比分析
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => void dataset.requestExport()}>
              批量导出
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                void dataset.loadData()
                void refreshActivities()
              }}
              loading={dataset.loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          <Input.TextArea
            allowClear
            autoSize={{ minRows: 1, maxRows: 3 }}
            placeholder="PSKU / SKU，逗号或换行"
            value={dataset.partnerSkuText}
            onChange={(event) => dataset.setPartnerSkuText(event.target.value)}
            onPressEnter={(event) => {
              if (!event.shiftKey) void dataset.loadData()
            }}
          />
          <Input allowClear placeholder="中英文标题关键词" value={dataset.search} onChange={(event) => dataset.setSearch(event.target.value)} onPressEnter={() => void dataset.loadData()} />
          <Input allowClear placeholder="类目链接 / 关键词" value={dataset.categoryKeyword} onChange={(event) => dataset.setCategoryKeyword(event.target.value)} onPressEnter={() => void dataset.loadData()} />
          <Select
            allowClear
            showSearch
            data-testid="sales-brand-filter"
            placeholder="品牌"
            value={dataset.brand || undefined}
            loading={dataset.classificationOptions.loading}
            filterOption={false}
            options={classificationSelectOptions(dataset.classificationOptions.brands)}
            onChange={(value) => dataset.setBrand(value || '')}
            onSearch={(value) => void dataset.loadClassificationOptions({ brandQuery: value })}
            onFocus={() => void dataset.loadClassificationOptions()}
          />
          <Select
            allowClear
            showSearch
            data-testid="sales-fulltype-filter"
            placeholder="后台类目"
            value={dataset.productFulltype || undefined}
            loading={dataset.classificationOptions.loading}
            filterOption={false}
            options={classificationSelectOptions(dataset.classificationOptions.fulltypes)}
            onChange={(value) => dataset.setProductFulltype(value || '')}
            onSearch={(value) => void dataset.loadClassificationOptions({ fulltypeQuery: value })}
            onFocus={() => void dataset.loadClassificationOptions()}
          />
          <Select
            allowClear
            data-testid="sales-product-field-filter"
            placeholder="商品字段缺失"
            value={dataset.dataQualityCode}
            options={missingFieldFilterOptions}
            onChange={(value) => dataset.setDataQualityCode(value)}
          />
          <RangePicker
            value={dataset.dateRange}
            allowClear={false}
            onChange={(value) => {
              if (value?.[0] && value?.[1]) dataset.setDateRange([value[0], value[1]])
            }}
          />
        </div>

        <SalesFactSummary
          latestSalesDate={latestSalesDate}
          productCount={dataset.products.length}
          selectedCount={dataset.selectedProducts.length}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <div
          data-testid="sales-product-list-heading"
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid #eef2f7', flexWrap: 'wrap' }}
        >
          <Title level={5} style={{ margin: 0 }}>商品销量列表</Title>
          <Text type="secondary">
            {dataset.products.length} 个商品 · 真实销量最新日 {latestSalesDate || '—'}
          </Text>
        </div>
        <Table<SalesProductRow>
          data-testid="sales-analytics-products"
          loading={dataset.loading}
          rowKey={dataset.productRowKey}
          rowSelection={dataset.rowSelection}
          size="middle"
          columns={productColumns(detail.openDetail)}
          dataSource={dataset.products}
          locale={{ emptyText: '暂无商品销量数据' }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1500 }}
        />
      </div>

      <ComparisonDialog
        open={dataset.compareOpen}
        products={dataset.selectedProducts}
        trends={dataset.trends}
        onClose={() => dataset.setCompareOpen(false)}
      />
      <ProductDetailDialog
        open={detail.detailOpen}
        loading={detail.detailLoading}
        row={detail.detailContext}
        detail={detail.detail}
        granularity={dataset.granularity}
        detailRangePreset={detail.detailRangePreset}
        detailDateRange={detail.detailDateRange}
        forecastQuery={dataset.forecastQuery}
        onClose={() => detail.setDetailOpen(false)}
        onDetailRangePresetChange={detail.changeDetailRangePreset}
        onDetailDateRangeChange={detail.changeDetailDateRange}
      />
    </div>
  )
}
