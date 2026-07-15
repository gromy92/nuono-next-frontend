export type ProductImageAiCopySimpleSection = {
  titleAr?: string
  titleEn?: string
  descriptionAr?: string
  descriptionEn?: string
  attributesText?: string
}

export type ProductImageAiCopyRepeatableSection = ProductImageAiCopySimpleSection & {
  id?: string
  focusPart?: string
}

export type ProductImageAiCopyProfile = {
  pskuCode?: string
  productTitle?: string
  productFactText?: string
  brand?: string
  titleAr?: string
  titleEn?: string
  specSummary?: string
  heroSellingPoints?: string[]
  sizeSection?: ProductImageAiCopySimpleSection
  coreFeatures?: ProductImageAiCopyRepeatableSection[]
  materialDetails?: ProductImageAiCopyRepeatableSection[]
  usageScene?: ProductImageAiCopySimpleSection
  packageList?: ProductImageAiCopySimpleSection
}

export type ProductImageAiPromptSectionKey = 'MAIN' | 'SIZE' | 'DETAIL' | 'SCENE' | 'PACKAGE' | 'OVERALL'

export type ProductImageAiPromptSection = {
  key: ProductImageAiPromptSectionKey
  title: string
  subtitle: string
  copyTitle: string
  text: string
}

function optionalText(value?: string | null) {
  return value?.trim() || ''
}

function nonEmptyTexts(values: Array<string | undefined | null>) {
  return values.map(optionalText).filter(Boolean)
}

function appendField(lines: string[], label: string, value?: string | null) {
  const text = optionalText(value)
  if (text) {
    lines.push(`${label}：${text}`)
  }
}

function numbered(values?: string[]) {
  const lines = nonEmptyTexts(values ?? [])
  return lines.length ? lines.map((item, index) => `${index + 1}. ${item}`).join('\n') : ''
}

function compactTitle(
  value: string | undefined | null,
  options: {
    maxWords: number
    maxChars: number
    breakPhrases?: string[]
  }
) {
  let text = optionalText(value)
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) {
    return ''
  }
  text = stripLeadingPackQuantity(text)
  if (!text) {
    return ''
  }

  const delimiterText = text.split(/[，,،؛;|]/).map((part) => part.trim()).find(Boolean)
  if (delimiterText) {
    text = delimiterText
  }

  const lowerText = text.toLowerCase()
  const breakIndex = (options.breakPhrases ?? [])
    .map((phrase) => lowerText.indexOf(phrase.toLowerCase()))
    .filter((index) => index > 0)
    .sort((left, right) => left - right)[0]
  if (breakIndex) {
    text = text.slice(0, breakIndex).trim()
  }

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length > options.maxWords) {
    text = words.slice(0, options.maxWords).join(' ')
  }

  const chars = Array.from(text)
  if (chars.length > options.maxChars) {
    text = chars.slice(0, options.maxChars).join('').trim()
  }

  return text
}

function stripLeadingPackQuantity(value: string) {
  const numberPattern = '[0-9٠-٩۰-۹]+'
  return value
    .replace(new RegExp(`^\\s*${numberPattern}\\s*[- ]?\\s*(?:pcs?\\.?|pieces?|piece|packs?|pack)\\s+`, 'i'), '')
    .replace(new RegExp(`^\\s*${numberPattern}\\s*(?:قطع|قطعة)\\s+`, 'i'), '')
    .replace(new RegExp(`^\\s*${numberPattern}\\s+`), '')
    .trim()
}

export function buildProductImageShortTitleAr(value?: string | null) {
  return compactTitle(value, {
    maxWords: 7,
    maxChars: 58,
    breakPhrases: [' مع ']
  })
}

export function buildProductImageShortTitleEn(value?: string | null) {
  return compactTitle(value, {
    maxWords: 6,
    maxChars: 52,
    breakPhrases: [' with ', ' for ', ' and ', ' - ', ' – ']
  })
}

function mainImageTitleAr(profile: ProductImageAiCopyProfile) {
  return optionalText(profile.titleAr) || buildProductImageShortTitleAr(profile.productTitle)
}

function mainImageTitleEn(profile: ProductImageAiCopyProfile) {
  return optionalText(profile.titleEn) || buildProductImageShortTitleEn(profile.productTitle)
}

export function buildDefaultProductFactText(profile: ProductImageAiCopyProfile) {
  const lines: string[] = []
  appendField(lines, '商品', profile.productTitle)
  appendField(lines, 'PSKU', profile.pskuCode)
  appendField(lines, '品牌', profile.brand)
  appendField(lines, '阿语标题', profile.titleAr)
  appendField(lines, '英文标题', profile.titleEn)
  appendField(lines, '规格', profile.specSummary)
  const heroSellingPoints = numbered(profile.heroSellingPoints)
  if (heroSellingPoints) {
    lines.push(`核心卖点：\n${heroSellingPoints}`)
  }
  appendField(lines, '尺寸', profile.sizeSection?.attributesText)
  appendField(lines, '包装/数量', profile.packageList?.attributesText)
  appendField(lines, '使用场景', profile.usageScene?.descriptionEn || profile.usageScene?.descriptionAr)
  return lines.join('\n')
}

function appendCopyLine(lines: string[], label: string, value?: string | null) {
  const text = optionalText(value)
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
  return optionalText(profile.packageList?.attributesText)
    || optionalText(profile.packageList?.descriptionEn)
    || optionalText(profile.packageList?.descriptionAr)
}

