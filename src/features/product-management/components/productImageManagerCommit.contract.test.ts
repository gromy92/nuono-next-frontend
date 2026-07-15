import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const componentDir = dirname(fileURLToPath(import.meta.url))

function source(path: string) {
  return readFileSync(join(componentDir, path), 'utf8')
}

const panelSource = source('./ProductImagesPanel.tsx')
const drawerSource = source('./ProductImageManagerDrawer.tsx')

assert.match(
  panelSource,
  /onSave=\{saveImages\}/,
  '商品图片管理必须通过保存按钮提交到详情草稿'
)

assert.match(
  panelSource,
  /imageAssetMetadata=\{productImageAssetMetadata\}/,
  '商品图片管理必须接收当前草稿中的 Noon 图片尺寸元数据'
)

assert.match(
  drawerSource,
  /onSave\(nextImages, activeImageRoleAssignments\(draftState\), nextImageAssetMetadata\)/,
  '图片管理保存时必须同时写回图片 URL、用途和 Noon 图片尺寸元数据'
)

assert.doesNotMatch(
  panelSource,
  /onActiveImagesChange=\{onImagesChange\}/,
  '图片管理抽屉内的未保存操作不能实时写回商品详情'
)

assert.doesNotMatch(
  drawerSource,
  /onActiveImagesChange/,
  '图片管理抽屉只能维护本地草稿，保存前不得向父级同步图片列表'
)
