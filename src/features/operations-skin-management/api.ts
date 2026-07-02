import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api'
import type {
  OperationsSkinAssetUploadResponse,
  OperationsSkinComponentsSaveRequest,
  OperationsSkinQuery,
  OperationsSkinSaveRequest,
  OperationsSkinStatusRequest,
  OperationsSkinView
} from './types'

const BASE_PATH = '/api/operations/skin-management'
const ASSET_PATH_PREFIX = `${BASE_PATH}/assets/`

function skinPath(id: number) {
  return `${BASE_PATH}/skins/${encodeURIComponent(String(id))}`
}

export async function fetchOperationsSkins(query: OperationsSkinQuery) {
  const params = new URLSearchParams({ storeCode: query.storeCode })
  if (query.status) {
    params.set('status', query.status)
  }
  if (query.keyword?.trim()) {
    params.set('keyword', query.keyword.trim())
  }

  const response = await apiFetch(`${BASE_PATH}/skins?${params.toString()}`)
  return parseApiResponse<OperationsSkinView[]>(response, '皮肤列表读取失败')
}

export async function fetchOperationsSkinDetail(id: number, storeCode: string) {
  const params = new URLSearchParams({ storeCode })
  const response = await apiFetch(`${skinPath(id)}?${params.toString()}`)
  return parseApiResponse<OperationsSkinView>(response, '皮肤详情读取失败')
}

export async function createOperationsSkin(request: OperationsSkinSaveRequest) {
  const response = await apiFetch(`${BASE_PATH}/skins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return parseApiResponse<OperationsSkinView>(response, '皮肤创建失败')
}

export async function updateOperationsSkin(id: number, request: OperationsSkinSaveRequest) {
  const response = await apiFetch(skinPath(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return parseApiResponse<OperationsSkinView>(response, '皮肤保存失败')
}

export async function updateOperationsSkinComponents(id: number, request: OperationsSkinComponentsSaveRequest) {
  const response = await apiFetch(`${skinPath(id)}/components`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return parseApiResponse<OperationsSkinView>(response, '皮肤组件保存失败')
}

export async function updateOperationsSkinStatus(id: number, request: OperationsSkinStatusRequest) {
  const response = await apiFetch(`${skinPath(id)}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return parseApiResponse<OperationsSkinView>(response, '皮肤状态更新失败')
}

export async function deleteOperationsSkin(id: number, storeCode: string) {
  const params = new URLSearchParams({ storeCode })
  const response = await apiFetch(`${skinPath(id)}?${params.toString()}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '皮肤删除失败'))
  }
}

export async function uploadOperationsSkinAsset(storeCode: string, file: File) {
  const body = new FormData()
  body.append('file', file)
  body.append('storeCode', storeCode)

  const response = await apiFetch(`${BASE_PATH}/assets`, {
    method: 'POST',
    body
  })
  return parseApiResponse<OperationsSkinAssetUploadResponse>(response, '参考图上传失败')
}

export function isOperationsSkinAssetUrl(imageUrl: string) {
  const trimmedUrl = imageUrl.trim()
  if (!trimmedUrl) {
    return false
  }
  if (trimmedUrl.startsWith(ASSET_PATH_PREFIX)) {
    return true
  }
  if (typeof window === 'undefined') {
    return false
  }
  try {
    const url = new URL(trimmedUrl, window.location.origin)
    return url.origin === window.location.origin && url.pathname.startsWith(ASSET_PATH_PREFIX)
  } catch {
    return false
  }
}

export async function fetchOperationsSkinAssetPreviewUrl(imageUrl: string, signal?: AbortSignal) {
  return URL.createObjectURL(await fetchOperationsSkinAssetBlob(imageUrl, signal))
}

export async function fetchOperationsSkinAssetBlob(imageUrl: string, signal?: AbortSignal) {
  const response = await apiFetch(imageUrl, { signal })
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '参考图读取失败'))
  }
  return response.blob()
}

export function operationsSkinDownloadFilename(skinName: string, componentLabel: string, imageUrl: string) {
  const extension = imageExtension(imageUrl) || 'png'
  const baseName = `${skinName || '皮肤'}-${componentLabel || '组件'}`
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  return `${baseName || '皮肤组件'}.${extension}`
}

function imageExtension(imageUrl: string) {
  try {
    const pathname = new URL(imageUrl, typeof window === 'undefined' ? 'http://localhost' : window.location.origin).pathname
    const match = /\.([a-z0-9]+)$/i.exec(pathname)
    if (!match) {
      return undefined
    }
    const extension = match[1].toLowerCase()
    return extension === 'jpeg' ? 'jpg' : extension
  } catch {
    return undefined
  }
}
