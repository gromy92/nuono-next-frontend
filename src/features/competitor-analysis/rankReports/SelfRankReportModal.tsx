import {
  ClockCircleOutlined,
  LineChartOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { Empty, Space, Spin, Tabs, Tag, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { normalizeProductImageUrl } from '../../product-baseline'
import { buildNoonSearchUrl } from '../competitorNoonLinks'
import { productTitleLines } from '../competitorProductListModel'
import {
  ProductChangeModal,
  ProductChangeSummaryLine
} from '../productChanges/ProductChangeModal'
import { buildProductChangeSummary } from '../productChanges/productChangeModel'
import type {
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeGroup,
  CompetitorWatchProduct
} from '../types'
import { RankKeywordReportPanel } from './RankKeywordReportPanel'
import {
  rankedMonitoredCompetitorCount,
  reportMonitoredCount
} from './rankCompetitorSeries'
import { buildSelfRankReport } from './rankReportModel'
import type { SelfRankKeywordReport } from './rankReportTypes'

const { Text } = Typography

export function SelfRankReportModal({
  product,
  storeLabel,
  rankLoading,
  changeGroups,
  changeBaselineSummary,
  changeLoading
}: {
  product: CompetitorWatchProduct
  storeLabel?: string
  rankLoading: boolean
  changeGroups: CompetitorProductChangeGroup[]
  changeBaselineSummary?: CompetitorProductChangeBaselineSummary
  changeLoading: boolean
}) {
  const reports = useMemo(() => buildSelfRankReport(product), [product])
  const [selectedReportId, setSelectedReportId] = useState('')
  const changeSummary = buildProductChangeSummary(changeGroups)
  const monitoredCompetitorCount =
    changeBaselineSummary?.monitoredCompetitorCount ??
    product.confirmedCompetitorCount ??
    0
  const selectedReport =
    reports.find((report) => report.keywordId === selectedReportId) ?? reports[0]

  useEffect(() => {
    if (!reports.length) {
      if (selectedReportId) {
        setSelectedReportId('')
      }
      return
    }
    if (!reports.some((report) => report.keywordId === selectedReportId)) {
      setSelectedReportId(reports[0].keywordId)
    }
  }, [reports, selectedReportId])

  return (
    <div
      className="competitor-analysis-report-modal"
      data-testid="competitor-self-rank-report"
    >
      <ReportProductHeader
        product={product}
        summary={changeSummary}
        monitoredCompetitorCount={monitoredCompetitorCount}
        baselineSummary={changeBaselineSummary}
      />

      <Tabs
        className="competitor-analysis-analysis-tabs"
        items={[
          {
            key: 'ranking',
            label: (
              <span className="competitor-analysis-report-tab-label">
                <LineChartOutlined />
                <span>排名分析</span>
                <Tag>{reports.length}</Tag>
              </span>
            ),
            children: (
              <Spin spinning={rankLoading}>
                {reports.length ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <RankKeywordChips
                      product={product}
                      reports={reports}
                      selectedReportId={selectedReport?.keywordId || ''}
                      onSelect={setSelectedReportId}
                    />
                    {selectedReport ? (
                      <RankKeywordReportPanel
                        product={product}
                        report={selectedReport}
                      />
                    ) : null}
                  </Space>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无真实排名数据"
                  />
                )}
              </Spin>
            )
          },
          {
            key: 'changes',
            label: (
              <span className="competitor-analysis-report-tab-label">
                <ClockCircleOutlined />
                <span>变化历史</span>
                <Tag color={changeSummary.fieldChanges ? 'orange' : undefined}>
                  {changeSummary.fieldChanges}
                </Tag>
              </span>
            ),
            children: (
              <Spin spinning={changeLoading}>
                <ProductChangeModal
                  product={product}
                  storeLabel={storeLabel}
                  groups={changeGroups}
                  baselineSummary={changeBaselineSummary}
                  showIdentity={false}
                  showSummary={false}
                />
              </Spin>
            )
          }
        ]}
      />
    </div>
  )
}

function ReportProductHeader({
  product,
  summary,
  monitoredCompetitorCount,
  baselineSummary
}: {
  product: CompetitorWatchProduct
  summary: ReturnType<typeof buildProductChangeSummary>
  monitoredCompetitorCount: number
  baselineSummary?: CompetitorProductChangeBaselineSummary
}) {
  const titleLines = productTitleLines(product)
  const psku = product.partnerSku || '-'
  const chineseTitle = product.titleCn?.trim() || ''
  const englishTitle = product.title?.trim() || ''
  const fallbackTitle = chineseTitle || englishTitle ? '' : titleLines.primary
  return (
    <div className="competitor-analysis-report-header">
      <ReportProductThumb src={product.imageUrl} alt={titleLines.alt} />
      <div className="competitor-analysis-report-header-body">
        <Space size={6} wrap>
          <Text strong className="competitor-analysis-report-heading">
            商品分析
          </Text>
          <Tag
            color="blue"
            className="competitor-analysis-report-product-psku"
            style={{ marginInlineEnd: 0 }}
          >
            PSKU {psku}
          </Tag>
          {product.siteCode ? (
            <Tag style={{ marginInlineEnd: 0 }}>{product.siteCode}</Tag>
          ) : null}
        </Space>
        <div className="competitor-analysis-report-product-titles">
          {chineseTitle || fallbackTitle ? (
            <Text
              strong
              className="competitor-analysis-report-product-title competitor-analysis-product-title-cn"
              ellipsis={{ tooltip: chineseTitle || fallbackTitle }}
            >
              {chineseTitle || fallbackTitle}
            </Text>
          ) : null}
          {englishTitle ? (
            <Text
              type="secondary"
              className="competitor-analysis-report-product-title competitor-analysis-report-product-title-en-full competitor-analysis-product-title-en"
            >
              {englishTitle}
            </Text>
          ) : null}
        </div>
        <ProductChangeSummaryLine
          summary={summary}
          monitoredCompetitorCount={monitoredCompetitorCount}
          baselineSummary={baselineSummary}
        />
      </div>
    </div>
  )
}

function ReportProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState('')
  const normalizedSrc = normalizeProductImageUrl(src)
  const visibleSrc =
    normalizedSrc && failedSrc !== normalizedSrc ? normalizedSrc : ''

  return (
    <span className="competitor-analysis-report-product-thumb">
      {visibleSrc ? (
        <>
          <img
            src={visibleSrc}
            alt={alt}
            onError={() => setFailedSrc(visibleSrc)}
          />
          <span className="competitor-analysis-report-product-thumb-count">1</span>
        </>
      ) : (
        <span className="competitor-analysis-report-product-thumb-empty">无图</span>
      )}
    </span>
  )
}