function usageCopyText(profile: ProductImageAiCopyProfile) {
  return optionalText(profile.usageScene?.titleAr)
    || optionalText(profile.usageScene?.titleEn)
    || optionalText(profile.usageScene?.descriptionAr)
    || optionalText(profile.usageScene?.descriptionEn)
}

function buildMainImageCopy(profile: ProductImageAiCopyProfile) {
  const lines = ['文案：']
  appendCopyLine(lines, '英文短标题', mainImageTitleEn(profile))
  appendCopyLine(lines, '阿语短标题', mainImageTitleAr(profile))
  appendCopyLine(lines, '精简卖点', nonEmptyTexts(profile.heroSellingPoints ?? [])[0])
  appendCopyLine(lines, '规格', profile.specSummary)
  addEmptyCopyFallback(lines)
  return lines
}

function buildMainImageRequirement(profile: ProductImageAiCopyProfile) {
  return [
    ...buildMainImageCopy(profile),
    '- 画面：生成主图内容层，按当前店铺皮肤预留品牌区、标题区、规格条、边框和留白；PAPERSAY logo、边框、规格标签和标题由系统合成，不要让 AI 绘制或改动。当前商品已有首图或基础图只作为商品素材和事实参考。'
  ].join('\n')
}

function buildDetailSellingPointCopy(profile: ProductImageAiCopyProfile) {
  const lines = ['文案：']
  nonEmptyTexts(profile.heroSellingPoints ?? []).slice(0, 3).forEach((point, index) => {
    lines.push(`- 卖点${index + 1}：${point}`)
  })
  addEmptyCopyFallback(lines)
  return lines
}

function buildSizeImageRequirement(profile: ProductImageAiCopyProfile) {
  const sizeCopy = optionalText(profile.sizeSection?.attributesText)
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

function buildDetailImageRequirement(profile: ProductImageAiCopyProfile) {
  return [
    ...buildDetailSellingPointCopy(profile),
    '- 画面：生成细节图内容层，每张只讲一个卖点或细节，优先使用商品局部、材质、结构、接口、边角、表面、工艺等可视信息；皮肤、标题和固定文案由系统合成。'
  ].join('\n')
}

function buildSceneImageRequirement(profile: ProductImageAiCopyProfile) {
  const usageText = usageCopyText(profile)
  const usageCopyLines = ['文案：']
  appendCopyLine(usageCopyLines, '使用场景', usageText)
  addEmptyCopyFallback(usageCopyLines)

  return [
    ...usageCopyLines,
    '- 画面：生成场景图内容层，展示适用空间、人群、用途和使用状态；优先使用基础图中真实存在的场景；皮肤、标题和固定文案由系统合成。'
  ].join('\n')
}

function buildPackageImageRequirement(profile: ProductImageAiCopyProfile) {
  const packageText = packageCopyText(profile)
  const packageCopyLines = ['文案：']
  appendCopyLine(packageCopyLines, '包装数据', packageText)
  addEmptyCopyFallback(packageCopyLines)

  return [
    ...packageCopyLines,
    '- 画面：生成包装图内容层，展示套装数量、配件、颜色组合、包装内容或交付清单；只使用包装数据和参考资料明确内容；皮肤、标题和固定文案由系统合成。'
  ].join('\n')
}

function buildImageRequirements(profile: ProductImageAiCopyProfile) {
  const imageSections = buildProductImageAiPromptSections(profile).filter((section) => section.key !== 'OVERALL')
  return [
    '【图片要求】',
    ...imageSections.flatMap((section, index) => [
      index ? '' : undefined,
      section.copyTitle,
      section.text
    ]).filter((line): line is string => typeof line === 'string')
  ].join('\n')
}

function buildOverallRequirementText(productFactText: string) {
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

function buildOverallRequirements(productFactText: string) {
  return [
    '【整体要求】',
    buildOverallRequirementText(productFactText)
  ].join('\n')
}

export function buildProductImageAiPromptSections(profile: ProductImageAiCopyProfile): ProductImageAiPromptSection[] {
  const productFactText = optionalText(profile.productFactText) || buildDefaultProductFactText(profile)
  return [
    {
      key: 'MAIN',
      title: '主图',
      subtitle: '第1张',
      copyTitle: '第1张 主图',
      text: buildMainImageRequirement(profile)
    },
    {
      key: 'SIZE',
      title: '尺寸图',
      subtitle: '第2张',
      copyTitle: '第2张 尺寸图',
      text: buildSizeImageRequirement(profile)
    },
    {
      key: 'DETAIL',
      title: '细节',
      subtitle: '2-4张',
      copyTitle: '第3部分 细节图（2-4张）',
      text: buildDetailImageRequirement(profile)
    },
    {
      key: 'SCENE',
      title: '场景',
      subtitle: '1-2张',
      copyTitle: '第4部分 使用场景图（1-2张）',
      text: buildSceneImageRequirement(profile)
    },
    {
      key: 'PACKAGE',
      title: '包装',
      subtitle: '1张',
      copyTitle: '第5部分 包装图（1张）',
      text: buildPackageImageRequirement(profile)
    },
    {
      key: 'OVERALL',
      title: '整体要求',
      subtitle: '全套通用',
      copyTitle: '整体要求',
      text: buildOverallRequirementText(productFactText)
    }
  ]
}

export function buildProductImageAiCopyText(profile: ProductImageAiCopyProfile) {
  const productFactText = optionalText(profile.productFactText) || buildDefaultProductFactText(profile)
  return [
    buildImageRequirements(profile),
    buildOverallRequirements(productFactText)
  ].join('\n\n')
}
