import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  ProductListingAiListingCommand,
  ProductListingAiListingView,
  ProductListingFieldValidationView,
  ProductListingDraftPayload,
  ProductListingDraftView,
  ProductListingRealRunCommand,
  ProductListingTaskView
} from './types'

export function saveProductListingDraft(payload: ProductListingDraftPayload) {
  return postJson<ProductListingDraftView>('/api/product-listing/drafts', payload, '保存上架草稿失败')
}

export function generateProductListingAiListing(payload: ProductListingAiListingCommand) {
  return postJson<ProductListingAiListingView>(
    '/api/product-listing/ai/noon-listing',
    payload,
    '商品上架 AI 整合失败'
  )
}

export function fetchProductListingDrafts(storeCode: string, limit = 30) {
  const params = new URLSearchParams({ storeCode, limit: String(limit) })
  return getJson<ProductListingDraftView[]>(`/api/product-listing/drafts?${params.toString()}`, '读取上架草稿失败')
}

export function fetchProductListingDraft(draftId: number) {
  return getJson<ProductListingDraftView>(`/api/product-listing/drafts/${draftId}`, '读取上架草稿失败')
}

export function validateProductListingFields(payload: Partial<ProductListingDraftPayload>) {
  return postJson<ProductListingFieldValidationView>(
    '/api/product-listing/field-validation',
    payload,
    '校验 PSKU / Barcode 重复失败'
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

export function fetchProductListingTask(taskId: number) {
  return getJson<ProductListingTaskView>(`/api/product-listing/tasks/${taskId}`, '读取上架 dry-run 任务失败')
}

export function fetchRecentProductListingTasks(storeCode: string, limit = 20) {
  const params = new URLSearchParams({ storeCode, limit: String(limit) })
  return getJson<ProductListingTaskView[]>(`/api/product-listing/tasks/recent?${params.toString()}`, '读取上架任务失败')
}

async function getJson<TResponse>(url: string, fallback: string) {
  return parseApiResponse<TResponse>(await apiFetch(url), fallback)
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
