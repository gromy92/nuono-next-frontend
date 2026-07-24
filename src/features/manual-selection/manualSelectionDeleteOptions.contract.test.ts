import assert from 'node:assert/strict'
import {
  MANUAL_SELECTION_GROUP_DELETE_OPTIONS,
  shouldDeleteSourceCollections
} from './manualSelectionDeleteOptions'

assert.deepEqual(
  MANUAL_SELECTION_GROUP_DELETE_OPTIONS.map((option) => option.label),
  ['仅删除选品分析', '删除选品分析和采集数据']
)
assert.equal(shouldDeleteSourceCollections('group-only'), false)
assert.equal(shouldDeleteSourceCollections('group-and-source-collections'), true)
