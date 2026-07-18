import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const apiSource = fs.readFileSync(path.join(process.cwd(), 'src/features/product-image-profile/api.ts'), 'utf8')
const pageSource = fs.readFileSync(path.join(process.cwd(), 'src/features/product-image-profile/ProductImageProfilePage.tsx'), 'utf8')

assert.equal(apiSource.includes('productVariantId'), false, '商品图 API 不应再传递 variant_id')
assert.equal(pageSource.includes('productVariantId'), false, '商品图页面不应再依赖 variant_id')

assert.equal(pageSource.includes('missingGenerationProfileFields'), true, '申请做图前必须检查基础资料')
assert.equal(pageSource.includes('请先完成商品基础资料'), true, '基础资料缺失时必须提示用户先完善')
assert.equal(pageSource.includes('fetchOperationsSkins'), true, '申请做图必须从有效皮肤中选择')
assert.equal(pageSource.includes('审核通过并发布'), true, '审核通过动作必须明确会发布')
assert.equal(pageSource.includes('整套重做'), true, '审核不通过必须支持整套重做')
assert.equal(pageSource.includes('选择需要重做的图片'), true, '审核不通过必须支持按图片类型编号选择')
assert.equal(pageSource.includes('failureReason'), true, '失败状态必须显示原因')
assert.equal(pageSource.includes('retryProductImageSuite'), true, '失败状态必须提供重试')
assert.equal(apiSource.includes('/approve?'), true, '前端必须调用审核通过接口')
assert.equal(apiSource.includes('/reject?'), true, '前端必须调用审核不通过接口')
assert.equal(apiSource.includes('/retry?'), true, '前端必须调用任务重试接口')
assert.equal(apiSource.includes("| 'ONLINE'"), true, '只有 Noon 回读成功后才使用已上线状态')
