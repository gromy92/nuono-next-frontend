import { DownloadOutlined } from '@ant-design/icons'
import { Button, Empty, Space, Table, Tabs, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { ProductImageThumb } from '../../product-baseline'
import type {
  NoonAdvertisingCampaignDiagnostic,
  NoonAdvertisingCampaignRow,
  NoonAdvertisingProductDiagnostic,
  NoonAdvertisingProductRow,
  NoonAdvertisingQueryRow
} from '../types'
import {
  countRowsByCampaign,
  displaySkuOf,
  formatDecimal,
  formatMoney,
  formatNumber,
  formatRate,
  productDiagnosisTagColor,
  queryRowKey,
  sanitizeFilePart,
  secondarySkuOf,
} from '../presentation/formatters'
import {
  Metric,
  ProductFact,
  ProductDiagnosisPanel,
} from './AdviceGroups'
import { buildProductCampaignColumns } from '../presentation/productCampaignColumns'

const { Text } = Typography

export function ProductAnalysisDetail({
  product,
  diagnostic,
  campaignRows,
  selectedCampaignCode,
  zeroOrderQueries,
  winningQueries,
  campaignDiagnosticsByCode,
  queryColumns,
  onSelectCampaign,
  onExportCampaignRows,
  onExportQueryRows,
  onProductImagePreview,
  loading
}: {
  product: NoonAdvertisingProductRow | null
  diagnostic: NoonAdvertisingProductDiagnostic | null
  campaignRows: NoonAdvertisingCampaignRow[]
  selectedCampaignCode: string | null
  zeroOrderQueries: NoonAdvertisingQueryRow[]
  winningQueries: NoonAdvertisingQueryRow[]
  campaignDiagnosticsByCode: Map<string, NoonAdvertisingCampaignDiagnostic>
  queryColumns: ColumnsType<NoonAdvertisingQueryRow>
  onSelectCampaign: (campaignCode: string | null) => void
  onExportCampaignRows: (rows: NoonAdvertisingCampaignRow[], label: string, filePart: string) => void
  onExportQueryRows: (rows: NoonAdvertisingQueryRow[], label: string, filePart: string) => void
  onProductImagePreview: (imageUrl?: string | null) => void
  loading: boolean
}) {
  const selectedCampaign = campaignRows.find((row) => row.campaignCode === selectedCampaignCode) || null
  const selectedCampaignName = selectedCampaign?.campaignName || selectedCampaign?.campaignCode || '全部广告计划'
  const mainCampaign = campaignRows[0] || null
  const productFilePart = sanitizeFilePart(displaySkuOf(product || {}) || 'product')
  const zeroOrderQueryCountByCampaign = useMemo(() => countRowsByCampaign(zeroOrderQueries), [zeroOrderQueries])
  const winningQueryCountByCampaign = useMemo(() => countRowsByCampaign(winningQueries), [winningQueries])
  const selectedCampaignZeroOrderQueries = useMemo(
    () => selectedCampaign?.campaignCode
      ? zeroOrderQueries.filter((row) => row.campaignCode === selectedCampaign.campaignCode)
      : zeroOrderQueries,
    [selectedCampaign, zeroOrderQueries]
  )
  const selectedCampaignWinningQueries = useMemo(
    () => selectedCampaign?.campaignCode
      ? winningQueries.filter((row) => row.campaignCode === selectedCampaign.campaignCode)
      : winningQueries,
    [selectedCampaign, winningQueries]
  )
  const campaignStructureColumns = useMemo(
    () => buildProductCampaignColumns(
      campaignDiagnosticsByCode,
      zeroOrderQueryCountByCampaign,
      winningQueryCountByCampaign
    ),
    [campaignDiagnosticsByCode, winningQueryCountByCampaign, zeroOrderQueryCountByCampaign]
  )

  if (!product) {
    return (
      <div className="noon-ads-product-detail noon-ads-product-detail-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个商品标识" />
      </div>
    )
  }

  return (
    <div className="noon-ads-product-detail">
      <section className="noon-ads-product-dossier">
        <div className="noon-ads-product-dossier-main">
          <ProductImageThumb
            src={product.imageUrl}
            alt={displaySkuOf(product) || '商品图片'}
            imageCount={product.imageUrl ? 1 : 0}
            width={72}
            onClick={() => onProductImagePreview(product.imageUrl)}
          />
          <div className="noon-ads-product-dossier-title">
            <Space size={6} wrap>
              <Text strong>{displaySkuOf(product)}</Text>
              <Tag color={productDiagnosisTagColor(diagnostic?.diagnosisType)}>
                {diagnostic?.diagnosisLabel || '样本不足'}
              </Tag>
              <Tag color={diagnostic?.rankDataAvailable ? 'green' : 'default'}>
                {diagnostic?.rankDataAvailable ? '搜索排名已接入' : '搜索排名未接入'}
              </Tag>
            </Space>
            <div className="noon-ads-muted">
              {[secondarySkuOf(product), `${formatNumber(product.campaignCount)} 个广告计划 / ${formatNumber(product.queryCount)} 个关键词/搜索词`]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>
        <div className="noon-ads-product-dossier-facts">
          <ProductFact label="主消耗 Campaign" value={mainCampaign?.campaignName || mainCampaign?.campaignCode || '-'} />
          <ProductFact label="Campaign 数" value={formatNumber(campaignRows.length)} />
          <ProductFact label="零订单词" value={formatNumber(zeroOrderQueries.length)} />
          <ProductFact label="高转化词" value={formatNumber(winningQueries.length)} />
        </div>
      </section>

      <ProductDiagnosisPanel product={product} diagnostic={diagnostic} />

      <div className="noon-ads-product-kpis">
        <Metric label="商品广告花费" value={formatMoney(product.spendAmount)} />
        <Metric label="商品广告收入" value={formatMoney(product.adRevenue)} />
        <Metric label="商品 ROAS" value={formatDecimal(product.roas)} />
        <Metric label="商品广告订单" value={formatNumber(product.ordersCount)} />
        <Metric label="零订单花费" value={formatMoney(product.zeroOrderSpendAmount)} />
        <Metric label="零订单占比" value={formatRate(product.zeroOrderSpendShare)} />
      </div>

      <section className="noon-ads-product-section">
        <div className="noon-ads-product-section-header">
          <div>
            <Text strong>广告计划结构</Text>
            <div className="noon-ads-muted">点击广告计划后，下方关键词/搜索词随之切换。</div>
          </div>
          <Space size={8} wrap className="noon-ads-product-section-actions">
            <Button
              size="small"
              type={!selectedCampaign ? 'primary' : 'default'}
              onClick={() => onSelectCampaign(null)}
            >
              全部广告计划
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onExportCampaignRows(campaignRows, `${displaySkuOf(product)} Campaign`, `${productFilePart}_campaigns`)}
            >
              导出
            </Button>
          </Space>
        </div>
        <Table
          className="noon-ads-table noon-ads-product-campaign-table"
          size="small"
          rowKey={(row) => row.campaignCode}
          loading={loading}
          columns={campaignStructureColumns}
          dataSource={campaignRows}
          scroll={{ x: 1510 }}
          pagination={campaignRows.length > 8 ? { pageSize: 8 } : false}
          rowClassName={(row) => row.campaignCode === selectedCampaign?.campaignCode ? 'noon-ads-table-row-selected' : ''}
          onRow={(row) => ({
            onClick: () => onSelectCampaign(row.campaignCode)
          })}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无商品广告计划" /> }}
        />
      </section>

      <section className="noon-ads-product-section">
        <div className="noon-ads-product-section-header">
          <div>
            <Text strong>关键词/搜索词明细</Text>
            <div className="noon-ads-muted">{selectedCampaignName}</div>
          </div>
          <Space size={8} wrap className="noon-ads-product-section-actions">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onExportQueryRows(
                selectedCampaignZeroOrderQueries,
                `${displaySkuOf(product)} 零订单关键词搜索词`,
                `${productFilePart}_${selectedCampaign?.campaignCode || 'all_campaigns'}_zero_order_queries`
              )}
            >
              导出零订单
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onExportQueryRows(
                selectedCampaignWinningQueries,
                `${displaySkuOf(product)} 高转化关键词搜索词`,
                `${productFilePart}_${selectedCampaign?.campaignCode || 'all_campaigns'}_winning_queries`
              )}
            >
              导出高转化
            </Button>
          </Space>
        </div>
      <Tabs
        size="small"
        items={[
          {
            key: 'product-zero-order',
            label: `零订单关键词/搜索词 (${formatNumber(selectedCampaignZeroOrderQueries.length)})`,
            children: (
              <Table
                className="noon-ads-table"
                size="small"
                rowKey={queryRowKey}
                loading={loading}
                columns={queryColumns}
                dataSource={selectedCampaignZeroOrderQueries}
                scroll={{ x: 1160 }}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无零订单关键词/搜索词" /> }}
              />
            )
          },
          {
            key: 'product-winning',
            label: `高转化关键词/搜索词 (${formatNumber(selectedCampaignWinningQueries.length)})`,
            children: (
              <Table
                className="noon-ads-table"
                size="small"
                rowKey={queryRowKey}
                loading={loading}
                columns={queryColumns}
                dataSource={selectedCampaignWinningQueries}
                scroll={{ x: 1160 }}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无高转化关键词/搜索词" /> }}
              />
            )
          }
        ]}
      />
      </section>
    </div>
  )
}
