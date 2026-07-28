import type { ProductSelectionSourceCollection } from '../source-collection/types'
import type { ManualSelectionCompetitor } from './types'

export function sourceHostFromUrl(url?: string) {
  if (!url) {
    return ''
  }
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').trim().toUpperCase()
  if (normalized.includes('NAE') || normalized.endsWith('-AE')) {
    return 'AE'
  }
  if (normalized.includes('NSA') || normalized.endsWith('-SA')) {
    return 'SA'
  }
  return undefined
}

export type ManualSelectionTabKey = 'collections' | 'analysis'
export type ManualSelectionCompetitorFocus = { kind: 'link' | 'collection'; id: string }

const MANUAL_SELECTION_TAB_QUERY_KEY = 'manualSelectionTab'

export function initialManualSelectionTabKey(): ManualSelectionTabKey {
  if (typeof window === 'undefined') {
    return 'collections'
  }
  const tabKey = new URLSearchParams(window.location.search).get(MANUAL_SELECTION_TAB_QUERY_KEY)
  return tabKey === 'analysis' ? 'analysis' : 'collections'
}

export function syncManualSelectionTabQuery(tabKey: ManualSelectionTabKey) {
  if (typeof window === 'undefined') {
    return
  }
  const nextUrl = new URL(window.location.href)
  if (tabKey === 'analysis') {
    nextUrl.searchParams.set(MANUAL_SELECTION_TAB_QUERY_KEY, 'analysis')
  } else {
    nextUrl.searchParams.delete(MANUAL_SELECTION_TAB_QUERY_KEY)
  }
  window.history.replaceState(window.history.state, '', nextUrl)
}

export function titleFromCompetitorUrl(url?: string) {
  if (!url) {
    return ''
  }
  try {
    const parsedUrl = new URL(url)
    const ignoredPathSegments = new Set([
      'ae-en',
      'ae-ar',
      'amazon',
      'dp',
      'egypt-ar',
      'egypt-en',
      'gp',
      'p',
      'product',
      'saudi-ar',
      'saudi-en',
      'uae-ar',
      'uae-en'
    ])
    const pathSegments = parsedUrl.pathname
      .split('/')
      .map((item) => {
        try {
          return decodeURIComponent(item).trim()
        } catch {
          return item.trim()
        }
      })
      .filter(Boolean)
    const readableSegments = pathSegments
      .filter((item) => /[a-zA-Z\u4e00-\u9fa5]/.test(item))
      .filter((item) => !ignoredPathSegments.has(item.toLowerCase()))
      .sort((left, right) => right.length - left.length)
    const bestSegment = readableSegments[0] || pathSegments[0] || parsedUrl.host
    return bestSegment
      .replace(/[-_+]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[-_+/?#=&]+/g, ' ')
      .trim()
  }
}

export function buildFetchedCompetitor(competitor: ManualSelectionCompetitor): ManualSelectionCompetitor {
  const host = sourceHostFromUrl(competitor.url)
  if (!competitor.url || !host) {
    return {
      ...competitor,
      fetchStatus: 'failed',
      fetchMessage: '链接格式无法识别'
    }
  }
  return {
    ...competitor,
    fetchStatus: 'success',
    fetchedSourceHost: competitor.fetchedSourceHost || host,
    fetchedTitle: competitor.fetchedTitle || titleFromCompetitorUrl(competitor.url),
    fetchedAt: competitor.fetchedAt || new Date().toISOString(),
    fetchMessage: competitor.fetchMessage || '竞品内容已拉取'
  }
}

export function defaultAnalysisProjectName(records: ProductSelectionSourceCollection[]) {
  const firstRecord = records[0]
  const firstTitle = firstRecord?.sourceTitleCn || firstRecord?.selectedText || firstRecord?.sourceTitle || ''
  if (!firstTitle) {
    return '未命名选品项目'
  }
  if (records.length <= 1) {
    return firstTitle.slice(0, 60)
  }
  return `${firstTitle.slice(0, 48)} 等${records.length}个素材`
}

