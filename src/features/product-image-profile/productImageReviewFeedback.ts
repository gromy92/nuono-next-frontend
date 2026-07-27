import type { ProductImageSuiteAsset } from './productImageProfileTypes'

export type ProductImageReviewAssetPrompt = {
  assetId: number
  label: string
}

export type ProductImageReviewAssetFeedback = ProductImageReviewAssetPrompt & {
  comment: string
}

export type ProductImageReviewRejectPayload = {
  assetIds: number[]
  comment: string
  wholeSuite: boolean
}

const reviewRoleOrder: Record<ProductImageSuiteAsset['imageRole'], number> = {
  MAIN: 10,
  SIZE: 20,
  MATERIAL_DETAIL: 30,
  CORE_FEATURE: 30,
  USAGE_SCENE: 40,
  PACKAGE_LIST: 50
}

function labelCounts(assets: ProductImageSuiteAsset[]) {
  return assets.reduce<Record<string, number>>((counts, asset) => {
    counts[asset.imageRole] = (counts[asset.imageRole] ?? 0) + 1
    return counts
  }, {})
}

export function buildReviewAssetPrompts(
  assets: ProductImageSuiteAsset[]
): ProductImageReviewAssetPrompt[] {
  const counts = labelCounts(assets)
  let detailIndex = 0
  let sceneIndex = 0
  let mainIndex = 0
  let sizeIndex = 0
  let packageIndex = 0

  return [...assets]
    .filter((asset): asset is ProductImageSuiteAsset & { backendId: number } =>
      typeof asset.backendId === 'number'
    )
    .sort((left, right) =>
      reviewRoleOrder[left.imageRole] - reviewRoleOrder[right.imageRole]
      || left.sortOrder - right.sortOrder
      || left.roleOrdinal - right.roleOrdinal
    )
    .map((asset) => {
      switch (asset.imageRole) {
        case 'MAIN':
          mainIndex += 1
          return { assetId: asset.backendId, label: counts.MAIN > 1 ? `头图${mainIndex}` : '头图' }
        case 'SIZE':
          sizeIndex += 1
          return { assetId: asset.backendId, label: counts.SIZE > 1 ? `尺寸${sizeIndex}` : '尺寸' }
        case 'CORE_FEATURE':
        case 'MATERIAL_DETAIL':
          detailIndex += 1
          return { assetId: asset.backendId, label: `细节${detailIndex}` }
        case 'USAGE_SCENE':
          sceneIndex += 1
          return { assetId: asset.backendId, label: `场景${sceneIndex}` }
        case 'PACKAGE_LIST':
          packageIndex += 1
          return {
            assetId: asset.backendId,
            label: counts.PACKAGE_LIST > 1 ? `包装${packageIndex}` : '包装'
          }
      }
    })
}

export function buildReviewAssetPresentation(
  assets: ProductImageSuiteAsset[]
): ProductImageSuiteAsset[] {
  const prompts = buildReviewAssetPrompts(assets)
  const assetsById = new Map(
    assets.flatMap((asset) =>
      typeof asset.backendId === 'number' ? [[asset.backendId, asset] as const] : []
    )
  )
  const presented = prompts.flatMap((prompt) => {
    const asset = assetsById.get(prompt.assetId)
    return asset ? [{ ...asset, title: prompt.label }] : []
  })
  const unresolved = assets.filter((asset) => typeof asset.backendId !== 'number')
  return [...presented, ...unresolved]
}

export function buildReviewAssetTemplate(prompts: ProductImageReviewAssetPrompt[]) {
  return prompts.map((prompt) => `${prompt.label}：`).join('\n')
}

export function parseReviewAssetFeedback(
  value: string,
  prompts: ProductImageReviewAssetPrompt[]
): ProductImageReviewAssetFeedback[] {
  const comments = new Map<number, string[]>()
  let currentPrompt: ProductImageReviewAssetPrompt | undefined

  for (const line of value.replace(/\r\n?/g, '\n').split('\n')) {
    const prompt = prompts.find(
      (candidate) => line.startsWith(`${candidate.label}：`) || line.startsWith(`${candidate.label}:`)
    )
    if (prompt) {
      currentPrompt = prompt
      const markerLength = prompt.label.length + 1
      comments.set(prompt.assetId, [line.slice(markerLength).trim()])
      continue
    }
    if (currentPrompt) {
      comments.get(currentPrompt.assetId)?.push(line.trim())
    }
  }

  return prompts.flatMap((prompt) => {
    const comment = (comments.get(prompt.assetId) ?? [])
      .filter(Boolean)
      .join('\n')
      .trim()
    return comment ? [{ ...prompt, comment }] : []
  })
}

export function buildReviewRejectPayload(
  assetFeedbackText: string,
  overallComment: string,
  prompts: ProductImageReviewAssetPrompt[]
): ProductImageReviewRejectPayload | null {
  const assetFeedback = parseReviewAssetFeedback(assetFeedbackText, prompts)
  const normalizedOverallComment = overallComment.trim()
  if (!assetFeedback.length && !normalizedOverallComment) return null

  const commentParts: string[] = []
  if (assetFeedback.length) {
    commentParts.push(
      '逐图修改意见：',
      ...assetFeedback.map((feedback) => `${feedback.label}：${feedback.comment}`)
    )
  }
  if (normalizedOverallComment) {
    if (commentParts.length) commentParts.push('')
    commentParts.push('整体意见：', normalizedOverallComment)
  }

  return {
    assetIds: assetFeedback.map((feedback) => feedback.assetId),
    comment: commentParts.join('\n'),
    wholeSuite: assetFeedback.length === 0
  }
}
