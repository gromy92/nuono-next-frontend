export type ManualSelectionMaterialDeleteMode = 'unlink' | 'unlink-and-delete-source'

export const MANUAL_SELECTION_MATERIAL_DELETE_OPTIONS = [
  {
    mode: 'unlink' as const,
    label: '仅解除关联',
    description: '采集数据仍保留在人工采集中，之后可以再次加入选品分析。'
  },
  {
    mode: 'unlink-and-delete-source' as const,
    label: '解除关联并删除采集数据',
    description: '同时软删除人工采集数据；删除后不会再出现在人工采集列表中。'
  }
]

export function shouldDeleteSourceCollection(mode: ManualSelectionMaterialDeleteMode) {
  return mode === 'unlink-and-delete-source'
}
