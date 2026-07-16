import assert from 'node:assert/strict'
import {
  MANUAL_SELECTION_MATERIAL_DELETE_OPTIONS,
  shouldDeleteSourceCollection
} from './manualSelectionDeleteOptions'

assert.deepEqual(
  MANUAL_SELECTION_MATERIAL_DELETE_OPTIONS.map((option) => option.label),
  ['仅解除关联', '解除关联并删除采集数据']
)
assert.equal(shouldDeleteSourceCollection('unlink'), false)
assert.equal(shouldDeleteSourceCollection('unlink-and-delete-source'), true)
