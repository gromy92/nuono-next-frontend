import { normalizeNoonImageUrl } from '../../product-baseline'
import type {
  CompetitorCandidateSource,
  CompetitorDashboardChangeType,
  CompetitorDashboardIssueType,
  CompetitorReviewStatus,
  NoonProductCodeType,
  RankStatus,
  SearchRunStatus
} from '../types'

const DEFAULT_RANK_SCAN_DEPTH = 100
const EMPTY_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

export function imageUrlValue(value: unknown) {
  return normalizeNoonImageUrl(value) || EMPTY_IMAGE
}

export function optionalImageUrlValue(value: unknown) {
  return normalizeNoonImageUrl(value) || undefined
}

export function appendSearchParam(params: URLSearchParams, key: string, value?: string) {
  const normalized = value?.trim()
  if (normalized) {
    params.set(key, normalized)
  }
}

export function appendBooleanParam(params: URLSearchParams, key: string, value?: boolean) {
  if (value) {
    params.set(key, 'true')
  }
}

export function normalizeActiveStatus(value: unknown): 'active' | 'paused' {
  return String(value || 'ACTIVE').toUpperCase() === 'PAUSED' ? 'paused' : 'active'
}

export function normalizeRunStatus(value: unknown): SearchRunStatus {
  const normalized = String(value || 'FAILED').toUpperCase()
  if (normalized === 'SUCCEEDED') {
    return 'succeeded'
  }
  if (normalized === 'PARTIAL_FAILED') {
    return 'partial_failed'
  }
  if (normalized === 'RUNNING' || normalized === 'QUEUED') {
    return 'running'
  }
  if (normalized === 'CAPTCHA_REQUIRED') {
    return 'captcha_required'
  }
  if (normalized === 'PARSE_FAILED') {
    return 'parse_failed'
  }
  if (normalized === 'PROVIDER_UNAVAILABLE') {
    return 'provider_unavailable'
  }
  return 'failed'
}

export function normalizeRankStatus(value: unknown): RankStatus {
  const normalized = String(value || 'NOT_IN_SCAN_DEPTH').toUpperCase()
  if (normalized === 'RANKED') {
    return 'ranked'
  }
  if (normalized === 'NOT_IN_SCAN_DEPTH' || normalized === 'NOT_IN_TOP_20') {
    return 'not_in_scan_depth'
  }
  return 'not_in_scan_depth'
}

export function normalizeRankScanDepth(value: unknown, rankStatus: RankStatus) {
  const numericValue = typeof value === 'number' ? value : Number(value)
  const normalized = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : DEFAULT_RANK_SCAN_DEPTH
  return rankStatus === 'ranked' ? normalized : Math.max(DEFAULT_RANK_SCAN_DEPTH, normalized)
}

export function normalizeRankChannel(value: unknown, sponsoredFallback?: unknown): 'organic' | 'sponsored' {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'SPONSORED') {
    return 'sponsored'
  }
  return sponsoredFallback ? 'sponsored' : 'organic'
}

export function normalizeDashboardIssueType(value: unknown): CompetitorDashboardIssueType | undefined {
  const normalized = String(value || '').toUpperCase()
  if (
    normalized === 'PENDING_CANDIDATE' ||
    normalized === 'MONITORING_SHORTAGE' ||
    normalized === 'RANK_ANOMALY' ||
    normalized === 'COMPETITOR_CHANGE'
  ) {
    return normalized
  }
  return undefined
}

export function normalizeDashboardChangeType(value: unknown): CompetitorDashboardChangeType | undefined {
  const normalized = String(value || '').toUpperCase()
  if (
    normalized === 'PRICE' ||
    normalized === 'RATING' ||
    normalized === 'REVIEW_COUNT' ||
    normalized === 'IMAGE' ||
    normalized === 'TITLE' ||
    normalized === 'BRAND'
  ) {
    return normalized
  }
  return undefined
}

export function normalizeDashboardDays(value: unknown): 1 | 7 | 14 | 30 {
  const days = typeof value === 'number' && Number.isFinite(value) ? value : 7
  if (days === 1) {
    return 1
  }
  if (days <= 7) {
    return 7
  }
  if (days <= 14) {
    return 14
  }
  return 30
}

export function dashboardIssueLabel(value: unknown) {
  const issueType = normalizeDashboardIssueType(value)
  if (issueType === 'PENDING_CANDIDATE') return '待确认候选'
  if (issueType === 'MONITORING_SHORTAGE') return '监控不足'
  if (issueType === 'RANK_ANOMALY') return '排名异常'
  if (issueType === 'COMPETITOR_CHANGE') return '竞品详情变化'
  return '待处理'
}

export function dashboardChangeLabel(value: unknown) {
  const changeType = normalizeDashboardChangeType(value)
  if (changeType === 'PRICE') return '价格变化'
  if (changeType === 'RATING') return '评分变化'
  if (changeType === 'REVIEW_COUNT') return '评论数变化'
  if (changeType === 'IMAGE') return '图片变化'
  if (changeType === 'TITLE') return '标题变化'
  if (changeType === 'BRAND') return '品牌变化'
  return '竞品改动'
}

export function normalizeReviewStatus(value: unknown): CompetitorReviewStatus {
  const normalized = String(value || 'PENDING').toUpperCase()
  if (normalized === 'CONFIRMED') {
    return 'confirmed'
  }
  if (normalized === 'IGNORED') {
    return 'ignored'
  }
  return 'pending'
}

export function normalizeRelationStatus(value: unknown): CompetitorReviewStatus {
  const normalized = String(value || 'DISCOVERED').toUpperCase()
  if (normalized === 'CONFIRMED') {
    return 'confirmed'
  }
  if (normalized === 'IGNORED') {
    return 'ignored'
  }
  return 'pending'
}

export function normalizeSourceType(value: unknown): CompetitorCandidateSource {
  return String(value || 'SEARCH_DISCOVERY').toUpperCase() === 'MANUAL_ADD' ? 'manual_add' : 'search_discovery'
}

export function normalizeCodeType(value: unknown, noonProductCode: string): NoonProductCodeType {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'Z_CODE' || noonProductCode.startsWith('Z')) {
    return 'Z_CODE'
  }
  return 'N_CODE'
}

export function stringValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value).trim()
}

export function normalizeKeywordNorm(value: unknown) {
  return stringValue(value).toLowerCase().replace(/\s+/g, ' ')
}

export function firstText(...values: unknown[]) {
  return values.map(stringValue).find(Boolean) || ''
}

export function idValue(value: unknown) {
  return stringValue(value)
}

export function optionalId(value: unknown) {
  const id = idValue(value)
  return id || undefined
}

export function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function optionalNumberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export function formatDateTime(value: unknown) {
  const text = stringValue(value)
  if (!text) {
    return ''
  }
  return text.replace('T', ' ').slice(0, 16)
}

export function formatFactDate(value: unknown) {
  const text = formatDateTime(value)
  return text ? text.slice(0, 10) : ''
}

export function buildNoonProductUrl(noonProductCode: string) {
  return noonProductCode ? `https://www.noon.com/p/${noonProductCode}/p/` : 'https://www.noon.com/'
}
