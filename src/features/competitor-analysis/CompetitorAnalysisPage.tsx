import {
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Modal,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
  StopOutlined
} from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import type { AuthSession } from '../auth/session'
import {
  addCompetitorKeyword,
  addManualCompetitor,
  confirmCompetitorCandidate,
  deleteCompetitorKeyword,
  fetchCompetitorRankHistory,
  fetchCompetitorRefreshRun,
  fetchCompetitorWatchProductDetail,
  fetchCompetitorWatchProducts,
  ignoreCompetitorCandidate,
  requestCompetitorRefresh,
  updateCompetitorKeyword,
  type CompetitorRefreshRun
} from './api'
import { summarizeRanks } from './domain'
import { normalizeError } from '../../shared/api'
import type { CompetitorCandidate, CompetitorKeyword, CompetitorRankPoint, CompetitorWatchProduct } from './types'
import './CompetitorAnalysisPage.css'

const { Text } = Typography

type CompetitorAnalysisPageProps = {
  session: AuthSession
}

type HistoryRange = '7' | '30' | '90' | '180' | '365'

export function CompetitorAnalysisPage({ session: _session }: CompetitorAnalysisPageProps) {
  const { message } = App.useApp()
  const [products, setProducts] = useState<CompetitorWatchProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedProductDetail, setSelectedProductDetail] = useState<CompetitorWatchProduct>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [keywordModalOpen, setKeywordModalOpen] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refreshRuns, setRefreshRuns] = useState<Record<string, CompetitorRefreshRun>>({})
  const [productSearch, setProductSearch] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [competitorSearch, setCompetitorSearch] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [historyRange, setHistoryRange] = useState<HistoryRange>('30')

  const selectedProduct =
    selectedProductDetail?.id === selectedProductId
      ? selectedProductDetail
      : products.find((product) => product.id === selectedProductId) ?? products[0]

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setListLoading(true)
      fetchCompetitorWatchProducts(
        {
          productSearch,
          keywordSearch,
          competitorSearch,
          page: 1,
          pageSize: 50
        },
        controller.signal
      )
        .then((result) => {
          setProducts(result.items)
          setSelectedProductId((current) => {
            if (current && result.items.some((product) => product.id === current)) {
              return current
            }
            return result.items[0]?.id ?? ''
          })
        })
        .catch((error) => {
          if (!isAbortError(error)) {
            message.error(normalizeError(error, '读取竞品监控列表失败'))
          }
        })
        .finally(() => {
          setListLoading(false)
        })
    }, 180)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [competitorSearch, keywordSearch, message, productSearch])

  const mergeProduct = (product: CompetitorWatchProduct) => {
    setSelectedProductDetail(product)
    setProducts((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) => (item.id === product.id ? { ...item, ...product } : item))
        : [product, ...current]
    )
  }

  const loadProductDetail = async (productId: string, options?: { showLoading?: boolean }) => {
    if (options?.showLoading !== false) {
      setDetailLoading(true)
    }
    try {
      const detail = await fetchCompetitorWatchProductDetail(productId)
      mergeProduct(detail)
      return detail
    } catch (error) {
      message.error(normalizeError(error, '读取竞品监控详情失败'))
      return undefined
    } finally {
      if (options?.showLoading !== false) {
        setDetailLoading(false)
      }
    }
  }

  const openDetail = (product: CompetitorWatchProduct) => {
    setSelectedProductId(product.id)
    setDetailOpen(true)
    void loadProductDetail(product.id)
  }

  const openKeywordModal = (product: CompetitorWatchProduct) => {
    setSelectedProductId(product.id)
    setKeywordInput('')
    setKeywordModalOpen(true)
    void loadProductDetail(product.id)
  }

  const openManualModal = (product: CompetitorWatchProduct) => {
    setSelectedProductId(product.id)
    setManualInput('')
    setManualModalOpen(true)
    void loadProductDetail(product.id)
  }

  const handleAddKeyword = async () => {
    if (!selectedProduct) {
      return
    }
    const keyword = keywordInput.trim()
    if (!keyword) {
      return
    }
    setActionLoading('add-keyword')
    try {
      const detail = await addCompetitorKeyword(selectedProduct.id, keyword, `en-${selectedProduct.siteCode}`)
      mergeProduct(detail)
      message.success('关键词已加入监控')
      setKeywordInput('')
    } catch (error) {
      message.error(normalizeError(error, '新增关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleKeywordStatusChange = async (keyword: CompetitorKeyword, status: 'active' | 'paused') => {
    setActionLoading(`keyword-status-${keyword.id}`)
    try {
      const detail = await updateCompetitorKeyword(keyword.id, {
        keyword: keyword.keyword,
        locale: keyword.locale,
        displayOrder: keyword.displayOrder,
        status
      })
      mergeProduct(detail)
      message.success(status === 'active' ? '关键词已启用' : '关键词已暂停')
    } catch (error) {
      message.error(normalizeError(error, '更新关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleKeywordDelete = async (keyword: CompetitorKeyword) => {
    setActionLoading(`keyword-delete-${keyword.id}`)
    try {
      const detail = await deleteCompetitorKeyword(keyword.id)
      mergeProduct(detail)
      message.success('关键词已删除')
    } catch (error) {
      message.error(normalizeError(error, '删除关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleManualAdd = async () => {
    if (!selectedProduct) {
      return
    }
    const input = manualInput.trim()
    if (!input) {
      return
    }
    setActionLoading('manual-add')
    try {
      const detail = await addManualCompetitor(selectedProduct.id, input)
      mergeProduct(detail)
      message.success('手工竞品已加入确认池')
      setManualInput('')
    } catch (error) {
      message.error(normalizeError(error, '手工添加竞品失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCandidateStatusChange = async (
    keywordId: string,
    candidateId: string,
    status: 'confirmed' | 'ignored'
  ) => {
    setActionLoading(`candidate-${status}-${keywordId}-${candidateId}`)
    try {
      const detail =
        status === 'confirmed'
          ? await confirmCompetitorCandidate(keywordId, candidateId)
          : await ignoreCompetitorCandidate(keywordId, candidateId)
      mergeProduct(detail)
      message.success(status === 'confirmed' ? '竞品已确认' : '竞品已忽略')
    } catch (error) {
      message.error(normalizeError(error, status === 'confirmed' ? '确认竞品失败' : '忽略竞品失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefresh = async (product: CompetitorWatchProduct) => {
    setActionLoading(`refresh-${product.id}`)
    try {
      const run = await requestCompetitorRefresh(product.id)
      if (run.runId) {
        setRefreshRuns((current) => ({ ...current, [product.id]: run }))
        void pollRefreshRun(product.id, run.runId)
      }
      message.info('手动刷新已提交，正在抓取排名')
    } catch (error) {
      message.error(normalizeError(error, '提交竞品刷新失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const pollRefreshRun = async (watchProductId: string, runId: string) => {
    for (let index = 0; index < 12; index += 1) {
      await delay(index === 0 ? 700 : 2000)
      try {
        const run = await fetchCompetitorRefreshRun(runId)
        setRefreshRuns((current) => ({ ...current, [watchProductId]: run }))
        const status = (run.runStatus || run.taskStatus || '').toUpperCase()
        if (['SUCCEEDED', 'PARTIAL_FAILED', 'FAILED'].includes(status)) {
          if (status === 'SUCCEEDED') {
            message.success(run.message || '竞品刷新完成')
          } else if (status === 'PARTIAL_FAILED') {
            message.warning(run.message || '竞品刷新部分关键词失败')
          } else {
            message.error(run.errorMessage || run.message || '竞品刷新失败')
          }
          await loadProductDetail(watchProductId, { showLoading: false })
          return
        }
      } catch (error) {
        message.error(normalizeError(error, '读取竞品刷新状态失败'))
        return
      }
    }
  }

  const resetSearch = () => {
    setProductSearch('')
    setKeywordSearch('')
    setCompetitorSearch('')
  }

  const handleRefreshFirstProduct = () => {
    const product = products[0]
    if (product) {
      void handleRefresh(product)
    }
  }

  const productColumns: ColumnsType<CompetitorWatchProduct> = [
    {
      title: '我方监控商品',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 380,
      render: (_value, product) => (
        <div className="competitor-analysis-product-cell">
          <div className="competitor-analysis-product-thumb">
            <img src={product.imageUrl} alt="" />
          </div>
          <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
            <Text strong ellipsis={{ tooltip: product.title }}>
              {product.title}
            </Text>
            <Space size={4} wrap>
              <Tag color="blue">我方SKU {product.partnerSku}</Tag>
              <Tag>{product.siteCode}</Tag>
              <Text type="secondary">Noon {product.selfNoonProductCode}</Text>
            </Space>
          </Space>
        </div>
      )
    },
    {
      title: '关键词',
      key: 'keywords',
      width: 96,
      render: (_value, product) =>
        product.activeKeywordCount ?? product.keywords.filter((keyword) => keyword.status === 'active').length
    },
    {
      title: '候选 / 确认',
      key: 'candidates',
      width: 132,
      render: (_value, product) => {
        const pending =
          product.pendingCandidateCount ??
          product.candidates.filter((candidate) => candidate.reviewStatus === 'pending').length
        const confirmed =
          product.confirmedCompetitorCount ??
          product.candidates.filter((candidate) => candidate.reviewStatus === 'confirmed').length
        return (
          <Space size={4} wrap>
            <Tag color={pending ? 'gold' : 'default'}>{pending} 待确认</Tag>
            <Tag color="green">{confirmed} 已确认</Tag>
          </Space>
        )
      }
    },
    {
      title: '最近排名',
      key: 'rank',
      width: 150,
      render: (_value, product) => {
        const summary = summarizeRanks(product)
        return (
          <Space direction="vertical" size={2}>
            <Text>{summary.label}</Text>
            <Text type="secondary">{summary.notInTop30Count} 次未进前30</Text>
          </Space>
        )
      }
    },
    {
      title: '最近抓取',
      key: 'run',
      width: 148,
      render: (_value, product) => (
        <Space direction="vertical" size={2}>
          <RunStatusTag status={product.latestRunStatus} />
          <Text type="secondary">{product.latestRunAt}</Text>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 278,
      render: (_value, product) => (
        <Space size={6}>
          <Button size="small" icon={<SearchOutlined />} onClick={() => openKeywordModal(product)}>
            关键词
          </Button>
          <Button size="small" icon={<PlusOutlined />} onClick={() => openManualModal(product)}>
            添加竞品
          </Button>
          <Button size="small" onClick={() => openDetail(product)}>
            查看详情
          </Button>
          <Tooltip title="提交当前商品全部关键词刷新">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={actionLoading === `refresh-${product.id}`}
              onClick={() => void handleRefresh(product)}
            >
              手动刷新
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="competitor-analysis-page" data-testid="competitor-analysis-workbench">
      <Card size="small" className="competitor-analysis-search-card" variant="borderless">
        <div className="competitor-analysis-search-grid">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索我方SKU、商品标题、Noon码"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索关键词"
            value={keywordSearch}
            onChange={(event) => setKeywordSearch(event.target.value)}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索竞品Z/N码、品牌、标题"
            value={competitorSearch}
            onChange={(event) => setCompetitorSearch(event.target.value)}
          />
          <Space wrap>
            <Button onClick={resetSearch}>重置</Button>
            <Button icon={<PlusOutlined />}>新增监控商品</Button>
            <Button
              icon={<ReloadOutlined />}
              loading={products[0] ? actionLoading === `refresh-${products[0].id}` : false}
              onClick={handleRefreshFirstProduct}
            >
              手动刷新
            </Button>
          </Space>
        </div>
        <Text type="secondary">已筛选 {products.length} 个我方SKU，每日 08:00 自动轮询 Noon 前台关键词前 30 名。</Text>
      </Card>

      <Card size="small" title="监控商品列表（按我方SKU）" variant="borderless">
        <Table
          rowKey="id"
          columns={productColumns}
          dataSource={products}
          loading={listLoading}
          pagination={false}
          scroll={{ x: 1060 }}
          size="middle"
        />
      </Card>

      {selectedProduct ? (
        <>
          <Drawer
            width="min(1360px, calc(100vw - 96px))"
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            title="我方商品竞品详情"
            destroyOnClose={false}
          >
            <ProductDetail
              product={selectedProduct}
              historyRange={historyRange}
              onHistoryRangeChange={setHistoryRange}
              onRefresh={() => void handleRefresh(selectedProduct)}
              onCandidateStatusChange={(keywordId, candidateId, status) =>
                void handleCandidateStatusChange(keywordId, candidateId, status)
              }
              actionLoading={actionLoading}
              refreshRun={refreshRuns[selectedProduct.id]}
            />
          </Drawer>

          <Modal
            width={640}
            open={keywordModalOpen}
            title="关键词维护"
            footer={null}
            onCancel={() => setKeywordModalOpen(false)}
            destroyOnClose={false}
          >
            <Spin spinning={detailLoading}>
              <KeywordMaintenancePanel
                product={selectedProduct}
                keywordInput={keywordInput}
                actionLoading={actionLoading}
                onKeywordInputChange={setKeywordInput}
                onAddKeyword={() => void handleAddKeyword()}
                onKeywordStatusChange={(keyword, status) => void handleKeywordStatusChange(keyword, status)}
                onKeywordDelete={(keyword) => void handleKeywordDelete(keyword)}
              />
            </Spin>
          </Modal>

          <Modal
            width={680}
            open={manualModalOpen}
            title="手工添加竞品"
            footer={null}
            onCancel={() => setManualModalOpen(false)}
            destroyOnClose={false}
          >
            <Spin spinning={detailLoading}>
              <ManualCompetitorPanel
                product={selectedProduct}
                manualInput={manualInput}
                actionLoading={actionLoading}
                onManualInputChange={setManualInput}
                onManualAdd={() => void handleManualAdd()}
              />
            </Spin>
          </Modal>
        </>
      ) : null}
    </div>
  )
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

type ProductDetailProps = {
  product: CompetitorWatchProduct
  historyRange: HistoryRange
  onHistoryRangeChange: (value: HistoryRange) => void
  onRefresh: () => void
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored') => void
  actionLoading: string | null
  refreshRun?: CompetitorRefreshRun
}

function ProductDetail({
  product,
  historyRange,
  onHistoryRangeChange,
  onRefresh,
  onCandidateStatusChange,
  actionLoading,
  refreshRun
}: ProductDetailProps) {
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
  const [selectedKeywordId, setSelectedKeywordId] = useState(activeKeywords[0]?.id ?? '')
  const selectedKeyword =
    activeKeywords.find((keyword) => keyword.id === selectedKeywordId) ?? activeKeywords[0]
  const keywordCandidates = useMemo(
    () => (selectedKeyword ? getCandidatesForKeyword(product, selectedKeyword) : []),
    [product, selectedKeyword]
  )
  const selectedSelfRankPoint = selectedKeyword
    ? getLatestRankPoint(product, selectedKeyword.id, product.selfNoonProductCode)
    : undefined
  const selectedPendingCount = selectedKeyword
    ? keywordCandidates.filter((candidate) => candidateStatusForKeyword(candidate, selectedKeyword.id) === 'pending').length
    : 0
  const selectedConfirmedCount = selectedKeyword
    ? keywordCandidates.filter((candidate) => candidateStatusForKeyword(candidate, selectedKeyword.id) === 'confirmed').length
    : 0
  const latestRankRows = useMemo(
    () => (selectedKeyword ? buildRankRows(product).filter((point) => point.keywordId === selectedKeyword.id) : []),
    [product, selectedKeyword]
  )

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
      .finally(() => {
        setHistoryLoading(false)
      })
    return () => controller.abort()
  }, [historyOpen, historyRange, message, product.id, selectedKeyword])

  return (
    <div className="competitor-analysis-detail">
      <Card size="small" variant="borderless">
        <div className="competitor-analysis-toolbar">
          <div className="competitor-analysis-product-cell">
            <div className="competitor-analysis-product-thumb">
              <img src={product.imageUrl} alt="" />
            </div>
            <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
              <Text strong>{product.title}</Text>
              <Space size={4} wrap>
                <Tag color="blue">我方SKU {product.partnerSku}</Tag>
                <Tag>{product.siteCode}</Tag>
                <Text type="secondary">店铺 {product.storeCode}</Text>
                <Text type="secondary">Noon {product.selfNoonProductCode}</Text>
              </Space>
            </Space>
          </div>
          <Space wrap>
            {refreshRun ? (
              <Tag color={refreshRun.runStatus === 'SUCCEEDED' ? 'green' : 'blue'}>
                刷新 {refreshRun.progressPercent ?? 0}%
              </Tag>
            ) : null}
            <Button icon={<ReloadOutlined />} loading={actionLoading === `refresh-${product.id}`} onClick={onRefresh}>
              手动刷新
            </Button>
          </Space>
        </div>
      </Card>

      <Card size="small" variant="borderless">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div className="competitor-analysis-keyword-toolbar">
            <div className="competitor-analysis-keyword-list">
              {activeKeywords.map((keyword) => {
                const keywordCandidateCount = getCandidatesForKeyword(product, keyword).length
                return (
                  <Button
                    key={keyword.id}
                    type={keyword.id === selectedKeyword?.id ? 'primary' : 'default'}
                    icon={<SearchOutlined />}
                    onClick={() => setSelectedKeywordId(keyword.id)}
                  >
                    {keyword.keyword}
                    <Text className="competitor-analysis-keyword-count">{keywordCandidateCount}</Text>
                  </Button>
                )
              })}
            </div>
            <Space wrap size={6}>
              <Tag color="blue">本品 {formatRankStatus(selectedSelfRankPoint)}</Tag>
              <Tag color={selectedPendingCount ? 'gold' : 'default'}>{selectedPendingCount} 待选</Tag>
              <Tag color="green">{selectedConfirmedCount} 已选</Tag>
              <Button size="small" icon={<ClockCircleOutlined />} onClick={() => setHistoryOpen(true)}>
                排名历史
              </Button>
            </Space>
          </div>
          <KeywordBoard
            product={product}
            keyword={selectedKeyword}
            candidates={keywordCandidates}
            onCandidateStatusChange={onCandidateStatusChange}
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
          <Table
            rowKey="id"
            dataSource={historyOpen ? buildHistoryRankRows(product, historyRows, selectedKeyword) : latestRankRows}
            columns={rankColumns(product)}
            pagination={false}
            loading={historyLoading}
            size="small"
            scroll={{ x: 920 }}
          />
        </Space>
      </Modal>
    </div>
  )
}

function KeywordMaintenancePanel({
  product,
  keywordInput,
  actionLoading,
  onKeywordInputChange,
  onAddKeyword,
  onKeywordStatusChange,
  onKeywordDelete
}: {
  product: CompetitorWatchProduct
  keywordInput: string
  actionLoading: string | null
  onKeywordInputChange: (value: string) => void
  onAddKeyword: () => void
  onKeywordStatusChange: (keyword: CompetitorKeyword, status: 'active' | 'paused') => void
  onKeywordDelete: (keyword: CompetitorKeyword) => void
}) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12} data-testid="competitor-keyword-panel">
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
        <Button type="primary" icon={<PlusOutlined />} loading={actionLoading === 'add-keyword'} onClick={onAddKeyword}>
          新增关键词
        </Button>
      </div>
      <div className="competitor-analysis-keyword-maintenance-list">
        {product.keywords.map((keyword) => (
          <div key={keyword.id} className="competitor-analysis-keyword-maintenance-item">
            <KeywordTag keyword={keyword} />
            <Space size={6}>
              <Button
                size="small"
                loading={actionLoading === `keyword-status-${keyword.id}`}
                onClick={() => onKeywordStatusChange(keyword, keyword.status === 'active' ? 'paused' : 'active')}
              >
                {keyword.status === 'active' ? '暂停' : '启用'}
              </Button>
              <Button
                size="small"
                danger
                loading={actionLoading === `keyword-delete-${keyword.id}`}
                onClick={() => onKeywordDelete(keyword)}
              >
                删除
              </Button>
            </Space>
          </div>
        ))}
      </div>
    </Space>
  )
}

function ManualCompetitorPanel({
  product,
  manualInput,
  actionLoading,
  onManualInputChange,
  onManualAdd
}: {
  product: CompetitorWatchProduct
  manualInput: string
  actionLoading: string | null
  onManualInputChange: (value: string) => void
  onManualAdd: () => void
}) {
  const confirmedCandidates = product.candidates.filter((candidate) => candidate.reviewStatus === 'confirmed')

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12} data-testid="competitor-manual-panel">
      <ProductModalSummary product={product} />
      <div className="competitor-analysis-inline-form">
        <Input
          allowClear
          autoFocus
          placeholder="粘贴 Noon 链接、Z 码或 N 码"
          value={manualInput}
          onChange={(event) => onManualInputChange(event.target.value)}
          onPressEnter={onManualAdd}
        />
        <Button icon={<PlusOutlined />} loading={actionLoading === 'manual-add'} onClick={onManualAdd}>
          手工添加
        </Button>
      </div>
      <Text type="secondary">手工添加后直接进入已确认竞品池，后续按所有 active 关键词记录排名。</Text>
      <div className="competitor-analysis-modal-summary">
        <Text strong>已确认竞品</Text>
        <Space wrap size={6}>
          {confirmedCandidates.map((candidate) => (
            <Tag key={candidate.id} color={candidate.sourceType === 'manual_add' ? 'cyan' : 'green'}>
              {candidate.noonProductCode}
            </Tag>
          ))}
        </Space>
      </div>
    </Space>
  )
}

function ProductModalSummary({ product }: { product: CompetitorWatchProduct }) {
  return (
    <div className="competitor-analysis-modal-summary">
      <Text strong ellipsis={{ tooltip: product.title }}>
        {product.title}
      </Text>
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
    <Tag color={keyword.status === 'active' ? 'blue' : 'default'} icon={<SearchOutlined />}>
      {keyword.keyword}
    </Tag>
  )
}

function KeywordBoard({
  product,
  keyword,
  candidates,
  onCandidateStatusChange,
  actionLoading
}: {
  product: CompetitorWatchProduct
  keyword?: CompetitorKeyword
  candidates: CompetitorCandidate[]
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored') => void
  actionLoading: string | null
}) {
  if (!keyword) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有维护关键词" />
  }

  const pendingCandidates = candidates.filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'pending')
  const confirmedCandidates = candidates.filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'confirmed')

  return (
    <div className="competitor-analysis-keyword-board" data-testid="competitor-keyword-board">
      {pendingCandidates.length ? (
        <div className="competitor-analysis-board-pool">
          <div className="competitor-analysis-board-pool-header">
            <Text strong>待选池 ({pendingCandidates.length})</Text>
            <Text type="secondary">运营确认后进入已选竞品，后续每日记录排名。</Text>
          </div>
          <CandidateGallery
            candidates={pendingCandidates}
            keyword={keyword}
            product={product}
            emptyText="当前关键词没有待选竞品"
            onCandidateStatusChange={onCandidateStatusChange}
            actionLoading={actionLoading}
          />
        </div>
      ) : null}

      <div className="competitor-analysis-board-pool">
        <div className="competitor-analysis-board-pool-header">
          <Text strong>已选竞品 ({confirmedCandidates.length})</Text>
          <Text type="secondary">已纳入当前关键词排名看板。</Text>
        </div>
        <CandidateGallery
          candidates={confirmedCandidates}
          keyword={keyword}
          product={product}
          readonly
          emptyText="当前关键词还没有已选竞品"
          onCandidateStatusChange={onCandidateStatusChange}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  )
}

function CandidateGallery({
  product,
  keyword,
  candidates,
  readonly,
  emptyText,
  onCandidateStatusChange,
  actionLoading
}: {
  product: CompetitorWatchProduct
  keyword: CompetitorKeyword
  candidates: CompetitorCandidate[]
  readonly?: boolean
  emptyText: string
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored') => void
  actionLoading: string | null
}) {
  if (!candidates.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
  }

  return (
    <div className="competitor-analysis-candidate-grid">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          readonly={readonly}
          keywordId={keyword.id}
          reviewStatus={candidateStatusForKeyword(candidate, keyword.id)}
          rankPoint={getLatestRankPoint(product, keyword.id, candidate.noonProductCode)}
          onCandidateStatusChange={onCandidateStatusChange}
          actionLoading={actionLoading}
        />
      ))}
    </div>
  )
}

function CandidateCard({
  candidate,
  readonly,
  keywordId,
  reviewStatus,
  rankPoint,
  onCandidateStatusChange,
  actionLoading
}: {
  candidate: CompetitorCandidate
  readonly?: boolean
  keywordId: string
  reviewStatus: 'pending' | 'confirmed' | 'ignored'
  rankPoint?: CompetitorRankPoint
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored') => void
  actionLoading: string | null
}) {
  const isSponsored = rankPoint?.isSponsored ?? candidate.isSponsored

  return (
    <article
      className="competitor-analysis-candidate-card"
      role="link"
      tabIndex={0}
      aria-label={`打开 Noon 商品 ${candidate.noonProductCode}`}
      onClick={() => openCandidateLink(candidate.canonicalUrl)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openCandidateLink(candidate.canonicalUrl)
        }
      }}
    >
      <div className="competitor-analysis-candidate-media">
        <div className="competitor-analysis-candidate-badges">
          {isSponsored ? <Tag color="purple">广告</Tag> : null}
          <Tag color={rankPoint?.rankStatus === 'not_in_top_30' ? 'default' : 'gold'}>
            {formatRankStatus(rankPoint, candidate.latestRankNo)}
          </Tag>
        </div>
        <img src={candidate.imageUrl} alt="" />
        <span className="competitor-analysis-candidate-placeholder">{candidate.brand.slice(0, 2).toUpperCase()}</span>
      </div>

      <div className="competitor-analysis-candidate-body">
        <div className="competitor-analysis-candidate-code-row">
          <Space size={4} wrap>
            <Text strong>{candidate.noonProductCode}</Text>
            <Tag>{candidate.codeType === 'Z_CODE' ? 'Z码' : 'N码'}</Tag>
          </Space>
          <ReviewStatusTag status={reviewStatus} />
        </div>

        <Text className="competitor-analysis-candidate-title" ellipsis={{ tooltip: candidate.title }}>
          {candidate.title}
        </Text>
        <Text type="secondary" className="competitor-analysis-candidate-brand">
          {candidate.brand}
        </Text>

        <div className="competitor-analysis-candidate-commerce">
          <Text strong className="competitor-analysis-candidate-price">
            {formatCandidatePrice(candidate)}
          </Text>
          <Space size={4} className="competitor-analysis-candidate-rating">
            {candidate.rating ? (
              <>
                <StarFilled />
                <Text>{candidate.rating}</Text>
                <Text type="secondary">({candidate.reviewCount || 0})</Text>
              </>
            ) : (
              <Text type="secondary">暂无评分</Text>
            )}
          </Space>
        </div>

        <Space wrap size={4} className="competitor-analysis-candidate-keywords">
          <Tag color={candidate.sourceType === 'manual_add' ? 'cyan' : 'geekblue'}>
            {candidate.sourceType === 'manual_add' ? '手工添加' : '搜索发现'}
          </Tag>
          {candidate.keywordEvidence.map((keyword) => (
            <Tag key={keyword}>{keyword}</Tag>
          ))}
        </Space>

        <div className="competitor-analysis-candidate-footer">
          {readonly ? (
            <Text type="secondary">已纳入排名</Text>
          ) : (
            <Space size={6}>
              <Button
                size="small"
                type={reviewStatus === 'confirmed' ? 'default' : 'primary'}
                disabled={reviewStatus === 'confirmed'}
                loading={actionLoading === `candidate-confirmed-${keywordId}-${candidate.id}`}
                icon={<CheckCircleOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  onCandidateStatusChange(keywordId, candidate.id, 'confirmed')
                }}
              >
                确认竞品
              </Button>
              <Button
                size="small"
                disabled={reviewStatus === 'ignored'}
                loading={actionLoading === `candidate-ignored-${keywordId}-${candidate.id}`}
                icon={<StopOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  onCandidateStatusChange(keywordId, candidate.id, 'ignored')
                }}
              >
                忽略
              </Button>
            </Space>
          )}
        </div>
      </div>
    </article>
  )
}

function openCandidateLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function formatCandidatePrice(candidate: CompetitorCandidate) {
  if (!candidate.priceAmount) {
    return '--'
  }
  return `${candidate.priceAmount} ${candidate.currencyCode || ''}`.trim()
}

function getCandidatesForKeyword(product: CompetitorWatchProduct, keyword: CompetitorKeyword) {
  const keywordText = normalizeSearchText(keyword.keyword)
  const rankedCodes = new Set(
    product.rankPoints
      .filter((point) => point.keywordId === keyword.id && !point.isSelf)
      .map((point) => point.noonProductCode)
  )

  return product.candidates.filter(
    (candidate) =>
      candidateStatusForKeyword(candidate, keyword.id) !== 'ignored' &&
      (rankedCodes.has(candidate.noonProductCode) ||
        candidate.keywordReviewStatus?.[keyword.id] ||
        candidate.keywordEvidence.some((evidence) => normalizeSearchText(evidence) === keywordText))
  )
}

function candidateStatusForKeyword(candidate: CompetitorCandidate, keywordId: string) {
  return candidate.keywordReviewStatus?.[keywordId] ?? candidate.reviewStatus
}

function getLatestRankPoint(product: CompetitorWatchProduct, keywordId: string, noonProductCode: string) {
  return product.rankPoints
    .filter((point) => point.keywordId === keywordId && point.noonProductCode === noonProductCode)
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))[0]
}

function formatRankStatus(rankPoint?: CompetitorRankPoint, fallbackRankNo?: number) {
  if (rankPoint?.rankStatus === 'ranked' && rankPoint.rankNo) {
    return `第 ${rankPoint.rankNo} 名`
  }
  if (rankPoint?.rankStatus === 'not_in_top_30') {
    return '未进前30'
  }
  if (fallbackRankNo) {
    return `第 ${fallbackRankNo} 名`
  }
  return '暂无排名'
}

function RunStatusTag({ status }: { status: string }) {
  if (status === 'succeeded') {
    return <Tag color="green">抓取成功</Tag>
  }
  if (status === 'running') {
    return <Tag color="blue">抓取中</Tag>
  }
  if (status === 'partial_failed') {
    return <Tag color="orange">部分失败</Tag>
  }
  if (status === 'captcha_required') {
    return <Tag color="orange">验证码</Tag>
  }
  return <Tag color="red">抓取受限</Tag>
}

function ReviewStatusTag({ status }: { status: string }) {
  if (status === 'confirmed') {
    return <Tag color="green">已确认</Tag>
  }
  if (status === 'ignored') {
    return <Tag>已忽略</Tag>
  }
  return <Tag color="gold">待确认</Tag>
}

function buildRankRows(product: CompetitorWatchProduct) {
  return product.rankPoints
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))
    .map((point) => ({
      ...point,
      keyword: product.keywords.find((keyword) => keyword.id === point.keywordId)?.keyword || '-',
      title: point.isSelf
        ? product.title
        : product.candidates.find((candidate) => candidate.noonProductCode === point.noonProductCode)?.title || point.noonProductCode
    }))
}

