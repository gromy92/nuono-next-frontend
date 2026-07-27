import assert from 'node:assert/strict'
import {
  buildReviewAssetPrompts,
  buildReviewAssetPresentation,
  buildReviewAssetTemplate,
  buildReviewRejectPayload
} from './productImageReviewFeedback'
import type { ProductImageSuiteAsset, SuiteAssetRole } from './productImageProfileTypes'

function asset(id: number, imageRole: SuiteAssetRole): ProductImageSuiteAsset {
  return {
    id: `asset-${id}`,
    backendId: id,
    imageRole,
    roleOrdinal: 1,
    title: imageRole,
    sortOrder: id,
    accent: '#000'
  }
}

const prompts = buildReviewAssetPrompts([
  asset(6, 'USAGE_SCENE'),
  asset(2, 'SIZE'),
  asset(4, 'CORE_FEATURE'),
  asset(7, 'PACKAGE_LIST'),
  asset(1, 'MAIN'),
  asset(5, 'USAGE_SCENE'),
  asset(3, 'MATERIAL_DETAIL')
])

assert.deepEqual(
  prompts.map((prompt) => prompt.label),
  ['头图', '尺寸', '细节1', '细节2', '场景1', '场景2', '包装']
)
assert.equal(
  buildReviewAssetTemplate(prompts),
  '头图：\n尺寸：\n细节1：\n细节2：\n场景1：\n场景2：\n包装：'
)
assert.equal(buildReviewRejectPayload(buildReviewAssetTemplate(prompts), '', prompts), null)

const selectedPayload = buildReviewRejectPayload(
  [
    '头图：产品放大一些',
    '尺寸：',
    '细节1：材质区域需要更清楚',
    '补充保留真实纹理',
    '细节2：',
    '场景1：',
    '场景2：',
    '包装：'
  ].join('\n'),
  '保持黄色 PAPERSAY 皮肤一致',
  prompts
)
assert.deepEqual(selectedPayload, {
  assetIds: [1, 3],
  comment: [
    '逐图修改意见：',
    '头图：产品放大一些',
    '细节1：材质区域需要更清楚\n补充保留真实纹理',
    '',
    '整体意见：',
    '保持黄色 PAPERSAY 皮肤一致'
  ].join('\n'),
  wholeSuite: false
})

assert.deepEqual(
  buildReviewRejectPayload(buildReviewAssetTemplate(prompts), '整体重新调整留白', prompts),
  {
    assetIds: [],
    comment: '整体意见：\n整体重新调整留白',
    wholeSuite: true
  }
)

const visibleAssets = [
  { ...asset(46, 'MATERIAL_DETAIL'), roleOrdinal: 2, sortOrder: 30, title: '细节2' },
  { ...asset(51, 'CORE_FEATURE'), roleOrdinal: 1, sortOrder: 30, title: '卖点1' },
  { ...asset(45, 'MATERIAL_DETAIL'), roleOrdinal: 1, sortOrder: 20, title: '细节1' },
  { ...asset(47, 'MATERIAL_DETAIL'), roleOrdinal: 3, sortOrder: 40, title: '细节3' }
]
const presentedAssets = buildReviewAssetPresentation(visibleAssets)
assert.deepEqual(
  presentedAssets.map((item) => [item.backendId, item.title]),
  [
    [45, '细节1'],
    [51, '细节2'],
    [46, '细节3'],
    [47, '细节4']
  ],
  '套图卡片名称和顺序必须与驳回弹窗使用同一 asset 映射'
)
