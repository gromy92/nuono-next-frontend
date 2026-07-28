import { apiFetch, readApiErrorMessage } from '../../shared/api'
import type {
  ManualSelectionGroupProfitEstimateSnapshot,
  ManualSelectionGroupView
} from './types'

export function loadManualSelectionGroup(groupId: string): Promise<ManualSelectionGroupView> {
  return parseSelectionAnalysisResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}`)
  )
}

export function loadManualSelectionGroupProfitEstimate(
  groupId: string
): Promise<ManualSelectionGroupProfitEstimateSnapshot> {
  return parseSelectionAnalysisResponse<ManualSelectionGroupProfitEstimateSnapshot>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/profit-estimate`)
  )
}

export function saveManualSelectionGroupProfitEstimate(
  groupId: string,
  values: {
    currencyCode?: string
    profitAmount?: number
    profitMargin?: number
    snapshot?: Record<string, unknown>
  }
): Promise<ManualSelectionGroupProfitEstimateSnapshot> {
  return parseSelectionAnalysisResponse<ManualSelectionGroupProfitEstimateSnapshot>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/profit-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    })
  )
}

async function parseSelectionAnalysisResponse<TResponse>(
  responsePromise: Promise<Response>
): Promise<TResponse> {
  const response = await responsePromise
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Request failed: ${response.status}`))
  }
  const payload = await response.json().catch(() => null)
  return payload as TResponse
}
