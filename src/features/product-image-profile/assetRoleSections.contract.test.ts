import assert from 'node:assert/strict'
import {
  groupProductImageAssetsByRole,
  productImageAssetRoleSections
} from './assetRoleSections'
import type { ProductImageRole } from './api'

type TestAsset = {
  id: string
  imageRole: ProductImageRole
}

const grouped = groupProductImageAssetsByRole<TestAsset>([
  { id: 'scene-1', imageRole: 'SCENE' },
  { id: 'main-1', imageRole: 'MAIN' },
  { id: 'legacy-1', imageRole: 'OTHER' },
  { id: 'detail-1', imageRole: 'DETAIL' },
  { id: 'size-1', imageRole: 'SIZE' },
  { id: 'package-1', imageRole: 'PACKAGE' }
])

assert.deepEqual(productImageAssetRoleSections.map((section) => section.role), [
  'MAIN',
  'SIZE',
  'DETAIL',
  'SCENE',
  'PACKAGE'
])

assert.deepEqual(grouped.map((section) => section.label), ['主图', '尺寸图', '细节', '场景', '包装'])
assert.deepEqual(grouped.map((section) => section.assets.map((asset) => asset.id)), [
  ['main-1', 'legacy-1'],
  ['size-1'],
  ['detail-1'],
  ['scene-1'],
  ['package-1']
])
