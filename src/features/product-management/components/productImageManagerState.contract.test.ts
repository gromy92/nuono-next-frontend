import assert from 'node:assert/strict'
import {
  activeImageUrls,
  activeImageRoleAssignments,
  imageNumberTargets,
  moveImageToUnused,
  setActiveImageRole,
  normalizeImageManagerState,
  restoreUnusedImage
} from './productImageManagerState'

const initialState = normalizeImageManagerState([
  'https://example.test/main.jpg',
  'https://example.test/detail-1.jpg',
  'https://example.test/detail-2.jpg'
])

assert.deepEqual(activeImageUrls(initialState), [
  'https://example.test/main.jpg',
  'https://example.test/detail-1.jpg',
  'https://example.test/detail-2.jpg'
])
assert.deepEqual(imageNumberTargets(initialState), [0, 1, 2])
assert.deepEqual(activeImageRoleAssignments(initialState), [
  { imageUrl: 'https://example.test/main.jpg', imageRole: 'MAIN', sortOrder: 0 },
  { imageUrl: 'https://example.test/detail-1.jpg', imageRole: 'DETAIL', sortOrder: 1 },
  { imageUrl: 'https://example.test/detail-2.jpg', imageRole: 'DETAIL', sortOrder: 2 }
])

const stateWithSizeImage = setActiveImageRole(initialState, 1, 'SIZE')
assert.deepEqual(activeImageRoleAssignments(stateWithSizeImage), [
  { imageUrl: 'https://example.test/main.jpg', imageRole: 'MAIN', sortOrder: 0 },
  { imageUrl: 'https://example.test/detail-1.jpg', imageRole: 'SIZE', sortOrder: 1 },
  { imageUrl: 'https://example.test/detail-2.jpg', imageRole: 'DETAIL', sortOrder: 2 }
])

const stateWithNewMainImage = setActiveImageRole(stateWithSizeImage, 2, 'MAIN')
assert.deepEqual(activeImageUrls(stateWithNewMainImage), [
  'https://example.test/detail-2.jpg',
  'https://example.test/main.jpg',
  'https://example.test/detail-1.jpg'
])
assert.deepEqual(activeImageRoleAssignments(stateWithNewMainImage), [
  { imageUrl: 'https://example.test/detail-2.jpg', imageRole: 'MAIN', sortOrder: 0 },
  { imageUrl: 'https://example.test/main.jpg', imageRole: 'DETAIL', sortOrder: 1 },
  { imageUrl: 'https://example.test/detail-1.jpg', imageRole: 'SIZE', sortOrder: 2 }
])

const stateAfterUnused = moveImageToUnused(initialState, 1)
assert.deepEqual(activeImageUrls(stateAfterUnused), [
  'https://example.test/main.jpg',
  'https://example.test/detail-2.jpg'
])
assert.deepEqual(stateAfterUnused.unusedImages, [
  { imageUrl: 'https://example.test/detail-1.jpg', imageRole: 'DETAIL' }
])
assert.deepEqual(imageNumberTargets(stateAfterUnused), [0, 1], 'unused images must be excluded from numbering')

const stateAfterRestored = restoreUnusedImage(stateAfterUnused, 0)
assert.deepEqual(activeImageUrls(stateAfterRestored), [
  'https://example.test/main.jpg',
  'https://example.test/detail-2.jpg',
  'https://example.test/detail-1.jpg'
])
assert.deepEqual(stateAfterRestored.unusedImages, [])

const allUnusedState = moveImageToUnused(
  moveImageToUnused(moveImageToUnused(initialState, 0), 0),
  0
)
assert.deepEqual(activeImageUrls(allUnusedState), [], 'all images can be marked as unused')
assert.deepEqual(allUnusedState.unusedImages, [
  { imageUrl: 'https://example.test/main.jpg', imageRole: 'MAIN' },
  { imageUrl: 'https://example.test/detail-1.jpg', imageRole: 'MAIN' },
  { imageUrl: 'https://example.test/detail-2.jpg', imageRole: 'MAIN' }
])
