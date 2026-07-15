import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const componentDir = dirname(fileURLToPath(import.meta.url))
const drawerSource = readFileSync(join(componentDir, 'ProductImageManagerDrawer.tsx'), 'utf8')
const panelSource = readFileSync(join(componentDir, 'ProductImagesPanel.tsx'), 'utf8')

assert.match(
  panelSource,
  /App as AntdApp/,
  '图片面板必须使用 antd App 上下文，避免静态 message 在主题容器内无反馈'
)

assert.match(
  panelSource,
  /const \{ message: messageApi \} = AntdApp\.useApp\(\)/,
  '图片面板必须从 App.useApp 获取 message API'
)

assert.match(
  panelSource,
  /messageApi=\{messageApi\}/,
  '图片管理抽屉必须接收上下文 message API'
)

assert.match(
  panelSource,
  /onImportRemoteImage=\{importRemoteImage\}/,
  '图片管理抽屉必须接收外部图片转存函数'
)

assert.match(
  panelSource,
  /importProductImageAsset\(imageUrl,\s*imageAssetContext\(productSnapshotView\)\)/,
  '外部图片自动适配前必须调用后端转存接口，不能直接用浏览器 canvas 处理 CDN 图'
)

assert.match(
  drawerSource,
  /props\.messageApi\.loading\(\{\s*key:\s*adaptMessageKey/,
  '自动适配点击后必须立刻展示持续 loading 提示'
)

assert.match(
  drawerSource,
  /setAutoAdaptFeedback\(\{\s*imageUrl,\s*content:\s*'正在自动适配商品图\.\.\.',\s*type:\s*'info'\s*\}\)/,
  '自动适配点击后必须在当前图片行直接展示处理状态'
)

assert.match(
  drawerSource,
  /content:\s*'正在上传适配后的商品图/,
  '生成适配图后必须提示正在上传'
)

assert.match(
  drawerSource,
  /shouldImportRemoteImage\(imageUrl\).*props\.onImportRemoteImage/s,
  '外部 http(s) 图片必须先转存为本地商品图资产再自动适配'
)

assert.match(
  drawerSource,
  /content:\s*'正在转存外部商品图/,
  '外部图片转存过程必须有明确反馈'
)

assert.match(
  drawerSource,
  /createNoonReadyImageFile\(sourceImageUrl,\s*target\)/,
  '自动适配应使用转存后的本地图片生成适配图'
)

assert.match(
  drawerSource,
  /message=\{autoAdaptFeedback\.content\}/,
  '自动适配结果必须在图片行内展示，不能只依赖全局 toast'
)

assert.match(
  drawerSource,
  /const IMAGE_PROCESS_TIMEOUT_MS = 15000/,
  '图片读取和适配必须有超时，不能无限卡住没有反馈'
)

assert.match(
  drawerSource,
  /withImageProcessTimeout/,
  '图片读取和 canvas 适配必须走超时包装'
)

assert.match(
  drawerSource,
  /imageDimensionReadErrorsByUrl/,
  '图片尺寸读取失败必须记录状态，不能一直显示读取尺寸中'
)

assert.match(
  drawerSource,
  /<Tag color="red" title=\{errorMessage\}>读取失败<\/Tag>/,
  '图片尺寸读取失败时必须在图片行展示读取失败'
)

assert.match(
  drawerSource,
  /readProductImageDimensions\(imageUrl\)[\s\S]{0,2200}\.catch\(\(error\) => \{[\s\S]{0,700}setImageDimensionReadErrorsByUrl/,
  '列表图片尺寸读取失败必须写入失败状态，不能静默吞掉'
)
