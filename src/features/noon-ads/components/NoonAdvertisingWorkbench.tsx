import { SearchOutlined } from '@ant-design/icons'
import {
  Alert,
  Empty,
  Input,
  Modal,
  Segmented,
  Table,
  Tabs,
  Typography
} from 'antd'
import { normalizeProductImageUrl } from '../../product-baseline'
import type { ProductFilterKey } from '../model/pageModel'
import { diagnosisFilterOptions, emptyDashboard } from '../model/pageModel'
import type { useNoonAdvertisingDashboard } from '../hooks/useNoonAdvertisingDashboard'
import {
  formatDecimal,
  formatMoney,
  formatNumber,
  formatRate,
  queryRowKey
} from '../presentation/formatters'
import { AdviceGroup, AdviceGroupModal, Metric } from './AdviceGroups'
import { NoonAdsTableActions, NoonAdvertisingTabControls } from './NoonAdsControls'
import { ProductAnalysisDetail } from './ProductAnalysisDetail'
import { ProductNavigationList } from './ProductNavigationList'

const { Text } = Typography

export function NoonAdvertisingWorkbench({
  state
}: {
  state: ReturnType<typeof useNoonAdvertisingDashboard>
}) {
  const {
    selectedStore, dateRange, setDateRange, dashboard, trendDashboard,
    loading, latestWindowLoading, query, expandedAdviceKey, setExpandedAdviceKey,
    selectedProductKeyResolved, setSelectedProductKey, selectedCampaignCodeResolved,
    setSelectedCampaignCode, productSearchText, setProductSearchText,
    productFilter, setProductFilter, imagePreviewUrl, setImagePreviewUrl,
    productRows, filteredProductRows, selectedProduct, productDiagnosticsByKey,
    campaignDiagnosticsByCode, selectedProductCampaignRows,
    selectedProductZeroOrderQueries, selectedProductWinningQueries,
    adviceGroups, campaignColumns, queryColumns, loadDashboard,
    onExportCampaignRows, onExportQueryRows, openProductImagePreview
  } = state
  const adSummary = dashboard.adSummary || emptyDashboard.adSummary
  const salesSummary = dashboard.salesSummary || emptyDashboard.salesSummary
  const dataStatus = dashboard.dataStatus || emptyDashboard.dataStatus
  const trendDataStatus = trendDashboard.dataStatus || emptyDashboard.dataStatus
  const expandedAdviceGroup =
    adviceGroups.find((group) => group.key === expandedAdviceKey) || null
  const previewImageUrl = normalizeProductImageUrl(imagePreviewUrl)

  return (
    <div className="noon-ads-page" data-testid="noon-ads-workbench">
      {!selectedStore?.storeCode ? (
        <Alert type="warning" showIcon message="当前账号没有可用店铺" />
      ) : null}
      {!dataStatus.dataAvailable && !loading && !latestWindowLoading ? (
        <Alert
          type="info"
          showIcon
          message="当前范围没有广告报表"
          description="先导入 Noon Ads Campaign Overview 和 Queries 的归一化数据后，这里会展示广告计划和关键词/搜索词经营数据。"
        />
      ) : null}

      <AdviceGroupModal group={expandedAdviceGroup} onClose={() => setExpandedAdviceKey(null)} />
      <Modal
        className="noon-ads-image-preview"
        open={Boolean(previewImageUrl)}
        footer={null}
        width={760}
        centered
        onCancel={() => setImagePreviewUrl(null)}
      >
        {previewImageUrl ? <img src={previewImageUrl} alt="商品图片" /> : null}
      </Modal>

      <Tabs
        className="noon-ads-primary-tabs"
        items={[
          {
            key: 'overview',
            label: '总览',
            children: (
              <>
                <NoonAdvertisingTabControls
                  dateRange={dateRange}
                  dataStatus={dataStatus}
                  disabled={!query}
                  loading={loading || latestWindowLoading}
                  trendDataStatus={trendDataStatus}
                  onDateRangeChange={setDateRange}
                  onRefresh={() => void loadDashboard(query)}
                />
                <div className="noon-ads-metric-grid">
                  <Metric label="广告花费" value={formatMoney(adSummary.spendAmount)} />
                  <Metric label="广告收入" value={formatMoney(adSummary.adRevenue)} />
                  <Metric label="ROAS" value={formatDecimal(adSummary.roas)} />
                  <Metric label="广告订单" value={formatNumber(adSummary.ordersCount)} />
                  <Metric label="自然销售额" value={formatMoney(salesSummary.revenueShipped)} />
                  <Metric label="广告费率" value={formatRate(salesSummary.adSpendShareOfSales)} />
                </div>
                <div className="noon-ads-advice-grid" aria-label="广告经营建议">
                  {adviceGroups.map((group) => (
                    <AdviceGroup key={group.key} group={group} onOpenAll={setExpandedAdviceKey} />
                  ))}
                </div>
                <div className="noon-ads-panel">
                  <Tabs
                    items={[
                      {
                        key: 'campaigns',
                        label: `广告计划 (${formatNumber(dashboard.campaignRows.length)})`,
                        children: (
                          <div className="noon-ads-table-stack">
                            <NoonAdsTableActions
                              count={dashboard.campaignRows.length}
                              onExport={() => onExportCampaignRows(dashboard.campaignRows, '广告计划', 'campaigns')}
                            />
                            <Table
                              className="noon-ads-table"
                              size="small"
                              rowKey={(row) => row.campaignCode}
                              loading={loading || latestWindowLoading}
                              columns={campaignColumns}
                              dataSource={dashboard.campaignRows}
                              scroll={{ x: 1630 }}
                              pagination={{ pageSize: 20, showSizeChanger: true }}
                              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无广告计划数据" /> }}
                            />
                          </div>
                        )
                      },
                      {
                        key: 'zero-order',
                        label: `零订单关键词/搜索词 (${formatNumber(dashboard.zeroOrderQueries.length)})`,
                        children: (
                          <div className="noon-ads-table-stack">
                            <NoonAdsTableActions
                              count={dashboard.zeroOrderQueries.length}
                              onExport={() => onExportQueryRows(dashboard.zeroOrderQueries, '零订单关键词搜索词', 'zero_order_queries')}
                            />
                            <Table
                              className="noon-ads-table"
                              size="small"
                              rowKey={queryRowKey}
                              loading={loading || latestWindowLoading}
                              columns={queryColumns}
                              dataSource={dashboard.zeroOrderQueries}
                              scroll={{ x: 1160 }}
                              pagination={{ pageSize: 20, showSizeChanger: true }}
                              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无零订单关键词/搜索词" /> }}
                            />
                          </div>
                        )
                      },
                      {
                        key: 'winning',
                        label: `高转化关键词/搜索词 (${formatNumber(dashboard.winningQueries.length)})`,
                        children: (
                          <div className="noon-ads-table-stack">
                            <NoonAdsTableActions
                              count={dashboard.winningQueries.length}
                              onExport={() => onExportQueryRows(dashboard.winningQueries, '高转化关键词搜索词', 'winning_queries')}
                            />
                            <Table
                              className="noon-ads-table"
                              size="small"
                              rowKey={queryRowKey}
                              loading={loading || latestWindowLoading}
                              columns={queryColumns}
                              dataSource={dashboard.winningQueries}
                              scroll={{ x: 1160 }}
                              pagination={{ pageSize: 20, showSizeChanger: true }}
                              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无高转化关键词/搜索词" /> }}
                            />
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              </>
            )
          },
          {
            key: 'product-detail',
            label: `商品详情 (${formatNumber(productRows.length)})`,
            children: (
              <>
                <NoonAdvertisingTabControls
                  dateRange={dateRange}
                  dataStatus={dataStatus}
                  disabled={!query}
                  loading={loading || latestWindowLoading}
                  trendDataStatus={trendDataStatus}
                  onDateRangeChange={setDateRange}
                  onRefresh={() => void loadDashboard(query)}
                />
                <div className="noon-ads-panel">
                  <div className="noon-ads-product-analysis">
                    <div className="noon-ads-product-search">
                      <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="搜索商品 / PSKU / 广告码"
                        value={productSearchText}
                        onChange={(event) => setProductSearchText(event.target.value)}
                      />
                      <Segmented
                        value={productFilter}
                        onChange={(value) => setProductFilter(value as ProductFilterKey)}
                        options={diagnosisFilterOptions}
                      />
                      <Text type="secondary">
                        显示 {formatNumber(filteredProductRows.length)} / {formatNumber(productRows.length)}
                      </Text>
                    </div>
                    <div className="noon-ads-product-workspace">
                      <div className="noon-ads-product-list-pane">
                        <ProductNavigationList
                          products={filteredProductRows}
                          productDiagnosticsByKey={productDiagnosticsByKey}
                          selectedProductKey={selectedProductKeyResolved}
                          loading={loading || latestWindowLoading}
                          onSelectProduct={setSelectedProductKey}
                          onProductImagePreview={openProductImagePreview}
                        />
                      </div>
                      <div className="noon-ads-product-detail-pane">
                        <ProductAnalysisDetail
                          product={selectedProduct}
                          diagnostic={selectedProductKeyResolved ? productDiagnosticsByKey.get(selectedProductKeyResolved) || null : null}
                          campaignRows={selectedProductCampaignRows}
                          selectedCampaignCode={selectedCampaignCodeResolved}
                          zeroOrderQueries={selectedProductZeroOrderQueries}
                          winningQueries={selectedProductWinningQueries}
                          campaignDiagnosticsByCode={campaignDiagnosticsByCode}
                          queryColumns={queryColumns}
                          onSelectCampaign={setSelectedCampaignCode}
                          onExportCampaignRows={onExportCampaignRows}
                          onExportQueryRows={onExportQueryRows}
                          onProductImagePreview={openProductImagePreview}
                          loading={loading || latestWindowLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          }
        ]}
      />
    </div>
  )
}
