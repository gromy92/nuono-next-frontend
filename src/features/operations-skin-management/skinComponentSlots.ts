import type { OperationsSkinComponentView } from './types'

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
