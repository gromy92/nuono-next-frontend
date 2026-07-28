import type { OperationsSkinGalleryRow } from './skinGalleryRows'
import type { OperationsSkinComponentView } from './types'
import {
  DETAIL_IMAGE_COMPONENT_SLOTS,
  HERO_MAIN_COMPONENT_SLOTS,
  HERO_MAIN_TEMPLATE_ROLE,
  OPERATIONS_SKIN_COMPONENT_SLOTS,
  PACKAGE_IMAGE_COMPONENT_SLOTS,
  SCENE_IMAGE_COMPONENT_SLOTS,
  SIZE_IMAGE_COMPONENT_SLOTS,
  type OperationsSkinComponentSlot
} from './skinComponentSlots'
export * from './skinComponentSlots'
export type OperationsSkinTemplateSkinType = {
  key: 'hero-skin' | 'size-skin' | 'detail-skin' | 'scene-skin' | 'package-skin'
  name: string
  summary: string
}
export type OperationsSkinTemplateElement = {
  key: string
  name: string
  type: 'image' | 'text' | 'shape' | 'color' | 'font'
  sourceLayer: string
  bbox: [number, number, number, number]
  defaultValue?: string
}
export type OperationsSkinImageTemplate = {
  key: string
  sequence: number
  name: string
  imageRole: string
  skinTypeKey: OperationsSkinTemplateSkinType['key']
  templateHint: string
  previewImageUrl?: string
  elements: OperationsSkinTemplateElement[]
}

export type OperationsSkinTemplateSet = {
  replacementRule: string
  skinTypes: OperationsSkinTemplateSkinType[]
  heroTemplate: OperationsSkinImageTemplate
  detailTemplates: OperationsSkinImageTemplate[]
}

export function skinComponentSlotKey(component: Pick<OperationsSkinComponentView, 'templateRole' | 'componentKey'>) {
  return `${component.templateRole}::${component.componentKey}`
}

export function findOperationsSkinComponentSlot(
  component: Pick<OperationsSkinComponentView, 'templateRole' | 'componentKey'>
) {
  const key = skinComponentSlotKey(component)
  return OPERATIONS_SKIN_COMPONENT_SLOTS.find((slot) => skinComponentSlotKey(slot) === key)
}

export function countConfiguredSkinComponents(
  components: OperationsSkinComponentView[] | null | undefined,
  slots: OperationsSkinComponentSlot[]
) {
  const savedByKey = new Map((components ?? []).map((component) => [skinComponentSlotKey(component), component]))
  return slots.filter((slot) => savedByKey.get(skinComponentSlotKey(slot))?.imageUrl?.trim()).length
}

export function mergeOperationsSkinComponentSlots(
  components?: OperationsSkinComponentView[] | null,
  slots: OperationsSkinComponentSlot[] = OPERATIONS_SKIN_COMPONENT_SLOTS
): OperationsSkinComponentView[] {
  const savedByKey = new Map(
    (components ?? []).map((component) => [skinComponentSlotKey(component), component])
  )
  const slotKeys = new Set(slots.map((slot) => skinComponentSlotKey(slot)))
  const mergedSlots = slots.map((slot) => {
    const saved = savedByKey.get(skinComponentSlotKey(slot))
    return {
      ...saved,
      templateRole: slot.templateRole,
      componentKey: slot.componentKey,
      imageUrl: saved?.imageUrl ?? '',
      x: saved?.x ?? slot.defaultBox.x,
      y: saved?.y ?? slot.defaultBox.y,
      width: saved?.width ?? slot.defaultBox.width,
      height: saved?.height ?? slot.defaultBox.height,
      zIndex: saved?.zIndex ?? slot.defaultBox.zIndex,
      required: saved?.required ?? slot.required,
      locked: saved?.locked ?? slot.locked,
      styleJson: saved?.styleJson ?? '{}'
    }
  })
  const unknownSavedComponents = (components ?? []).filter((component) => !slotKeys.has(skinComponentSlotKey(component)))
  return [...mergedSlots, ...unknownSavedComponents]
}

