import type { OperationsSkinGalleryRow } from './skinGalleryRows'
import type { OperationsSkinComponentView } from './types'

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

export type OperationsSkinComponentSlot = {
  templateRole: string
  componentKey: string
  label: string
  description: string
  required: boolean
  locked: boolean
  defaultBox: Pick<OperationsSkinComponentView, 'x' | 'y' | 'width' | 'height' | 'zIndex'>
}

export type OperationsSkinComponentSlotGroup = {
  templateRole: string
  name: string
  summary: string
  slots: OperationsSkinComponentSlot[]
}

export const HERO_MAIN_TEMPLATE_ROLE = 'HERO_MAIN'
export const SIZE_IMAGE_TEMPLATE_ROLE = 'SIZE_IMAGE'
export const DETAIL_IMAGE_TEMPLATE_ROLE = 'DETAIL_IMAGE'
export const SCENE_IMAGE_TEMPLATE_ROLE = 'SCENE_IMAGE'
export const PACKAGE_IMAGE_TEMPLATE_ROLE = 'PACKAGE_IMAGE'

export const HERO_MAIN_COMPONENT_SLOTS: OperationsSkinComponentSlot[] = [
  {
    templateRole: HERO_MAIN_TEMPLATE_ROLE,
    componentKey: 'FRAME',
    label: '边框图 PNG',
    description: '整张主图的透明 PNG 边框。',
    required: true,
    locked: true,
    defaultBox: { x: 0, y: 0, width: 1247, height: 1706, zIndex: 40 }
  },
  {
    templateRole: HERO_MAIN_TEMPLATE_ROLE,
    componentKey: 'BRAND_LOCKUP',
    label: '品牌背景 / 品牌名 PNG',
    description: '品牌底、品牌名和 logo 保持为完整 PNG。',
    required: true,
    locked: true,
    defaultBox: { x: 0, y: 0, width: 510, height: 170, zIndex: 50 }
  },
  {
    templateRole: HERO_MAIN_TEMPLATE_ROLE,
    componentKey: 'SPEC_BG',
    label: '规格背景 PNG',
    description: '规格条背景，不包含规格文字。',
    required: true,
    locked: true,
    defaultBox: { x: 40, y: 210, width: 420, height: 68, zIndex: 60 }
  },
  {
    templateRole: HERO_MAIN_TEMPLATE_ROLE,
    componentKey: 'MAIN_TITLE_BG',
    label: '主标题背景 PNG',
    description: '底部标题背景，不包含标题文字。',
    required: true,
    locked: true,
    defaultBox: { x: 0, y: 1450, width: 1247, height: 140, zIndex: 20 }
  }
]

export const SIZE_IMAGE_COMPONENT_SLOTS: OperationsSkinComponentSlot[] = [
  {
    templateRole: SIZE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SIZE_FRAME',
    label: '尺寸图边框 PNG',
    description: '第 2 张尺寸图的透明 PNG 外框。',
    required: true,
    locked: true,
    defaultBox: { x: 0, y: 0, width: 1247, height: 1706, zIndex: 40 }
  },
  {
    templateRole: SIZE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SIZE_TITLE_BG',
    label: '尺寸图标题背景 PNG',
    description: '尺寸图标题栏背景，不包含标题文字。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 62, width: 1163, height: 116, zIndex: 30 }
  },
  {
    templateRole: SIZE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SIZE_MEASURE_BG',
    label: '尺寸标注区背景 PNG',
    description: '承载商品、尺寸线和比例参照的背景，不包含具体尺寸数字。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 220, width: 1163, height: 1098, zIndex: 10 }
  },
  {
    templateRole: SIZE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SIZE_NOTE_BG',
    label: '尺寸说明背景 PNG',
    description: '承载尺寸说明或单位说明的背景，不包含文字。',
    required: false,
    locked: true,
    defaultBox: { x: 42, y: 1408, width: 1163, height: 132, zIndex: 30 }
  }
]

export const DETAIL_IMAGE_COMPONENT_SLOTS: OperationsSkinComponentSlot[] = [
  {
    templateRole: DETAIL_IMAGE_TEMPLATE_ROLE,
    componentKey: 'DETAIL_FRAME',
    label: '细节图边框 PNG',
    description: '细节图 2-4 张共用的透明 PNG 外框。',
    required: true,
    locked: true,
    defaultBox: { x: 0, y: 0, width: 1247, height: 1706, zIndex: 40 }
  },
  {
    templateRole: DETAIL_IMAGE_TEMPLATE_ROLE,
    componentKey: 'DETAIL_TITLE_BG',
    label: '细节图标题背景 PNG',
    description: '细节图标题栏背景，不包含标题文字。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 62, width: 1163, height: 116, zIndex: 30 }
  },
  {
    templateRole: DETAIL_IMAGE_TEMPLATE_ROLE,
    componentKey: 'DETAIL_CONTENT_BG',
    label: '细节卡片底板 PNG',
    description: '承载局部特写或 2-4 个卖点卡片的底板，不包含商品图和文案。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 220, width: 1163, height: 1178, zIndex: 10 }
  },
  {
    templateRole: DETAIL_IMAGE_TEMPLATE_ROLE,
    componentKey: 'DETAIL_BADGE_BG',
    label: '细节卖点标签背景 PNG',
    description: '用于局部特写标题或短卖点的信息条背景，不包含文字。',
    required: false,
    locked: true,
    defaultBox: { x: 42, y: 1448, width: 460, height: 92, zIndex: 30 }
  }
]

