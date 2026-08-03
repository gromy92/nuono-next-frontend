import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Button, Popover, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ProductBaselineIdentity } from '../../product-baseline'
import type { SalesProductRow } from '../types'
import {
  TrafficMetric,
  averageOrderValue,
  formatMoney,
  formatNumber,
  formatStockCoverDays,
  lastCategoryLabel,
  missingFieldTags
} from './formatters'

const { Text } = Typography

export const productColumnHelp = {
  product: {
    testId: 'sales-column-help-product',
    description: '展示商品标题、PSKU、SKU、品牌和后台类目。品牌/后台类目来自商品管理主档，未匹配时会显示缺失标签。'
  },
  productFields: {
    testId: 'sales-column-help-product-fields',
    description: '只展示商品主档未匹配、品牌缺失或后台类目缺失等直接字段事实，不推断数据是否就绪。'
  },
  traffic: {
    testId: 'sales-column-help-traffic',
    description: '访客为商品详情页访问人数，转化率为订单转化表现。最新日表示该商品最新销量事实日的单日指标；当前范围表示当前筛选日期范围内的汇总指标。'
  },
  sales: {
    testId: 'sales-column-help-sales',
    description: '净销量=毛销量扣除取消后的销量；毛销量、发货、取消用于判断订单履约和取消影响。'
  },
  revenue: {
    testId: 'sales-column-help-revenue',
    description: '收入为当前筛选范围内已发货销售额汇总；客单价按收入除以净销量推算。'
  },
  inventory: {
    testId: 'sales-column-help-inventory',
    description: '可售库存来自商品管理库存数据，包含 FBN、Supermall、FBP；覆盖天数按当前库存除以当前范围日均净销量估算。'
  },
  trendSnapshot: {
    testId: 'sales-column-help-trend-snapshot',
    description: '最新日表示该商品最新销量事实日的单日净销量；当前范围表示筛选日期范围内的累计净销量，用于判断近期销量是否偏离区间表现。'
  },
  forecast: {
    testId: 'sales-column-help-forecast',
    description: '未来预测预留给销量预测结果；没有可信预测结果时不展示伪造数据。'
  }
} as const

export function columnTitle(title: string, help: (typeof productColumnHelp)[keyof typeof productColumnHelp]) {
  return (
    <Space size={4} align="center">
      <span>{title}</span>
      <Tooltip title={help.description}>
        <span
          aria-label={`${title}字段说明`}
          data-testid={help.testId}
          style={{ color: '#faad14', cursor: 'help', fontSize: 12, lineHeight: 1, position: 'relative', top: -2 }}
        >
          <ExclamationCircleOutlined />
        </span>
      </Tooltip>
    </Space>
  )
}

export function productColumns(
  onOpenDetail: (row: SalesProductRow) => void
): ColumnsType<SalesProductRow> {
  return [
    {
      title: columnTitle('商品信息', productColumnHelp.product),
      key: 'product',
      width: 280,
      fixed: 'left',
      render: (_, row) => (
        <Popover content={<ProductIdentityPopover row={row} />} trigger="hover" placement="rightTop">
          <div>
            <ProductBaselineIdentity
              title={row.productTitle || row.partnerSku}
              imageUrl={row.imageUrl}
              imageCount={row.imageUrl ? 1 : 0}
              imageAlt={row.productTitle || row.partnerSku}
              imageWidth={72}
              compact
              titleMaxWidth={178}
              codes={[
                { label: 'PSKU', value: row.partnerSku, copyText: row.partnerSku },
                { label: 'SKU', value: row.sku, copyText: row.sku }
              ]}
              tags={
                <>
                  <Tag style={{ fontSize: 11, marginInlineEnd: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.brand || '品牌 —'}</Tag>
                  <Tag title={row.productFulltype || undefined} style={{ fontSize: 11, marginInlineEnd: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lastCategoryLabel(row.productFulltype)}
                  </Tag>
                </>
              }
            />
          </div>
        </Popover>
      )
    },
    {
      title: columnTitle('商品字段', productColumnHelp.productFields),
      key: 'productFields',
      width: 130,
      render: (_, row) => <Space direction="vertical" size={4}>{missingFieldTags(row)}</Space>
    },
    {
      title: columnTitle('访客与转化', productColumnHelp.traffic),
      key: 'traffic',
      width: 150,
      render: (_, row) => (
        <TrafficMetric
          latestVisitors={row.latestYourVisitors ?? row.yourVisitors}
          latestConversion={row.latestConversionVisitorsPercentage ?? row.conversionVisitorsPercentage}
          rangeVisitors={row.yourVisitors}
          rangeConversion={row.conversionVisitorsPercentage}
        />
      )
    },
    {
      title: columnTitle('销量表现', productColumnHelp.sales),
      key: 'sales',
      width: 150,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>净销量 {formatNumber(row.netUnits)}</Text>
          <Text type="secondary">毛 {formatNumber(row.grossUnits)} / 发 {formatNumber(row.shippedUnits)} / 取消 {formatNumber(row.cancelledUnits)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('收入', productColumnHelp.revenue),
      key: 'revenue',
      width: 120,
      render: (_, row) => <Space direction="vertical" size={0}><Text strong>{formatMoney(row.revenueShipped)} SAR</Text><Text type="secondary">客单价 {formatMoney(averageOrderValue(row.revenueShipped, row.netUnits))}</Text></Space>
    },
    {
      title: columnTitle('库存', productColumnHelp.inventory),
      key: 'inventory',
      width: 110,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>可售 {formatNumber(row.currentStock)}</Text>
          <Text type="secondary">覆盖 {formatStockCoverDays(row.stockCoverDays)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('趋势快照', productColumnHelp.trendSnapshot),
      key: 'trendSnapshot',
      width: 150,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>{formatNumber(row.latestNetUnits ?? row.netUnits)}</Text>
          <Text type="secondary">{formatNumber(row.netUnits)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('未来预测', productColumnHelp.forecast),
      key: 'forecast',
      width: 130,
      render: () => <Space direction="vertical" size={0}><Text>30天 —</Text><Text type="secondary">置信度 —</Text></Space>
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" aria-label="详情" onClick={() => onOpenDetail(row)} style={{ width: 48 }}>详情</Button>
      )
    }
  ]
}

export function ProductIdentityPopover({ row }: { row: SalesProductRow }) {
  return (
    <Space direction="vertical" size={6} style={{ maxWidth: 320 }}>
      <Text style={{ whiteSpace: 'normal' }}>{row.productTitle || row.partnerSku}</Text>
      <Text copyable={{ text: row.partnerSku }}>PSKU {row.partnerSku}</Text>
      <Text copyable={{ text: row.sku }}>SKU {row.sku}</Text>
    </Space>
  )
}