function buildHistoryRankRows(
  product: CompetitorWatchProduct,
  rankPoints: CompetitorRankPoint[],
  selectedKeyword?: CompetitorKeyword
) {
  return rankPoints
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))
    .map((point) => ({
      ...point,
      keyword: selectedKeyword?.id === point.keywordId
        ? selectedKeyword.keyword
        : product.keywords.find((keyword) => keyword.id === point.keywordId)?.keyword || '-',
      title: point.isSelf
        ? product.title
        : product.candidates.find((candidate) => candidate.noonProductCode === point.noonProductCode)?.title || point.noonProductCode
    }))
}

function rankColumns(product: CompetitorWatchProduct): ColumnsType<ReturnType<typeof buildRankRows>[number]> {
  return [
    {
      title: '日期',
      dataIndex: 'factDate',
      key: 'factDate',
      width: 110
    },
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      width: 160
    },
    {
      title: '商品',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      render: (value, point) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 240 }}>
          <Text ellipsis={{ tooltip: value }}>{value}</Text>
          <Text type="secondary">{point.noonProductCode}</Text>
        </Space>
      )
    },
    {
      title: '类型',
      key: 'type',
      width: 120,
      render: (_value, point) => (
        <Space size={4} wrap>
          {point.isSelf ? <Tag color="blue">本品</Tag> : <Tag>竞品</Tag>}
          {point.isSponsored ? <Tag color="purple">广告</Tag> : null}
        </Space>
      )
    },
    {
      title: '排名',
      key: 'rank',
      width: 112,
      render: (_value, point) =>
        point.rankStatus === 'ranked' ? (
          <Text strong>第 {point.rankNo} 名</Text>
        ) : (
          <Tag icon={<ClockCircleOutlined />}>未进前30</Tag>
        )
    },
    {
      title: '价格',
      key: 'price',
      width: 110,
      render: (_value, point) =>
        point.priceAmount ? `${point.priceAmount} ${point.currencyCode || ''}` : product.siteCode === 'SA' ? 'SAR' : 'AED'
    }
  ]
}
