import type {
  ManualSelectionAnalysisItemView,
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor,
  ManualSelectionGroupView
} from './types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

export function groupProcurementPurchasePrice(group: ManualSelectionGroupView) {
  return group.procurement?.purchasePriceRmb ?? group.procurement?.purchasePrice
}

export function normalizeManualSelectionGroup(group: ManualSelectionGroupView): ManualSelectionGroupView {
  const materials = group.materials || []
  return {
    ...group,
    groupId: group.groupId,
    groupName: group.groupName || '未命名选品组',
    materialCount: group.materialCount || materials.length,
    materials,
    procurement: group.procurement || {
      ali1688PurchaseUrl: '',
      status: 'missing'
    },
    competitors: group.competitors || []
  }
}

export function mergeManualSelectionGroups(
  current: ManualSelectionGroupView[],
  incoming: ManualSelectionGroupView[]
) {
  const groupById = new Map(current.map((group) => [group.groupId, normalizeManualSelectionGroup(group)]))
  incoming.forEach((group) => {
    if (!group?.groupId) {
      return
    }
    const previous = groupById.get(group.groupId)
    groupById.set(group.groupId, normalizeManualSelectionGroup({
      ...previous,
      ...group,
      materials: group.materials || previous?.materials || [],
      procurement: group.procurement || previous?.procurement,
      competitors: group.competitors || previous?.competitors || []
    }))
  })
  return Array.from(groupById.values())
}

export function groupsFromLegacyAnalysisItems(items: ManualSelectionAnalysisItemView[]): ManualSelectionGroupView[] {
  const groupById = new Map<string, ManualSelectionGroupView>()
  items.forEach((item) => {
    const groupId = item.projectId || item.id || item.sourceCollectionId
    const group = groupById.get(groupId) || {
      groupId,
      groupName: item.projectName || '未命名选品组',
      materialCount: item.projectMaterialCount || 1,
      materials: [],
      procurement: {
        ali1688PurchaseUrl: item.ali1688PurchaseUrl || '',
        purchasePriceRmb: item.purchasePrice,
        purchasePrice: item.purchasePrice,
        status: item.ali1688PurchaseUrl || typeof item.purchasePrice === 'number' ? 'active' : 'missing'
      }
    }
    if (!group.materials.some((material) => material.sourceCollectionId === item.sourceCollectionId)) {
      group.materials.push({
        materialId: item.id,
        groupId,
        sourceCollectionId: item.sourceCollectionId,
        status: 'active',
        sourceCollection: item.sourceCollection
      })
    }
    group.materialCount = Math.max(group.materialCount || 1, item.projectMaterialCount || group.materials.length)
    groupById.set(groupId, group)
  })
  return Array.from(groupById.values()).map(normalizeManualSelectionGroup)
}

export function analysisProjectFromGroup(
  group: ManualSelectionGroupView,
  collectionById: Map<string, ProductSelectionSourceCollection> = new Map()
): ManualSelectionAnalysisProjectView {
  const normalizedGroup = normalizeManualSelectionGroup(group)
  const records = normalizedGroup.materials
    .map((material) => material.sourceCollection || collectionById.get(material.sourceCollectionId))
    .filter((record): record is ProductSelectionSourceCollection => Boolean(record))
  const fallbackRecord = records[0]
  const items = normalizedGroup.materials
    .map((material) => ({
      id: material.materialId,
      projectId: normalizedGroup.groupId,
      projectName: normalizedGroup.groupName,
      projectMaterialCount: normalizedGroup.materialCount || normalizedGroup.materials.length || 1,
      sourceCollectionId: material.sourceCollectionId,
      ali1688PurchaseUrl: normalizedGroup.procurement?.ali1688PurchaseUrl,
      purchasePrice: groupProcurementPurchasePrice(normalizedGroup),
      sourceCollection: material.sourceCollection || collectionById.get(material.sourceCollectionId) || fallbackRecord
    }))
    .filter((item) => Boolean(item.sourceCollection)) as ManualSelectionAnalysisItemView[]
  return {
    groupId: normalizedGroup.groupId,
    groupNo: normalizedGroup.groupNo,
    projectId: normalizedGroup.groupId,
    projectName: normalizedGroup.groupName || '未命名选品组',
    projectMaterialCount: normalizedGroup.materialCount || normalizedGroup.materials.length || 1,
    procurement: normalizedGroup.procurement,
    competitors: normalizedGroup.competitors || [],
    items,
    records
  }
}

export function replaceGroupCompetitors(
  groups: ManualSelectionGroupView[],
  groupId: string,
  competitors: ManualSelectionCompetitor[]
) {
  return groups.map((group) => (
    group.groupId === groupId
      ? normalizeManualSelectionGroup({
          ...group,
          competitors
        })
      : group
  ))
}