export const SCENE_IMAGE_COMPONENT_SLOTS: OperationsSkinComponentSlot[] = [
  {
    templateRole: SCENE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SCENE_FRAME',
    label: '场景图边框 PNG',
    description: '场景图 1-2 张共用的透明 PNG 外框。',
    required: true,
    locked: true,
    defaultBox: { x: 0, y: 0, width: 1247, height: 1706, zIndex: 40 }
  },
  {
    templateRole: SCENE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SCENE_TITLE_BG',
    label: '场景图标题背景 PNG',
    description: '场景图标题栏背景，不包含标题文字。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 62, width: 1163, height: 116, zIndex: 30 }
  },
  {
    templateRole: SCENE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SCENE_PHOTO_BG',
    label: '场景图片区背景 PNG',
    description: '承载真实使用场景或环境画面的图片区，不包含商品图和文案。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 220, width: 1163, height: 1038, zIndex: 10 }
  },
  {
    templateRole: SCENE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'SCENE_CAPTION_BG',
    label: '场景说明背景 PNG',
    description: '承载场景说明和使用提示的背景，不包含文字。',
    required: false,
    locked: true,
    defaultBox: { x: 42, y: 1336, width: 1163, height: 204, zIndex: 30 }
  }
]

export const PACKAGE_IMAGE_COMPONENT_SLOTS: OperationsSkinComponentSlot[] = [
  {
    templateRole: PACKAGE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'PACKAGE_FRAME',
    label: '包装图边框 PNG',
    description: '包装/包含内容图的透明 PNG 外框。',
    required: true,
    locked: true,
    defaultBox: { x: 0, y: 0, width: 1247, height: 1706, zIndex: 40 }
  },
  {
    templateRole: PACKAGE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'PACKAGE_TITLE_BG',
    label: '包装图标题背景 PNG',
    description: '包装图标题栏背景，不包含标题文字。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 62, width: 1163, height: 116, zIndex: 30 }
  },
  {
    templateRole: PACKAGE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'PACKAGE_GRID_BG',
    label: '包装清单网格 PNG',
    description: '承载包装内容和配件清单的网格底板，不包含商品图和文案。',
    required: true,
    locked: true,
    defaultBox: { x: 42, y: 220, width: 1163, height: 1028, zIndex: 10 }
  },
  {
    templateRole: PACKAGE_IMAGE_TEMPLATE_ROLE,
    componentKey: 'PACKAGE_LIST_BG',
    label: '包装说明背景 PNG',
    description: '承载包装数量或清单说明的背景，不包含文字。',
    required: false,
    locked: true,
    defaultBox: { x: 42, y: 1328, width: 1163, height: 212, zIndex: 30 }
  }
]

export const HERO_MAIN_COMPONENT_SLOT_GROUP: OperationsSkinComponentSlotGroup = {
  templateRole: HERO_MAIN_TEMPLATE_ROLE,
  name: '主图皮肤',
  summary: '第 1 张主图使用，承载品牌区、规格条、标题背景和外框。',
  slots: HERO_MAIN_COMPONENT_SLOTS
}

export const SIZE_IMAGE_COMPONENT_SLOT_GROUP: OperationsSkinComponentSlotGroup = {
  templateRole: SIZE_IMAGE_TEMPLATE_ROLE,
  name: '尺寸图皮肤',
  summary: '第 2 张尺寸图使用，给商品、尺寸线和比例参照预留区域。',
  slots: SIZE_IMAGE_COMPONENT_SLOTS
}

export const DETAIL_IMAGE_COMPONENT_SLOT_GROUP: OperationsSkinComponentSlotGroup = {
  templateRole: DETAIL_IMAGE_TEMPLATE_ROLE,
  name: '细节图皮肤',
  summary: '细节图 2-4 张使用，支持局部特写和卖点卡片。',
  slots: DETAIL_IMAGE_COMPONENT_SLOTS
}

export const SCENE_IMAGE_COMPONENT_SLOT_GROUP: OperationsSkinComponentSlotGroup = {
  templateRole: SCENE_IMAGE_TEMPLATE_ROLE,
  name: '场景图皮肤',
  summary: '场景图 1-2 张使用，突出真实使用画面和简短说明。',
  slots: SCENE_IMAGE_COMPONENT_SLOTS
}

export const PACKAGE_IMAGE_COMPONENT_SLOT_GROUP: OperationsSkinComponentSlotGroup = {
  templateRole: PACKAGE_IMAGE_TEMPLATE_ROLE,
  name: '包装图皮肤',
  summary: '包装图使用，承载包含内容、配件和数量说明。',
  slots: PACKAGE_IMAGE_COMPONENT_SLOTS
}

export const SUITE_IMAGE_COMPONENT_SLOT_GROUPS: OperationsSkinComponentSlotGroup[] = [
  SIZE_IMAGE_COMPONENT_SLOT_GROUP,
  DETAIL_IMAGE_COMPONENT_SLOT_GROUP,
  SCENE_IMAGE_COMPONENT_SLOT_GROUP,
  PACKAGE_IMAGE_COMPONENT_SLOT_GROUP
]

export const OPERATIONS_SKIN_COMPONENT_SLOT_GROUPS: OperationsSkinComponentSlotGroup[] = [
  HERO_MAIN_COMPONENT_SLOT_GROUP,
  ...SUITE_IMAGE_COMPONENT_SLOT_GROUPS
]

export const OPERATIONS_SKIN_COMPONENT_SLOTS: OperationsSkinComponentSlot[] = [
  ...HERO_MAIN_COMPONENT_SLOTS,
  ...SIZE_IMAGE_COMPONENT_SLOTS,
  ...DETAIL_IMAGE_COMPONENT_SLOTS,
  ...SCENE_IMAGE_COMPONENT_SLOTS,
  ...PACKAGE_IMAGE_COMPONENT_SLOTS
]

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
