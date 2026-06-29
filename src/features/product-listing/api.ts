import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  ProductListingDraftPayload,
  ProductListingDraftView,
  ProductListingRealRunCommand,
  ProductListingTaskView
} from './types'

export function saveProductListingDraft(payload: ProductListingDraftPayload) {
  return postJson<ProductListingDraftView>('/api/product-listing/drafts', payload, '保存上架草稿失败')
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