export function mergeHeroMainComponentSlots(
  components?: OperationsSkinComponentView[] | null
): OperationsSkinComponentView[] {
  return mergeOperationsSkinComponentSlots(components, HERO_MAIN_COMPONENT_SLOTS)
    .filter((component) => component.templateRole === HERO_MAIN_TEMPLATE_ROLE)
}

export function normalizeOperationsSkinComponentDrafts(
  components: OperationsSkinComponentView[]
): OperationsSkinComponentView[] {
  return mergeOperationsSkinComponentSlots(components)
    .map((component) => ({
      ...component,
      imageUrl: component.imageUrl?.trim() ?? ''
    }))
    .filter((component) => Boolean(component.imageUrl))
}

export function normalizeHeroMainComponentDrafts(
  components: OperationsSkinComponentView[]
): OperationsSkinComponentView[] {
  return normalizeOperationsSkinComponentDrafts(components)
    .filter((component) => component.templateRole === HERO_MAIN_TEMPLATE_ROLE)
}

const SKIN_TYPES: OperationsSkinTemplateSkinType[] = [
  {
    key: 'hero-skin',
    name: '头图皮肤',
    summary: '用于商品头图，决定主视觉背景、商品摆放和首屏氛围。'
  },
  {
    key: 'size-skin',
    name: '尺寸图皮肤',
    summary: '用于第二张尺寸图，承载尺寸线、比例参照和尺寸说明。'
  },
  {
    key: 'detail-skin',
    name: '细节图皮肤',
    summary: '用于 2-4 张细节图，承载局部特写和卖点卡片。'
  },
  {
    key: 'scene-skin',
    name: '场景图皮肤',
    summary: '用于 1-2 张场景图，承载真实使用画面和简短说明。'
  },
  {
    key: 'package-skin',
    name: '包装图皮肤',
    summary: '用于包装图，承载包含内容、配件和数量说明。'
  }
]

const TONE_HINTS: Record<OperationsSkinGalleryRow['previewTone'], { hero: string; detail: string }> = {
  studio: {
    hero: '白底商品居中，保留平台主图安全边距。',
    detail: '浅色边框、弱装饰、突出商品信息本身。'
  },
  lifestyle: {
    hero: '头图加入使用氛围，展示商品在真实场景中的状态。',
    detail: '详情页边框保留场景感，适合搭配说明和空间参照。'
  },
  texture: {
    hero: '头图强调局部材质和光泽，适合品质型商品。',
    detail: '边框为细节图预留大图位，承接纹理、做工和局部放大。'
  },
  festival: {
    hero: '头图保留活动信息层级，兼顾商品和促销氛围。',
    detail: '边框加强活动识别，适合卖点、权益和专题促销说明。'
  }
}

const PAPERSAY_HERO_ELEMENTS: OperationsSkinTemplateElement[] = [
  {
    key: 'frame_png',
    name: '边框图 PNG',
    type: 'image',
    sourceLayer: '边框图 PNG',
    bbox: [-2, 0, 1249, 1706]
  },
  {
    key: 'brand_png',
    name: '品牌背景 / 品牌名 PNG',
    type: 'image',
    sourceLayer: '品牌背景 + 品牌名 PNG',
    bbox: [0, 0, 320, 260]
  },
  {
    key: 'spec_background_png',
    name: '规格背景 PNG',
    type: 'image',
    sourceLayer: '规格背景 PNG',
    bbox: [-362, 198, 510, 300]
  },
  {
    key: 'main_title_background_png',
    name: '主标题背景 PNG',
    type: 'image',
    sourceLayer: '主标题背景 PNG',
    bbox: [9, 1403, 1248, 1585]
  }
]

