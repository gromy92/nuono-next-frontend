import {
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Modal,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { normalizeError } from '../../../shared/api'
import { ProductBaselineIdentity } from '../../product-baseline'
import { fetchCompetitorRankHistory } from '../api'
import { ProductTitleStack } from '../CompetitorProductListCells'
import {
  formatRankStatus
} from '../competitorRankFormatting'
import {
  isAbortError,
  productTitleLines
} from '../competitorProductListModel'
import type {
  CompetitorRankPoint,
  CompetitorWatchProduct
} from '../types'
import { KeywordBoard } from './KeywordBoard'
import { RankHistoryTable } from './RankHistoryTable'
import {
  candidateStatusForKeyword,
  getCandidatesForKeyword,
  getLatestRankPoint
} from './candidateModel'
import {
  buildHistoryRankRows,
  buildRankRows
} from './rankHistoryModel'

const { Text } = Typography

export type HistoryRange = '7' | '30' | '90' | '180' | '365'

export function ProductDetail({
  product,
  storeLabel,
  ownedNoonProductCodes,
  historyRange,
  onHistoryRangeChange,
  onCandidateStatusChange,
  onCandidateBatchStatusChange,
  onManualRefresh,
  actionLoading
}: {
  product: CompetitorWatchProduct
  storeLabel?: string
  ownedNoonProductCodes: ReadonlySet<string>
  historyRange: HistoryRange
  onHistoryRangeChange: (value: HistoryRange) => void
  onCandidateStatusChange: (
    keywordId: string,
    candidateId: string,
    status: 'confirmed' | 'ignored' | 'removed'
  ) => void
  onCandidateBatchStatusChange: (
    keywordId: string,
    candidateIds: string[],
    status: 'confirmed' | 'ignored'
  ) => void
  onManualRefresh: (product: CompetitorWatchProduct) => void
  actionLoading: string | null
}) {
  const { message } = App.useApp()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyRows, setHistoryRows] = useState<CompetitorRankPoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const activeKeywords = useMemo(
    () =>
      product.keywords
        .filter((keyword) => keyword.status === 'active')
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder),
    [product.keywords]
  )
  const [selectedKeywordId, setSelectedKeywordId] = useState(
    activeKeywords[0]?.id ?? ''
  )
  const selectedKeyword =
    activeKeywords.find((keyword) => keyword.id === selectedKeywordId) ??
    activeKeywords[0]
  const keywordCandidates = useMemo(
    () =>
      selectedKeyword ? getCandidatesForKeyword(product, selectedKeyword) : [],
    [product, selectedKeyword]
  )
  const selectedSelfRankPoint = selectedKeyword
    ? getLatestRankPoint(
        product,
        selectedKeyword.id,
        product.selfNoonProductCode
      )
    : undefined
  const selectedPendingCount = selectedKeyword
    ? keywordCandidates.filter(
        (candidate) =>
          candidateStatusForKeyword(candidate, selectedKeyword.id) === 'pending'
      ).length
    : 0
  const selectedConfirmedCount = selectedKeyword
    ? keywordCandidates.filter(
        (candidate) =>
          candidateStatusForKeyword(candidate, selectedKeyword.id) === 'confirmed'
      ).length
    : 0
  const latestRankRows = useMemo(
    () =>
      selectedKeyword
        ? buildRankRows(product).filter(
            (point) => point.keywordId === selectedKeyword.id
          )
        : [],
    [product, selectedKeyword]
  )
  const activeKeywordCount = product.activeKeywordCount ?? activeKeywords.length
  const refreshDisabled = !product.id || activeKeywordCount <= 0
  const titleLines = productTitleLines(product)

  useEffect(() => {
    if (!activeKeywords.some((keyword) => keyword.id === selectedKeywordId)) {
      setSelectedKeywordId(activeKeywords[0]?.id ?? '')
    }
  }, [activeKeywords, selectedKeywordId])

  useEffect(() => {
    if (!historyOpen || !selectedKeyword) {
      return undefined
    }
    const controller = new AbortController()
    setHistoryLoading(true)
    fetchCompetitorRankHistory(
      product.id,
      {
        keywordId: selectedKeyword.id,
        rangeDays: Number(historyRange)
      },
      controller.signal
    )
      .then(setHistoryRows)
      .catch((error) => {
        if (!isAbortError(error)) {
          message.error(normalizeError(error, '读取排名历史失败'))
          setHistoryRows([])
        }
      })
      .finally(() => setHistoryLoading(false))
    return () => controller.abort()
  }, [historyOpen, historyRange, message, product.id, selectedKeyword])

  return (
    <div className="competitor-analysis-detail">
      <Card size="small" variant="borderless">
        <div className="competitor-analysis-toolbar">
          <ProductBaselineIdentity
            title={<ProductTitleStack titleLines={titleLines} />}
            fallbackTitle="未命名商品"
            imageUrl={product.imageUrl}
            imageAlt={titleLines.alt}
            imageWidth={80}
            titleMaxWidth={520}
            codes={[
              { label: '店铺', value: storeLabel || product.storeCode || '-' },
              {
                label: 'psku',
                value: product.partnerSku || '-',
                copyText: product.partnerSku || undefined
              },
              ...(product.selfNoonProductCode
                ? [{
                    label: 'Noon',
                    value: product.selfNoonProductCode,
                    copyText: product.selfNoonProductCode
                  }]
                : [])
            ]}
            tags={
              product.siteCode ? (
                <Tag style={{ marginInlineEnd: 0 }}>{product.siteCode}</Tag>
              ) : undefined
            }
          />
          <Tooltip title={activeKeywordCount <= 0 ? '维护启用关键词后可抓取' : ''}>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              disabled={refreshDisabled}
              loading={actionLoading === `refresh-${product.id}`}
              onClick={() => onManualRefresh(product)}
            >
              抓取
            </Button>
          </Tooltip>
        </div>
      </Card>

      <Card size="small" variant="borderless">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div className="competitor-analysis-keyword-toolbar">
            <div className="competitor-analysis-keyword-list">
              {activeKeywords.map((keyword) => (
                <Button
                  key={keyword.id}
                  type={keyword.id === selectedKeyword?.id ? 'primary' : 'default'}
                  icon={<SearchOutlined />}
                  onClick={() => setSelectedKeywordId(keyword.id)}
                >
                  {keyword.keyword}
                  <Text className="competitor-analysis-keyword-count">
                    {getCandidatesForKeyword(product, keyword).length}
                  </Text>
                </Button>
              ))}
            </div>
            <Space wrap size={6}>
              <Tag color="blue">本品 {formatRankStatus(selectedSelfRankPoint)}</Tag>
              <Tag color={selectedPendingCount ? 'gold' : 'default'}>
                {selectedPendingCount} 待选
              </Tag>
              <Tag color="green">{selectedConfirmedCount} 已选</Tag>
              <Button
                size="small"
                icon={<ClockCircleOutlined />}
                onClick={() => setHistoryOpen(true)}
              >
                排名历史
              </Button>
            </Space>
          </div>
          <KeywordBoard
            product={product}
            keyword={selectedKeyword}
            candidates={keywordCandidates}
            ownedNoonProductCodes={ownedNoonProductCodes}
            onCandidateStatusChange={onCandidateStatusChange}
            onCandidateBatchStatusChange={onCandidateBatchStatusChange}
            actionLoading={actionLoading}
          />
        </Space>
      </Card>

      <Modal
        width={960}
        open={historyOpen}
        title={selectedKeyword ? `排名历史：${selectedKeyword.keyword}` : '排名历史'}
        footer={null}
        onCancel={() => setHistoryOpen(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Segmented
            value={historyRange}
            onChange={(value) => onHistoryRangeChange(value as HistoryRange)}
            options={[
              { label: '7天', value: '7' },
              { label: '30天', value: '30' },
              { label: '90天', value: '90' },
              { label: '180天', value: '180' },
              { label: '365天', value: '365' }
            ]}
          />
          <RankHistoryTable
            product={product}
            rows={
              historyOpen
                ? buildHistoryRankRows(product, historyRows, selectedKeyword)
                : latestRankRows
            }
            loading={historyLoading}
          />
        </Space>
      </Modal>
    </div>
  )
}
