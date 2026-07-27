import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  ProductListingAiListingCommand,
  ProductListingAiListingView,
  ProductListingCreateOutcomeVerificationView,
  ProductListingFieldValidationView,
  ProductListingDraftPayload,
  ProductListingDraftView,
  ProductListingKeywordSuggestionView,
  ProductListingRealRunCommand,
  ProductListingTaskView,
  ProductListingWorkflowView
} from './types'

export function saveProductListingDraft(payload: ProductListingDraftPayload) {
  const { draft, keywordSuggestions } = splitKeywordSuggestions(payload)
  return postJson<ProductListingDraftView>(
    '/api/product-listing/drafts/with-keyword-suggestions',
    { draft, keywordSuggestions },
    '保存上架草稿和关键词建议失败'
  ).then((view) => mergeKeywordSuggestions(view, keywordSuggestions))
}

export function generateProductListingAiListing(payload: ProductListingAiListingCommand) {
  return postJson<ProductListingAiListingView>(
    '/api/product-listing/ai/noon-listing',
    { ...payload, draft: splitKeywordSuggestions(payload.draft).draft },
    '商品上架 AI 整合失败'
  )
}

export function fetchProductListingDrafts(storeCode: string, limit = 30) {
  const params = new URLSearchParams({
    storeCode,
    limit: String(limit),
    includeWorkflow: 'true'
  })
  return getJson<ProductListingDraftView[]>(`/api/product-listing/drafts?${params.toString()}`, '读取上架草稿失败')
}

export async function fetchActiveProductListingDraft(
  storeCode: string,
  sourceType: string,
  sourceRefId: number
) {
  const params = new URLSearchParams({
    storeCode,
    sourceType,
    sourceRefId: String(sourceRefId)
  })
  const drafts = await getJson<ProductListingDraftView[]>(
    `/api/product-listing/drafts/by-source?${params.toString()}`,
    '按来源读取活动上架草稿失败'
  )
  return drafts[0]
}

export async function fetchProductListingDraft(draftId: number) {
  const [draft, suggestions] = await Promise.all([
    getJson<ProductListingDraftView>(`/api/product-listing/drafts/${draftId}`, '读取上架草稿失败'),
    getJson<ProductListingKeywordSuggestionView>(
      `/api/product-listing/drafts/${draftId}/keyword-suggestions`,
      '读取 Listing 关键词建议失败'
    )
  ])
  return mergeKeywordSuggestions(draft, suggestionLists(suggestions))
}

export function fetchProductListingWorkflow(draftId: number) {
  return getJson<ProductListingWorkflowView>(
    `/api/product-listing/drafts/${draftId}/workflow`,
    '读取上架流程失败'
  )
}

export function validateProductListingFields(payload: Partial<ProductListingDraftPayload>) {
  const { draft } = splitKeywordSuggestions(payload as ProductListingDraftPayload)
  return postJson<ProductListingFieldValidationView>(
    '/api/product-listing/field-validation',
    draft,
    '校验 PSKU / Barcode 重复失败'
  )
}

export function reauthenticateProductListingStore(
  taskId: number,
  signal?: AbortSignal
) {
  return postWithoutBody<ProductListingWorkflowView>(
    `/api/product-listing/tasks/${taskId}/reauthenticate`,
    '重新授权 Noon 失败',
    { signal }
  )
}

export function fetchProductListingReauthenticationStatus(
  taskId: number,
  signal?: AbortSignal
) {
  return getJson<ProductListingWorkflowView>(
    `/api/product-listing/tasks/${taskId}/reauthentication-status`,
    '查询 Noon 重新授权状态失败',
    { signal }
  )
}

export function submitProductListingDryRun(payload: { draftId: number; storeCode: string }) {
  return postJson<ProductListingTaskView>('/api/product-listing/dry-run', payload, '提交上架 dry-run 失败')
}

export function confirmProductListingRealRun(taskId: number, payload: ProductListingRealRunCommand) {
  return postJson<ProductListingTaskView>(
    `/api/product-listing/tasks/${taskId}/confirm-real-run`,
    payload,
    '确认真实上架失败'
  )
}

export function reopenProductListingReview(taskId: number) {
  return postJson<ProductListingWorkflowView>(
    `/api/product-listing/tasks/${taskId}/reopen-review`,
    {},
    '返回修改失败'
  )
}

export function verifyProductListingRealRunReadBack(taskId: number) {
  return postJson<ProductListingTaskView>(
    `/api/product-listing/tasks/${taskId}/verify-readback`,
    {},
    '重新回读校验失败'
  )
}

export function continueProductListingRealRunAfterCreate(taskId: number) {
  return postJson<ProductListingTaskView>(
    `/api/product-listing/tasks/${taskId}/continue-after-create`,
    {},
    '继续写后续步骤失败'
  )
}

export function verifyProductListingCreateOutcome(taskId: number) {
  return postJson<ProductListingCreateOutcomeVerificationView>(
    `/api/product-listing/tasks/${taskId}/verify-create-outcome`,
    {},
    '核对 Noon 创建结果失败'
  )
}

export function confirmProductListingNotCreated(taskId: number) {
  return postWithoutBody<ProductListingWorkflowView>(
    `/api/product-listing/tasks/${taskId}/confirm-not-created`,
    '确认 Noon 未创建商品失败'
  )
}

export function replayProductListingProjection(taskId: number) {
  return postJson<ProductListingTaskView>(
    `/api/product-listing/tasks/${taskId}/replay-projection`,
    {},
    '恢复本地商品资料失败'
  )
}

export function fetchProductListingTask(taskId: number) {
  return getJson<ProductListingTaskView>(`/api/product-listing/tasks/${taskId}`, '读取上架 dry-run 任务失败')
}

async function getJson<TResponse>(
  url: string,
  fallback: string,
  init?: RequestInit
) {
  return parseApiResponse<TResponse>(await apiFetch(url, init), fallback)
}

async function postJson<TResponse>(url: string, body: unknown, fallback: string) {
  return parseApiResponse<TResponse>(
    await apiFetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    }),
    fallback
  )
}

async function postWithoutBody<TResponse>(
  url: string,
  fallback: string,
  init?: RequestInit
) {
  return parseApiResponse<TResponse>(
    await apiFetch(url, { ...init, method: 'POST' }),
    fallback
  )
}

function splitKeywordSuggestions(payload: ProductListingDraftPayload) {
  const {
    listingKeywordSuggestionsEn = [],
    listingKeywordSuggestionsAr = [],
    ...draft
  } = payload
  return {
    draft,
    keywordSuggestions: {
      english: listingKeywordSuggestionsEn,
      arabic: listingKeywordSuggestionsAr
    }
  }
}

function suggestionLists(view: ProductListingKeywordSuggestionView) {
  return {
    english: view.items
      .filter((item) => item.locale.toLowerCase().startsWith('en'))
      .map((item) => item.keyword),
    arabic: view.items
      .filter((item) => item.locale.toLowerCase().startsWith('ar'))
      .map((item) => item.keyword)
  }
}

function mergeKeywordSuggestions(
  view: ProductListingDraftView,
  suggestions: { english: string[]; arabic: string[] }
): ProductListingDraftView {
  return {
    ...view,
    draft: view.draft
      ? {
          ...view.draft,
          listingKeywordSuggestionsEn: suggestions.english,
          listingKeywordSuggestionsAr: suggestions.arabic
        }
      : view.draft
  }
}