const PAPERSAY_DETAIL_BORDER_ELEMENTS: OperationsSkinTemplateElement[] = [
  {
    key: 'detail_frame_png',
    name: '副图边框 PNG',
    type: 'image',
    sourceLayer: '生成模板',
    bbox: [0, 0, 1247, 1706]
  },
  {
    key: 'detail_title_background_png',
    name: '副图标题背景 PNG',
    type: 'image',
    sourceLayer: '生成模板',
    bbox: [42, 62, 1205, 178]
  },
  {
    key: 'detail_content_background_png',
    name: '副图内容底板 PNG',
    type: 'image',
    sourceLayer: '生成模板',
    bbox: [42, 220, 1205, 1398]
  },
  {
    key: 'detail_badge_background_png',
    name: '副图信息条背景 PNG',
    type: 'image',
    sourceLayer: '生成模板',
    bbox: [42, 1448, 502, 1540]
  }
]

function elementsForSlots(prefix: string, slots: OperationsSkinComponentSlot[]): OperationsSkinTemplateElement[] {
  return slots.map((slot) => ({
    key: `${prefix}_${slot.componentKey.toLowerCase()}`,
    name: slot.label,
    type: 'image',
    sourceLayer: '生成模板',
    bbox: [
      slot.defaultBox.x ?? 0,
      slot.defaultBox.y ?? 0,
      (slot.defaultBox.x ?? 0) + (slot.defaultBox.width ?? 0),
      (slot.defaultBox.y ?? 0) + (slot.defaultBox.height ?? 0)
    ]
  }))
}

export function resolveOperationsSkinTemplateSet(row: OperationsSkinGalleryRow): OperationsSkinTemplateSet {
  const toneHint = TONE_HINTS[row.previewTone]
  return {
    replacementRule: '应用到商品图时按整套替换：主图、尺寸图、细节图、场景图和包装图皮肤一起生效。',
    skinTypes: SKIN_TYPES,
    heroTemplate: {
      key: 'hero-01',
      sequence: 1,
      name: '头图模板',
      imageRole: '商品头图',
      skinTypeKey: 'hero-skin',
      templateHint: toneHint.hero,
      previewImageUrl: '/operations-skins/papersay-whiteboard-main-clean-vector.png',
      elements: PAPERSAY_HERO_ELEMENTS
    },
    detailTemplates: [
      {
        key: 'size-02',
        sequence: 2,
        name: '尺寸图模板',
        imageRole: '尺寸图',
        skinTypeKey: 'size-skin',
        templateHint: '第 2 张固定展示尺寸关系，使用尺寸图皮肤承载尺寸线和单位说明。',
        previewImageUrl: '/operations-skins/papersay-whiteboard-detail-clean-vector.png',
        elements: elementsForSlots('size', SIZE_IMAGE_COMPONENT_SLOTS)
      },
      {
        key: 'detail-03',
        sequence: 3,
        name: '细节图模板',
        imageRole: '细节图 2-4 张',
        skinTypeKey: 'detail-skin',
        templateHint: toneHint.detail,
        previewImageUrl: '/operations-skins/papersay-whiteboard-detail-clean-vector.png',
        elements: PAPERSAY_DETAIL_BORDER_ELEMENTS
      },
      {
        key: 'scene-04',
        sequence: 4,
        name: '场景图模板',
        imageRole: '场景图 1-2 张',
        skinTypeKey: 'scene-skin',
        templateHint: '场景图区预留大画面，标题和底部说明保持店铺皮肤统一。',
        previewImageUrl: '/operations-skins/papersay-whiteboard-detail-clean-vector.png',
        elements: elementsForSlots('scene', SCENE_IMAGE_COMPONENT_SLOTS)
      },
      {
        key: 'package-05',
        sequence: 5,
        name: '包装图模板',
        imageRole: '包装图',
        skinTypeKey: 'package-skin',
        templateHint: '包装图用网格和清单底板展示包含内容，不把数量事实写入皮肤。',
        previewImageUrl: '/operations-skins/papersay-whiteboard-detail-clean-vector.png',
        elements: elementsForSlots('package', PACKAGE_IMAGE_COMPONENT_SLOTS)
      }
    ]
  }
}
