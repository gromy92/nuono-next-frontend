import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Checkbox, Empty, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type {
  CompetitorCandidate,
  CompetitorKeyword,
  CompetitorWatchProduct
} from '../types'
import { CandidateCard } from './CandidateCard'
import {
  candidateStatusForKeyword,
  getLatestRankPoint,
  isLatestFetchResultCandidate,
  isOwnStoreCandidate,
  sortCandidatesByRank
} from './candidateModel'

const { Text } = Typography

export function KeywordBoard({
  product,
  keyword,
  candidates,
  ownedNoonProductCodes,
  onCandidateStatusChange,
  onCandidateBatchStatusChange,
  actionLoading
}: {
  product: CompetitorWatchProduct
  keyword?: CompetitorKeyword
  candidates: CompetitorCandidate[]
  ownedNoonProductCodes: ReadonlySet<string>
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
  actionLoading: string | null
}) {
  const hasKeywordRunEvidence = useMemo(
    () =>
      Boolean(
        keyword &&
          candidates.some((candidate) => candidate.keywordLastSeenRunIds?.[keyword.id])
      ),
    [candidates, keyword]
  )
  const resultCandidates = useMemo(
    () =>
      keyword
        ? sortCandidatesByRank(
            product,
            keyword.id,
            candidates.filter((candidate) =>
              isLatestFetchResultCandidate(
                product,
                keyword.id,
                candidate,
                hasKeywordRunEvidence
              )
            )
          )
        : [],
    [candidates, hasKeywordRunEvidence, keyword, product]
  )
  const pendingCandidates = useMemo(
    () =>
      keyword
        ? resultCandidates.filter(
            (candidate) =>
              candidateStatusForKeyword(candidate, keyword.id) === 'pending'
          )
        : [],
    [keyword, resultCandidates]
  )
  const confirmedCandidates = useMemo(
    () =>
      keyword
        ? sortCandidatesByRank(
            product,
            keyword.id,
            candidates.filter(
              (candidate) =>
                candidateStatusForKeyword(candidate, keyword.id) === 'confirmed'
            )
          )
        : [],
    [candidates, keyword, product]
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const pendingIds = useMemo(
    () => pendingCandidates.map((candidate) => candidate.id),
    [pendingCandidates]
  )
  const pendingIdKey = pendingIds.join('|')
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const batchLoading = actionLoading?.startsWith('candidate-batch-') ?? false
  const allSelected =
    pendingCandidates.length > 0 && selectedIds.length === pendingCandidates.length

  useEffect(() => setSelectedIds([]), [keyword?.id])
  useEffect(() => {
    const currentPendingIds = new Set(pendingIds)
    setSelectedIds((current) =>
      current.filter((candidateId) => currentPendingIds.has(candidateId))
    )
  }, [pendingIdKey])

  if (!keyword) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有维护关键词" />
  }

  const toggleCandidate = (candidateId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? current.includes(candidateId)
          ? current
          : [...current, candidateId]
        : current.filter((item) => item !== candidateId)
    )
  }
  const changeBatchStatus = (status: 'confirmed' | 'ignored') => {
    if (selectedIds.length) {
      onCandidateBatchStatusChange(keyword.id, selectedIds, status)
    }
  }

  return (
    <div className="competitor-analysis-keyword-board" data-testid="competitor-keyword-board">
      {pendingCandidates.length ? (
        <div className="competitor-analysis-board-pool">
          <div className="competitor-analysis-board-pool-header">
            <div className="competitor-analysis-board-pool-title">
              <Text strong>待选池 ({pendingCandidates.length})</Text>
              <Text type="secondary">运营可加入或忽略本次抓取的新候选。</Text>
            </div>
            <Space wrap size={8} className="competitor-analysis-board-pool-actions">
              <Checkbox
                checked={allSelected}
                indeterminate={selectedIds.length > 0 && !allSelected}
                onChange={(event) =>
                  setSelectedIds(event.target.checked ? pendingIds : [])
                }
              >
                全选
              </Checkbox>
              <Button
                size="small"
                className="competitor-analysis-batch-confirm-button"
                icon={<CheckOutlined />}
                disabled={!selectedIds.length || batchLoading}
                loading={actionLoading === `candidate-batch-confirmed-${keyword.id}`}
                onClick={() => changeBatchStatus('confirmed')}
              >
                {allSelected ? '全选加入' : '加入选中'}
              </Button>
              <Button
                size="small"
                className="competitor-analysis-batch-ignore-button"
                icon={<CloseOutlined />}
                disabled={!selectedIds.length || batchLoading}
                loading={actionLoading === `candidate-batch-ignored-${keyword.id}`}
                onClick={() => changeBatchStatus('ignored')}
              >
                {allSelected ? '全选忽略' : '忽略选中'}
              </Button>
            </Space>
          </div>
          <CandidateGallery
            candidates={pendingCandidates}
            keyword={keyword}
            product={product}
            ownedNoonProductCodes={ownedNoonProductCodes}
            selectable
            selectedCandidateIds={selectedIdSet}
            emptyText="当前关键词还没有抓取结果"
            onCandidateSelectionChange={toggleCandidate}
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
          ownedNoonProductCodes={ownedNoonProductCodes}
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
  ownedNoonProductCodes,
  readonly,
  selectable,
  selectedCandidateIds,
  emptyText,
  onCandidateSelectionChange,
  onCandidateStatusChange,
  actionLoading
}: {
  product: CompetitorWatchProduct
  keyword: CompetitorKeyword
  candidates: CompetitorCandidate[]
  ownedNoonProductCodes: ReadonlySet<string>
  readonly?: boolean
  selectable?: boolean
  selectedCandidateIds?: Set<string>
  emptyText: string
  onCandidateSelectionChange?: (candidateId: string, checked: boolean) => void
  onCandidateStatusChange: (
    keywordId: string,
    candidateId: string,
    status: 'confirmed' | 'ignored' | 'removed'
  ) => void
  actionLoading: string | null
}) {
  if (!candidates.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
  }

  return (
    <div className="competitor-analysis-candidate-grid">
      {candidates.map((candidate) => {
        const rankPoint = getLatestRankPoint(
          product,
          keyword.id,
          candidate.noonProductCode
        )
        return (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            readonly={readonly}
            selectable={selectable}
            selected={selectedCandidateIds?.has(candidate.id) ?? false}
            keywordId={keyword.id}
            reviewStatus={candidateStatusForKeyword(candidate, keyword.id)}
            rankPoint={rankPoint}
            isOwnProduct={isOwnStoreCandidate(
              product,
              candidate,
              rankPoint,
              ownedNoonProductCodes
            )}
            onCandidateSelectionChange={onCandidateSelectionChange}
            onCandidateStatusChange={onCandidateStatusChange}
            actionLoading={actionLoading}
          />
        )
      })}
    </div>
  )
}
