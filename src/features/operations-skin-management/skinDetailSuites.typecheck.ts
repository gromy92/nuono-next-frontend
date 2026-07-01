import type { OperationsSkinGalleryRow } from './skinGalleryRows'
import { resolveOperationsSkinTemplateSet } from './skinDetailSuites'

const row: OperationsSkinGalleryRow = {
  id: -1000,
  storeCode: 'STR108065-NAE',
  skinName: '白底主图',
  status: 'ACTIVE',
  coverImageUrl: null,
  styleDescription: '干净白底、均匀光线、商品居中，适合平台主图和标准展示。',
  remark: '系统预设',
  assets: [],
  updatedAt: null,
  source: 'system-preview',
  previewTone: 'studio'
}

const templateSet = resolveOperationsSkinTemplateSet(row)

const replacementRule: string = templateSet.replacementRule
const skinTypes: string[] = templateSet.skinTypes.map((skinType) => skinType.name)
const heroTemplateName: string = templateSet.heroTemplate.name
const heroElementNames: string[] = templateSet.heroTemplate.elements.map((element) => element.name)
const firstHeroElementBox: [number, number, number, number] = templateSet.heroTemplate.elements[0].bbox
const detailTemplateNames: string[] = templateSet.detailTemplates.map((template) => template.name)

void replacementRule
void skinTypes
void heroTemplateName
void heroElementNames
void firstHeroElementBox
void detailTemplateNames
