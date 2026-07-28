import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import type { CompetitorWatchProduct } from '../types'
import {
  candidateStatusForKeyword,
  getCandidatesForKeyword,
  getLatestRankPoint,
  isLatestFetchResultCandidate,
  isOwnStoreCandidate,
  sortCandidatesByRank
} from './candidateModel'
import { buildHistoryRankRows } from './rankHistoryModel'

const product = {
  title: 'Own product',
  selfNoonProductCode: 'ZSELF',
  latestRunId: 'run-current',
  keywords: [{ id: 'keyword-1', keyword: 'phone case' }],
  candidates: [
    {
      id: 'candidate-late',
      noonProductCode: 'ZLATE',
      title: 'Later result',
      latestRankNo: 40,
      keywordReviewStatus: { 'keyword-1': 'confirmed' },
      keywordLastSeenRunIds: { 'keyword-1': 'run-current' }
    },
    {
      id: 'candidate-first',
      noonProductCode: 'zfirst',
      title: 'First result',
      latestRankNo: 2,
      keywordReviewStatus: { 'keyword-1': 'pending' },
      keywordLastSeenRunIds: { 'keyword-1': 'run-current' }
    },
    {
      id: 'candidate-old',
      noonProductCode: 'ZOLD',
      title: 'Old result',
      keywordReviewStatus: { 'keyword-1': 'pending' },
      keywordLastSeenRunIds: { 'keyword-1': 'run-old' }
    },
    {
      id: 'candidate-ignored',
      noonProductCode: 'ZIGNORE',
      title: 'Ignored result',
      keywordReviewStatus: { 'keyword-1': 'ignored' }
    }
  ],
  rankPoints: [
    {
      id: 'rank-first',
      keywordId: 'keyword-1',
      noonProductCode: 'ZFIRST',
      factDate: '2026-07-28',
      rankStatus: 'ranked',
      rankNo: 3,
      isSelf: false
    },
    {
      id: 'rank-late',
      keywordId: 'keyword-1',
      noonProductCode: 'ZLATE',
      factDate: '2026-07-28',
      rankStatus: 'ranked',
      rankNo: 22,
      isSelf: false
    }
  ]
} as unknown as CompetitorWatchProduct

const keyword = product.keywords[0]
assert.deepEqual(
  getCandidatesForKeyword(product, keyword).map((candidate) => candidate.id),
  ['candidate-late', 'candidate-first', 'candidate-old']
)
assert.equal(
  candidateStatusForKeyword(product.candidates[3], keyword.id),
  'ignored'
)
assert.equal(
  isLatestFetchResultCandidate(
    product,
    keyword.id,
    product.candidates[1],
    true
  ),
  true
)
assert.equal(
  isLatestFetchResultCandidate(
    product,
    keyword.id,
    product.candidates[2],
    true
  ),
  false
)
assert.deepEqual(
  sortCandidatesByRank(product, keyword.id, product.candidates.slice(0, 2)).map(
    (candidate) => candidate.id
  ),
  ['candidate-first', 'candidate-late']
)
assert.equal(
  getLatestRankPoint(product, keyword.id, 'zfirst')?.id,
  'rank-first'
)
assert.equal(
  isOwnStoreCandidate(
    product,
    product.candidates[0],
    undefined,
    new Set(['ZLATE'])
  ),
  true
)
assert.equal(
  buildHistoryRankRows(product, product.rankPoints, keyword)[0].keyword,
  'phone case'
)

const pageSource = readFileSync(
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'utf8'
)
assert.doesNotMatch(
  pageSource,
  /function (?:ProductDetail|KeywordBoard|CandidateCard|rankColumns)\b/
)
