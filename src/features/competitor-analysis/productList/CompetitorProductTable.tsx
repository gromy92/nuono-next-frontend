import {
  EyeOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Button, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ProductBaselineIdentity } from '../../product-baseline'
import { ProductKeywordLinks, ProductTitleStack } from '../CompetitorProductListCells'
import { formatNotInRankRangeText } from '../competitorRankFormatting'
import {
  productListIdentityCodes,
  productTitleLines
} from '../competitorProductListModel'
import { summarizeRanks } from '../domain'
import { RunStatusTag } from '../productDetail/RunStatusTag'
import type { CompetitorWatchProduct } from '../types'
import { productActionKey, productRowKey } from './competitorProductIdentity'

const { Text } = Typography

export function CompetitorProductTable({
  products,
  loading,
  page,
  pageSize,
  total,
  actionLoading,
  openActionTooltip,
  reportOpen,
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
  actionLoading: string | null
  openActionTooltip: string | null
  reportOpen: boolean
  onPageChange: (page: number, pageSize: number) => void
  onKeywordEdit: (product: CompetitorWatchProduct) => void
  onRefresh: (product: CompetitorWatchProduct) => void
  onManualAdd: (product: CompetitorWatchProduct) => void
  onDetail: (product: CompetitorWatchProduct) => void
  onReport: (product: CompetitorWatchProduct) => void
  onReportTooltipChange: (value: string | null) => void
}) {
  const columns: ColumnsType<CompetitorWatchProduct> = [
    {
      title: '商品基线',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 310,
      render: (_value, product) => {
        const titleLines = productTitleLines(product)
        return (
          <ProductBaselineIdentity
            compact
            title={<ProductTitleStack titleLines={titleLines} />}
            fallbackTitle="未命名商品"
            imageUrl={product.imageUrl}
            imageAlt={titleLines.alt}
            imageWidth={70}
            titleMaxWidth={200}
            codes={productListIdentityCodes(product)}
            tags={!product.id ? <Tag style={{ marginInlineEnd: 0 }}>未监控</Tag> : undefined}
          />
        )
      }
    },
    {
      title: '关键词',
      key: 'keywords',
      width: 250,
      render: (_value, product) => (
        <ProductKeywordLinks product={product} onEdit={() => onKeywordEdit(product)} />
      )
    },
    {
      title: '候选/监控中',
      key: 'candidates',
      width: 96,
      render: (_value, product) => {
        const pending =
          product.pendingCandidateCount ??
          product.candidates.filter((candidate) => candidate.reviewStatus === 'pending').length
        const confirmed =
          product.confirmedCompetitorCount ??
          product.candidates.filter((candidate) => candidate.reviewStatus === 'confirmed').length
        return (
          <div className="competitor-analysis-count-stack">
            <div className="competitor-analysis-count-row">
              <Text type="secondary">候选</Text>
              <Tag color={pending ? 'gold' : 'default'}>{pending}</Tag>
            </div>
            <div className="competitor-analysis-count-row">
              <Text type="secondary">监控中</Text>
              <Tag color="green">{confirmed}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      title: '近7日竞品变化',
      key: 'recent-competitor-changes',
      width: 126,
      align: 'center',
      render: (_value, product) => (
        <Space direction="vertical" size={0}>
          <Text type={product.recent7dChangedCompetitorCount ? undefined : 'secondary'}>
            共 {product.recent7dChangedCompetitorCount ?? 0} 个商品
          </Text>
          <Text type={product.recent7dCompetitorChangeCount ? undefined : 'secondary'}>
            共 {product.recent7dCompetitorChangeCount ?? 0} 次
          </Text>
        </Space>
      )
    },
    {
      title: '排名摘要',
      key: 'rank',
      width: 146,
      render: (_value, product) => {
        const summary = product.id ? summarizeRanks(product) : undefined
        return (
          <Space direction="vertical" size={2}>
            <Text>{summary?.label || '暂无排名'}</Text>
            <Text type="secondary">
              {summary?.notInScanDepthCount ?? 0} 次{formatNotInRankRangeText()}
            </Text>
          </Space>
        )
      }
    },
    {
      title: '最近抓取',
      key: 'run',
      width: 140,
      render: (_value, product) => (
        <Space direction="vertical" size={2}>
          {product.id ? (
            <RunStatusTag status={product.latestRunStatus} />
          ) : (
            <Tag>未开始</Tag>
          )}
          <Text type="secondary">{product.id ? product.latestRunAt : '-'}</Text>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 152,
      render: (_value, product) => {
        const activeKeywordCount =
          product.activeKeywordCount ??
          product.keywords.filter((keyword) => keyword.status === 'active').length
        const refreshDisabled = !product.id || activeKeywordCount <= 0
        return (
          <Space size={4} className="competitor-analysis-row-actions">
            <Tooltip title={activeKeywordCount <= 0 ? '维护启用关键词后可抓取' : '抓取'}>
              <Button
                aria-label="抓取"
                size="small"
                icon={<ReloadOutlined />}
                shape="circle"
                disabled={refreshDisabled}
                loading={actionLoading === `refresh-${product.id}`}
                onClick={() => onRefresh(product)}
              />
            </Tooltip>
            <Tooltip title="添加竞品">
              <Button
                aria-label="添加竞品"
                size="small"
                icon={<PlusOutlined />}
                shape="circle"
                loading={actionLoading === productActionKey('ensure', product)}
                onClick={() => onManualAdd(product)}
              />
            </Tooltip>
            <Tooltip title="查看详情">
              <Button
                aria-label="查看详情"
                size="small"
                icon={<EyeOutlined />}
                shape="circle"
                loading={actionLoading === productActionKey('ensure', product)}
                onClick={() => onDetail(product)}
              />
            </Tooltip>
            <Tooltip
              title="报表"
              open={openActionTooltip === productActionKey('report', product) && !reportOpen}
              onOpenChange={(open) =>
                onReportTooltipChange(open ? productActionKey('report', product) : null)
              }
            >
              <Button
                aria-label="报表"
                size="small"
                icon={<LineChartOutlined />}
                shape="circle"
                loading={actionLoading === productActionKey('report', product)}
                onClick={() => onReport(product)}
              />
            </Tooltip>
          </Space>
        )
      }
    }
  ]

  return (
    <Table
      className="competitor-analysis-table"
      rowKey={productRowKey}
      columns={columns}
      dataSource={products}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (value) => `共 ${value} 个商品`,
        onChange: onPageChange
      }}
      scroll={{ x: 1220 }}
      size="middle"
    />
  )
}
