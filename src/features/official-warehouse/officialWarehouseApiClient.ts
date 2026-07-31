import { ApiError, apiFetch, normalizeError, parseApiResponse } from '../../shared/api'
import type {
  CreateOfficialWarehouseAsnPayload,
  OfficialWarehouseAsn,
  OfficialWarehouseAsnInboundDetail,
  OfficialWarehouseAsnListSyncResult,
  OfficialWarehouseAsnValidation,
  OfficialWarehouseProductCandidate,
  OfficialWarehouseShippingBatchCandidate
} from './api'
import type {
  CorrectOfficialWarehouseAppointmentPayload,
  NoonHttpCallLog,
  OfficialWarehouseAppointment,
  OfficialWarehouseAppointmentAvailability,
  UpsertOfficialWarehouseAppointmentPayload
} from './officialWarehouseAppointmentTypes'
import type { OfficialWarehouseBatchProductSummary } from './officialWarehouseBatchSummaryTypes'

type AsnFilters = {
  storeCode?: string
  siteCode?: string
  keyword?: string
}

type AppointmentFilters = {
  storeCode?: string
  siteCode?: string
  status?: string
  keyword?: string
}

type CandidateFilters = {
  storeCode: string
  siteCode: string
  keyword?: string
  shippingBatchIds?: string[]
  partnerSkus?: string[]
}

export async function loadOfficialWarehouseAsns(filters: AsnFilters = {}) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns${suffix}`)
  return parseApiResponse<OfficialWarehouseAsn[]>(response, '读取 Noon 官方仓 ASN 失败')
}

export async function loadOfficialWarehouseAsn(asnId: string) {
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}`)
  return parseApiResponse<OfficialWarehouseAsn>(response, '读取 Noon 官方仓 ASN 详情失败')
}

export async function loadOfficialWarehouseAsnInboundDetail(asnId: string) {
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/inbound-detail`)
  return parseApiResponse<OfficialWarehouseAsnInboundDetail>(response, '读取 ASN 商品入仓详情失败')
}

export async function syncOfficialWarehouseNoonAsnList(filters: { storeCode: string; siteCode: string }) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns/sync-noon-list?${params.toString()}`, {
    method: 'POST'
  })
  return parseApiResponse<OfficialWarehouseAsnListSyncResult>(response, '同步 Noon ASN 列表失败')
}

export async function loadOfficialWarehouseCandidates(filters: CandidateFilters) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  filters.shippingBatchIds?.forEach((id) => appendParam(params, 'shippingBatchIds', id))
  filters.partnerSkus?.forEach((psku) => appendParam(params, 'partnerSkus', psku))
  const response = await apiFetch(`/api/warehouse/official-warehouse/product-candidates?${params.toString()}`)
  return parseApiResponse<OfficialWarehouseProductCandidate[]>(response, '读取可创建 ASN 商品失败')
}

export async function loadOfficialWarehouseShippingBatches(filters: CandidateFilters) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  const response = await apiFetch(`/api/warehouse/official-warehouse/shipping-batches?${params.toString()}`)
  return parseApiResponse<OfficialWarehouseShippingBatchCandidate[]>(response, '读取物流批次失败')
}

export async function loadOfficialWarehouseBatchProductSummary(
  filters: Pick<CandidateFilters, 'storeCode' | 'siteCode' | 'shippingBatchIds'>
) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  filters.shippingBatchIds?.forEach((id) => appendParam(params, 'shippingBatchIds', id))
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/shipping-batches/product-summary?${params.toString()}`
  )
  return parseApiResponse<OfficialWarehouseBatchProductSummary>(response, '读取物流批次商品汇总失败')
}

export async function createOfficialWarehouseAsn(payload: CreateOfficialWarehouseAsnPayload) {
  return postAsn('/api/warehouse/official-warehouse/asns', payload, '创建 Noon 官方仓 ASN 失败')
}

export async function validateOfficialWarehouseAsn(payload: CreateOfficialWarehouseAsnPayload) {
  const response = await apiFetch('/api/warehouse/official-warehouse/asns/validate', jsonPost(payload))
  return parseApiResponse<OfficialWarehouseAsnValidation>(response, '校验 Noon 官方仓 ASN 商品失败')
}

export async function loadOfficialWarehouseNoonCalls(asnId: string) {
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/noon-calls`)
  return parseApiResponse<NoonHttpCallLog[]>(response, '读取 Noon 调用日志失败')
}

export async function loadOfficialWarehouseAppointments(filters: AppointmentFilters = {}) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'status', filters.status)
  appendParam(params, 'keyword', filters.keyword)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/warehouse/official-warehouse/appointments${suffix}`)
  return parseApiResponse<OfficialWarehouseAppointment[]>(response, '读取约仓历史失败')
}

export async function queryOfficialWarehouseAppointmentAvailability(
  asnId: string,
  payload: UpsertOfficialWarehouseAppointmentPayload
) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/appointment/availability`,
    jsonPost(payload)
  )
  return parseApiResponse<OfficialWarehouseAppointmentAvailability[]>(response, '查询约仓仓位失败')
}

export async function upsertOfficialWarehouseAppointment(
  asnId: string,
  payload: UpsertOfficialWarehouseAppointmentPayload
) {
  return postAppointment(asnId, 'appointment', payload, '提交自动约仓失败')
}

export async function submitManualOfficialWarehouseAppointment(
  asnId: string,
  payload: UpsertOfficialWarehouseAppointmentPayload
) {
  return postAppointment(asnId, 'appointment/manual', payload, '手动约仓失败')
}

export async function runOfficialWarehouseAppointmentOnce(appointmentId: string) {
  return postAppointmentAction(appointmentId, 'run-once', '执行自动约仓失败')
}

export async function cancelOfficialWarehouseAppointment(appointmentId: string) {
  return postAppointmentAction(appointmentId, 'cancel', '取消自动约仓失败')
}

export async function correctOfficialWarehouseAppointment(
  appointmentId: string,
  payload: CorrectOfficialWarehouseAppointmentPayload
) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/appointments/${encodeURIComponent(appointmentId)}/correction`,
    jsonPost(payload)
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, '订正约仓记录失败')
}

export async function loadOfficialWarehouseAppointmentNoonCalls(appointmentId: string) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/appointments/${encodeURIComponent(appointmentId)}/noon-calls`
  )
  return parseApiResponse<NoonHttpCallLog[]>(response, '读取约仓 Noon 调用日志失败')
}

export function officialWarehouseError(error: unknown, fallback: string) {
  return normalizeError(error, fallback)
}

export function officialWarehouseProblem(error: unknown) {
  return error instanceof ApiError ? error.problem : undefined
}

async function postAsn(path: string, payload: CreateOfficialWarehouseAsnPayload, fallback: string) {
  const response = await apiFetch(path, jsonPost(payload))
  return parseApiResponse<OfficialWarehouseAsn>(response, fallback)
}

async function postAppointment(
  asnId: string,
  path: string,
  payload: UpsertOfficialWarehouseAppointmentPayload,
  fallback: string
) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/${path}`,
    jsonPost(payload)
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, fallback)
}

async function postAppointmentAction(appointmentId: string, action: string, fallback: string) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/appointments/${encodeURIComponent(appointmentId)}/${action}`,
    { method: 'POST' }
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, fallback)
}

function jsonPost(payload: unknown) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }
}

function appendParam(params: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) params.append(key, value.trim())
}
