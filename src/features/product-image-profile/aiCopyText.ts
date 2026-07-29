import type {
  ProductImageAiCopyProfile,
  ProductImageAiPromptSection
} from './aiCopyTextModel'
import {
  buildDefaultProductFactText,
  optionalProductImageCopyText
} from './aiCopyTextModel'
import {
  buildDetailImageRequirement,
  buildMainImageRequirement,
  buildOverallRequirementText,
  buildPackageImageRequirement,
  buildSceneImageRequirement,
  buildSizeImageRequirement
} from './aiCopyRequirements'

export type {
  ProductImageAiCopyProfile,
  ProductImageAiCopyRepeatableSection,
  ProductImageAiCopySimpleSection,
  ProductImageAiPromptSection,
  ProductImageAiPromptSectionKey
} from './aiCopyTextModel'
export {
  buildDefaultProductFactText,
  buildProductImageShortTitleAr,
  buildProductImageShortTitleEn
} from './aiCopyTextModel'

export function buildProductImageAiPromptSections(profile: ProductImageAiCopyProfile): ProductImageAiPromptSection[] {
  const productFactText = optionalProductImageCopyText(profile.productFactText) || buildDefaultProductFactText(profile)
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
  const productFactText = optionalProductImageCopyText(profile.productFactText) || buildDefaultProductFactText(profile)
  const imageSections = buildProductImageAiPromptSections(profile).filter((section) => section.key !== 'OVERALL')
  const imageRequirements = [
    '【图片要求】',
    ...imageSections.flatMap((section, index) => [
      index ? '' : undefined,
      section.copyTitle,
      section.text
    ]).filter((line): line is string => typeof line === 'string')
  ].join('\n')

  return [
    imageRequirements,
    ['【整体要求】', buildOverallRequirementText(productFactText)].join('\n')
  ].join('\n\n')
}
