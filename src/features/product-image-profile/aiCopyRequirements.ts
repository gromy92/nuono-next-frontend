import type { ProductImageAiCopyProfile } from './aiCopyTextModel'
import {
  mainImageTitleAr,
  mainImageTitleEn,
  nonEmptyProductImageCopyTexts,
  optionalProductImageCopyText
} from './aiCopyTextModel'

function appendCopyLine(lines: string[], label: string, value?: string | null) {
  const text = optionalProductImageCopyText(value)
  if (text) {
    lines.push(`- ${label}：${text}`)
  }
}

function addEmptyCopyFallback(lines: string[]) {
  if (lines.length === 1) {
    lines.push('- 无固定上图文案；仅在参考资料明确给出短句时上图。')
  }
}

function packageCopyText(profile: ProductImageAiCopyProfile) {
  return optionalProductImageCopyText(profile.packageList?.attributesText)
    || optionalProductImageCopyText(profile.packageList?.descriptionEn)
    || optionalProductImageCopyText(profile.packageList?.descriptionAr)
}

function usageCopyText(profile: ProductImageAiCopyProfile) {
  return optionalProductImageCopyText(profile.usageScene?.titleAr)
    || optionalProductImageCopyText(profile.usageScene?.titleEn)
    || optionalProductImageCopyText(profile.usageScene?.descriptionAr)
    || optionalProductImageCopyText(profile.usageScene?.descriptionEn)
}

function buildMainImageCopy(profile: ProductImageAiCopyProfile) {
  const lines = ['文案：']
  appendCopyLine(lines, '英文短标题', mainImageTitleEn(profile))
  appendCopyLine(lines, '阿语短标题', mainImageTitleAr(profile))
  appendCopyLine(lines, '精简卖点', nonEmptyProductImageCopyTexts(profile.heroSellingPoints ?? [])[0])
  appendCopyLine(lines, '规格', profile.specSummary)
  addEmptyCopyFallback(lines)
  return lines
}

export function buildMainImageRequirement(profile: ProductImageAiCopyProfile) {
  return [
    ...buildMainImageCopy(profile),
    '- 画面：生成主图内容层，按当前店铺皮肤预留品牌区、标题区、规格条、边框和留白；PAPERSAY logo、边框、规格标签和标题由系统合成，不要让 AI 绘制或改动。当前商品已有首图或基础图只作为商品素材和事实参考。'
  ].join('\n')
}

function buildDetailSellingPointCopy(profile: ProductImageAiCopyProfile) {
  const lines = ['文案：']
  nonEmptyProductImageCopyTexts(profile.heroSellingPoints ?? []).slice(0, 3).forEach((point, index) => {
    lines.push(`- 卖点${index + 1}：${point}`)
  })
  addEmptyCopyFallback(lines)
  return lines
}

export function buildSizeImageRequirement(profile: ProductImageAiCopyProfile) {
  const sizeCopy = optionalProductImageCopyText(profile.sizeSection?.attributesText)
  const sizeCopyLines = ['文案：']
  if (sizeCopy) {
    appendCopyLine(sizeCopyLines, '尺寸文案', sizeCopy)
  } else {
    sizeCopyLines.push('- 尺寸文案为空：不得写具体尺寸数字；只能展示商品可见结构、比例关系和待补充的尺寸标注位。')
  }

  return [
    ...sizeCopyLines,
    '- 画面：生成尺寸图内容层，按 SIZE_IMAGE 尺寸图皮肤预留尺寸标注位；尺寸文字、箭头、皮肤边框和标题由系统合成。没有尺寸文案时不得补具体数字。'
  ].join('\n')
}

export function buildDetailImageRequirement(profile: ProductImageAiCopyProfile) {
  return [
    ...buildDetailSellingPointCopy(profile),
    '- 画面：生成细节图内容层，每张只讲一个卖点或细节，优先使用商品局部、材质、结构、接口、边角、表面、工艺等可视信息；皮肤、标题和固定文案由系统合成。'
  ].join('\n')
}

export function buildSceneImageRequirement(profile: ProductImageAiCopyProfile) {
  const usageCopyLines = ['文案：']
  appendCopyLine(usageCopyLines, '使用场景', usageCopyText(profile))
  addEmptyCopyFallback(usageCopyLines)

  return [
    ...usageCopyLines,
    '- 画面：生成场景图内容层，展示适用空间、人群、用途和使用状态；优先使用基础图中真实存在的场景；皮肤、标题和固定文案由系统合成。'
  ].join('\n')
}

export function buildPackageImageRequirement(profile: ProductImageAiCopyProfile) {
  const packageCopyLines = ['文案：']
  appendCopyLine(packageCopyLines, '包装数据', packageCopyText(profile))
  addEmptyCopyFallback(packageCopyLines)

  return [
    ...packageCopyLines,
    '- 画面：生成包装图内容层，展示套装数量、配件、颜色组合、包装内容或交付清单；只使用包装数据和参考资料明确内容；皮肤、标题和固定文案由系统合成。'
  ].join('\n')
}

export function buildOverallRequirementText(productFactText: string) {
  return [
    '参考资料（不直接上图）：',
    productFactText || '暂无商品资料，必须只使用每张图“文案”小节和基础图可见信息。',
    '',
    '生成边界：AI 只生成商品、细节、场景、包装等内容层；PAPERSAY logo、品牌区、边框、圆角、规格标签、标题区、尺寸文字、箭头、固定皮肤组件和最终文字由系统后期合成，不要在 AI 图里生成、重画或改动。',
    '皮肤边界：当前店铺皮肤只用于决定构图安全区、留白和后期合成位置；不要把已有主图或皮肤截图当成最终画面重新绘制。',
    '尺寸：默认跟随当前店铺皮肤或平台目标画布；商品已有首图和基础图只提供商品素材，不决定整套图的画布比例和风格。',
    '风格：内容层要干净、清晰、电商感强，并为当前皮肤预留足够空间；整套图最终由系统统一品牌色、字体、边框和标题背景。',
    '文字：除非某个分区明确要求生成内容层里的自然场景文字，否则不要在 AI 图里生成任何可读文字、logo、水印、标签、标题、角标、尺寸数字或说明文案。',
    '标题：主图只使用“短标题”作为系统合成文案，完整商品标题仅作为参考资料，不直接上图；规格里已有的数量/pack count 不要重复进标题。',
    '素材边界：每张图只能使用该图“文案”小节里的文字上图；参考资料只用于理解商品、选择画面和校验事实，不要整段搬到图片上。',
    '事实边界：不编造尺寸、材质、功能、认证、适配型号、数量、使用效果或平台背书。',
    '图片素材：优先使用当前商品已有首图和基础图作为商品素材来源，保持商品真实形态；不得把已有首图当成皮肤母版，也不要改出与基础图冲突的商品外观。',
    '套图差异：主图、尺寸图、细节图、场景图和包装图必须有独立视觉目标、构图、视角和素材来源；不得把同一张产品素材重复裁切后用于多张图。',
    '出图数量：按图片要求生成 1 张主图、1 张尺寸图、2-4 张细节图、1-2 张场景图、1 张包装图。'
  ].join('\n')
}
