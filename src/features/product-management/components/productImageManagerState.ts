import type {
  ProductImageRoleAssignment,
  ProductImageUsageRole
} from '../types/productImageRole'

export type ProductImageManagerImage = {
  imageUrl: string
  imageRole: ProductImageUsageRole
}

type ProductImageInput = string | ProductImageManagerImage

export type ProductImageManagerState = {
  activeImages: ProductImageManagerImage[]
  unusedImages: ProductImageManagerImage[]
}

export function normalizeImageManagerState(
  activeImages: ProductImageInput[],
  unusedImages: ProductImageInput[] = [],
  roleAssignments: ProductImageRoleAssignment[] = []
): ProductImageManagerState {
  const seen = new Set<string>()
  const rolesByUrl = roleAssignmentMap(roleAssignments)
  const active = normalizeImages(activeImages, seen, rolesByUrl)
  const unused = normalizeImages(unusedImages, seen, rolesByUrl)
  return normalizeMainImageRole({ activeImages: active, unusedImages: unused })
}

export function activeImageUrls(state: ProductImageManagerState) {
  return normalizeImageManagerState(state.activeImages, state.unusedImages).activeImages
    .map((item) => item.imageUrl)
}

export function activeImageRoleAssignments(state: ProductImageManagerState): ProductImageRoleAssignment[] {
  return normalizeImageManagerState(state.activeImages, state.unusedImages).activeImages
    .map((item, index) => ({
      imageUrl: item.imageUrl,
      imageRole: item.imageRole,
      sortOrder: index
    }))
}

export function imageNumberTargets(state: ProductImageManagerState) {
  return activeImageUrls(state).map((_, index) => index)
}

export function moveActiveImageTo(
  state: ProductImageManagerState,
  index: number,
  nextIndex: number
): ProductImageManagerState {
  const normalized = normalizeImageManagerState(state.activeImages, state.unusedImages)
  if (
    nextIndex < 0 ||
    nextIndex >= normalized.activeImages.length ||
    nextIndex === index ||
    index < 0 ||
    index >= normalized.activeImages.length
  ) {
    return normalized
  }
  const nextImages = [...normalized.activeImages]
  const [targetImage] = nextImages.splice(index, 1)
  nextImages.splice(nextIndex, 0, targetImage)
  return normalizeImageManagerState(nextImages, normalized.unusedImages)
}

export function setActiveImageRole(
  state: ProductImageManagerState,
  index: number,
  imageRole: ProductImageUsageRole
): ProductImageManagerState {
  const normalized = normalizeImageManagerState(state.activeImages, state.unusedImages)
  if (index < 0 || index >= normalized.activeImages.length) {
    return normalized
  }
  if (imageRole === 'MAIN') {
    return moveActiveImageTo(normalized, index, 0)
  }
  return normalizeImageManagerState(
    normalized.activeImages.map((item, currentIndex) => (
      currentIndex === index ? { ...item, imageRole } : item
    )),
    normalized.unusedImages
  )
}

export function moveImageToUnused(state: ProductImageManagerState, index: number): ProductImageManagerState {
  const normalized = normalizeImageManagerState(state.activeImages, state.unusedImages)
  if (index < 0 || index >= normalized.activeImages.length) {
    return normalized
  }
  const nextActiveImages = [...normalized.activeImages]
  const [targetImage] = nextActiveImages.splice(index, 1)
  return normalizeImageManagerState(nextActiveImages, [...normalized.unusedImages, targetImage])
}

export function restoreUnusedImage(state: ProductImageManagerState, index: number): ProductImageManagerState {
  const normalized = normalizeImageManagerState(state.activeImages, state.unusedImages)
  if (index < 0 || index >= normalized.unusedImages.length) {
    return normalized
  }
  const nextUnusedImages = [...normalized.unusedImages]
  const [targetImage] = nextUnusedImages.splice(index, 1)
  return normalizeImageManagerState([...normalized.activeImages, targetImage], nextUnusedImages)
}

export function removeActiveImage(state: ProductImageManagerState, index: number): ProductImageManagerState {
  const normalized = normalizeImageManagerState(state.activeImages, state.unusedImages)
  if (index < 0 || index >= normalized.activeImages.length) {
    return normalized
  }
  return normalizeImageManagerState(
    normalized.activeImages.filter((_, currentIndex) => currentIndex !== index),
    normalized.unusedImages
  )
}

export function removeUnusedImage(state: ProductImageManagerState, index: number): ProductImageManagerState {
  const normalized = normalizeImageManagerState(state.activeImages, state.unusedImages)
  if (index < 0 || index >= normalized.unusedImages.length) {
    return normalized
  }
  return normalizeImageManagerState(
    normalized.activeImages,
    normalized.unusedImages.filter((_, currentIndex) => currentIndex !== index)
  )
}

export function appendActiveImages(state: ProductImageManagerState, imageUrls: string[]): ProductImageManagerState {
  const normalized = normalizeImageManagerState(state.activeImages, state.unusedImages)
  return normalizeImageManagerState([...normalized.activeImages, ...imageUrls], normalized.unusedImages)
}

function normalizeImages(
  images: ProductImageInput[],
  seen: Set<string>,
  rolesByUrl: Map<string, ProductImageUsageRole>
): ProductImageManagerImage[] {
  return images
    .map((item) => normalizeImageInput(item, rolesByUrl))
    .filter((item): item is ProductImageManagerImage => {
      if (!item || seen.has(item.imageUrl)) {
        return false
      }
      seen.add(item.imageUrl)
      return true
    })
}

function normalizeImageInput(
  item: ProductImageInput,
  rolesByUrl: Map<string, ProductImageUsageRole>
): ProductImageManagerImage | null {
  const imageUrl = typeof item === 'string' ? item.trim() : item.imageUrl.trim()
  if (!imageUrl) {
    return null
  }
  const imageRole = typeof item === 'string'
    ? rolesByUrl.get(imageUrl) ?? 'DETAIL'
    : normalizeImageRole(item.imageRole, rolesByUrl.get(imageUrl))
  return { imageUrl, imageRole }
}

function normalizeMainImageRole(state: ProductImageManagerState): ProductImageManagerState {
  return {
    activeImages: state.activeImages.map((item, index) => {
      if (index === 0) {
        return { ...item, imageRole: 'MAIN' }
      }
      return item.imageRole === 'MAIN' ? { ...item, imageRole: 'DETAIL' } : item
    }),
    unusedImages: state.unusedImages
  }
}

function roleAssignmentMap(assignments: ProductImageRoleAssignment[]) {
  const rolesByUrl = new Map<string, ProductImageUsageRole>()
  assignments.forEach((assignment) => {
    const imageUrl = assignment.imageUrl.trim()
    if (!imageUrl) {
      return
    }
    rolesByUrl.set(imageUrl, normalizeImageRole(assignment.imageRole))
  })
  return rolesByUrl
}

function normalizeImageRole(
  imageRole?: string,
  fallback?: ProductImageUsageRole
): ProductImageUsageRole {
  if (imageRole === 'MAIN' || imageRole === 'SIZE' || imageRole === 'DETAIL' || imageRole === 'PACKAGE') {
    return imageRole
  }
  return fallback ?? 'DETAIL'
}
