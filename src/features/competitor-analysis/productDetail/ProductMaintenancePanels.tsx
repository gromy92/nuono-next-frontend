import {
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { Button, Input, Select, Space, Tag, Typography } from 'antd'
import { productTitleLines } from '../competitorProductListModel'
import type {
  CompetitorKeyword,
  CompetitorWatchProduct
} from '../types'
import { candidateStatusForKeyword } from './candidateModel'

const { Text } = Typography

export function KeywordMaintenancePanel({
  product,
  keywordInput,
  actionLoading,
  onKeywordInputChange,
  onAddKeyword,
  onKeywordStatusChange,
  onKeywordDelete,
  onKeywordDetailOpen
}: {
  product: CompetitorWatchProduct
  keywordInput: string
  actionLoading: string | null
  onKeywordInputChange: (value: string) => void
  onAddKeyword: () => void
  onKeywordStatusChange: (
    keyword: CompetitorKeyword,
    status: 'active' | 'paused'
  ) => void
  onKeywordDelete: (keyword: CompetitorKeyword) => void
  onKeywordDetailOpen: (keyword: CompetitorKeyword) => void
}) {
  return (
    <Space
      direction="vertical"
      style={{ width: '100%' }}
      size={12}
      data-testid="competitor-keyword-panel"
    >
      <ProductModalSummary product={product} />
      <div className="competitor-analysis-inline-form">
        <Input
          allowClear
          autoFocus
          placeholder="输入关键词"
          value={keywordInput}
          onChange={(event) => onKeywordInputChange(event.target.value)}
          onPressEnter={onAddKeyword}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={actionLoading === 'add-keyword'}
          onClick={onAddKeyword}
        >
          新增关键词
        </Button>
      </div>
      <div className="competitor-analysis-keyword-maintenance-list">
        {product.keywords.map((keyword) => (
          <div
            key={keyword.id}
            className="competitor-analysis-keyword-maintenance-item"
          >
            <KeywordTag keyword={keyword} />
            <Space size={6}>
              <Button
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => onKeywordDetailOpen(keyword)}
              >
                关键词详情
              </Button>
              <Button
                size="small"
                loading={actionLoading === `keyword-status-${keyword.id}`}
                onClick={() =>
                  onKeywordStatusChange(
                    keyword,
                    keyword.status === 'active' ? 'paused' : 'active'
                  )
                }
              >
                {keyword.status === 'active' ? '暂停' : '启用'}
              </Button>
              <Button
                size="small"
                danger
                loading={actionLoading === `keyword-delete-${keyword.id}`}
                onClick={() => onKeywordDelete(keyword)}
              >
                移除
              </Button>
            </Space>
          </div>
        ))}
      </div>
    </Space>
  )
}

export function ManualCompetitorPanel({
  product,
  manualInput,
  selectedKeywordId,
  actionLoading,
  onManualInputChange,
  onManualKeywordChange,
  onManualAdd
}: {
  product: CompetitorWatchProduct
  manualInput: string
  selectedKeywordId: string
  actionLoading: string | null
  onManualInputChange: (value: string) => void
  onManualKeywordChange: (value: string) => void
  onManualAdd: () => void
}) {
  const activeKeywords = product.keywords
    .filter((keyword) => keyword.status === 'active')
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
  const confirmedCandidates = selectedKeywordId
    ? product.candidates.filter(
        (candidate) =>
          candidateStatusForKeyword(candidate, selectedKeywordId) === 'confirmed'
      )
    : []

  return (
    <Space
      direction="vertical"
      style={{ width: '100%' }}
      size={12}
      data-testid="competitor-manual-panel"
    >
      <ProductModalSummary product={product} />
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Text strong>添加到关键词</Text>
        <Select
          value={selectedKeywordId || undefined}
          placeholder="选择关键词"
          style={{ width: '100%' }}
          options={activeKeywords.map((keyword) => ({
            label: keyword.keyword,
            value: keyword.id
          }))}
          onChange={onManualKeywordChange}
        />
      </Space>
      <div className="competitor-analysis-inline-form">
        <Input
          allowClear
          autoFocus
          placeholder="粘贴 Noon 链接、Z 码或 N 码"
          value={manualInput}
          onChange={(event) => onManualInputChange(event.target.value)}
          onPressEnter={onManualAdd}
        />
        <Button
          icon={<PlusOutlined />}
          disabled={!selectedKeywordId}
          loading={actionLoading === 'manual-add'}
          onClick={onManualAdd}
        >
          手工添加
        </Button>
      </div>
      <Text type="secondary">手工添加后直接进入所选关键词的已选竞品池。</Text>
      <div className="competitor-analysis-modal-summary">
        <Text strong>当前关键词已选竞品</Text>
        <Space wrap size={6}>
          {confirmedCandidates.map((candidate) => (
            <Tag
              key={candidate.id}
              color={candidate.sourceType === 'manual_add' ? 'cyan' : 'green'}
            >
              {candidate.noonProductCode}
            </Tag>
          ))}
        </Space>
      </div>
    </Space>
  )
}

function ProductModalSummary({ product }: { product: CompetitorWatchProduct }) {
  const titleLines = productTitleLines(product)
  return (
    <div className="competitor-analysis-modal-summary">
      <Text
        strong
        className="competitor-analysis-product-title-cn"
        ellipsis={{ tooltip: titleLines.primary }}
      >
        {titleLines.primary}
      </Text>
      {titleLines.secondary ? (
        <Text
          type="secondary"
          className="competitor-analysis-product-title-en"
          ellipsis={{ tooltip: titleLines.secondary }}
        >
          {titleLines.secondary}
        </Text>
      ) : null}
      <Space size={4} wrap>
        <Tag color="blue">我方SKU {product.partnerSku}</Tag>
        <Tag>{product.siteCode}</Tag>
        <Text type="secondary">Noon {product.selfNoonProductCode}</Text>
      </Space>
    </div>
  )
}

function KeywordTag({ keyword }: { keyword: CompetitorKeyword }) {
  return (
    <Tag
      color={keyword.status === 'active' ? 'blue' : 'default'}
      icon={<SearchOutlined />}
    >
      {keyword.keyword}
    </Tag>
  )
}
