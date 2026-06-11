import { apiFetch, parseApiResponse } from '../../shared/api'

export type ImageMatchCompareInput = {
  originalImageUrl?: string
  candidateImageUrl?: string
  originalImageFile?: File
  candidateImageFile?: File
}

export type ImageMatchCompareResult = {
  similarityScore: number
}

type BackendImageMatchResult = {
  similarityScore?: number
}

function normalizeScore(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(value)))
}

export async function compareProductImages(input: ImageMatchCompareInput): Promise<ImageMatchCompareResult> {
  const hasFile = Boolean(input.originalImageFile || input.candidateImageFile)

  if (hasFile) {
    const body = new FormData()
    if (input.originalImageUrl?.trim()) {
      body.append('originalImageUrl', input.originalImageUrl.trim())
    }
    if (input.candidateImageUrl?.trim()) {
      body.append('candidateImageUrl', input.candidateImageUrl.trim())
    }
    if (input.originalImageFile) {
      body.append('originalImageFile', input.originalImageFile)
    }
    if (input.candidateImageFile) {
      body.append('candidateImageFile', input.candidateImageFile)
    }

    const response = await apiFetch('/api/image-match/compare', {
      method: 'POST',
      body
    })
    const payload = await parseApiResponse<BackendImageMatchResult>(response, '图片匹配失败')
    return { similarityScore: normalizeScore(payload.similarityScore) }
  }

  const response = await apiFetch('/api/image-match/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalImageUrl: input.originalImageUrl?.trim(),
      candidateImageUrl: input.candidateImageUrl?.trim()
    })
  })
  const payload = await parseApiResponse<BackendImageMatchResult>(response, '图片匹配失败')
  return { similarityScore: normalizeScore(payload.similarityScore) }
}