function RankKeywordChips({
  product,
  reports,
  selectedReportId,
  onSelect
}: {
  product: CompetitorWatchProduct
  reports: SelfRankKeywordReport[]
  selectedReportId: string
  onSelect: (keywordId: string) => void
}) {
  return (
    <div className="competitor-analysis-report-keyword-chip-list">
      {reports.map((report) => {
        const rankedCount = rankedMonitoredCompetitorCount(product, report.keywordId)
        const monitoredCount = reportMonitoredCount(product, report.keywordId)
        const selected = report.keywordId === selectedReportId
        const noonSearchUrl = buildNoonSearchUrl(
          report.keyword,
          product.siteCode,
          product.id
        )
        return (
          <div
            key={report.keywordId}
            className={`competitor-analysis-report-keyword-chip${selected ? ' competitor-analysis-report-keyword-chip-active' : ''}`}
          >
            <Tooltip title="打开 Noon 前台搜索">
              <a
                className="competitor-analysis-report-keyword-chip-search"
                href={noonSearchUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <SearchOutlined />
              </a>
            </Tooltip>
            <button
              type="button"
              aria-pressed={selected}
              className="competitor-analysis-report-keyword-chip-select"
              onClick={() => onSelect(report.keywordId)}
            >
              <span>{report.keyword}</span>
              <Tag color={rankedCount ? 'blue' : undefined}>
                {`${rankedCount} in ${monitoredCount}`}
              </Tag>
            </button>
          </div>
        )
      })}
    </div>
  )
}
