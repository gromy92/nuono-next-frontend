export type ManualSelectionGroupDeleteMode = 'group-only' | 'group-and-source-collections'

export const MANUAL_SELECTION_GROUP_DELETE_OPTIONS = [
  {
    mode: 'group-only' as const,
    label: '仅删除选品分析',
    description: '删除整组选品分析并解除全部关联，组内采集数据仍保留在人工采集中。'
  },
  {
    mode: 'group-and-source-collections' as const,
    label: '删除选品分析和采集数据',
    description: '删除整组选品分析，同时软删除组内全部人工采集数据。'
  }
]

export function shouldDeleteSourceCollections(mode: ManualSelectionGroupDeleteMode) {
  return mode === 'group-and-source-collections'
}
