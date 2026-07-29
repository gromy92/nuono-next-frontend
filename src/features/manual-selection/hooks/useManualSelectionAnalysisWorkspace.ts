import { App } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { normalizeManualSelectionPageErrorMessage } from '../manualSelectionErrorMessage'
import { loadManualSelectionGroupWorkspace } from '../manualSelectionGroupRepository'
import {
  analysisProjectFromGroup,
  groupProcurementPurchasePrice,
  normalizeManualSelectionGroup
} from '../manualSelectionGroupWorkspace'
import type {
  ManualSelectionAli1688ProcurementInfo,
  ManualSelectionAnalysisProjectInfo,
  ManualSelectionAnalysisProjectView,
  ManualSelectionGroupView,
  ManualSelectionSearchValues
} from '../types'
import { normalizeManualSelectionKeyword } from '../utils'

type Options = {
  storeName: string
  storeCode?: string
  collections: ProductSelectionSourceCollection[]
  filteredCollections: ProductSelectionSourceCollection[]
  filters: Partial<ManualSelectionSearchValues>
  message: ReturnType<typeof App.useApp>['message']
}

export function useManualSelectionAnalysisWorkspace({
  storeName,
  storeCode,
  collections,
  filteredCollections,
  filters,
  message
}: Options) {
  const [analysisGroups, setAnalysisGroups] = useState<ManualSelectionGroupView[]>([])
  const [analysisGroupsLoading, setAnalysisGroupsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setAnalysisGroupsLoading(true)
    loadManualSelectionGroupWorkspace(storeName, storeCode)
      .then((groups) => {
        if (!cancelled) {
          setAnalysisGroups(groups.map(normalizeManualSelectionGroup))
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.error(normalizeManualSelectionPageErrorMessage(
            error instanceof Error ? error.message : undefined,
            '读取选品分析失败'
          ))
        }
      })
      .finally(() => {
        if (!cancelled) setAnalysisGroupsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [message, storeCode, storeName])

  const analysisCollectionIds = useMemo(
    () => analysisGroups
      .flatMap((group) => group.materials.map((material) => material.sourceCollectionId))
      .filter(Boolean),
    [analysisGroups]
  )
  const analysisCollections = useMemo(() => {
    const collectionById = new Map(collections.map((record) => [record.id, record]))
    return analysisGroups
      .flatMap((group) => group.materials)
      .map((material) => material.sourceCollection || collectionById.get(material.sourceCollectionId))
      .filter((record): record is ProductSelectionSourceCollection => Boolean(record))
  }, [analysisGroups, collections])
  const analysisProjectByCollectionId = useMemo<Record<string, ManualSelectionAnalysisProjectInfo>>(() => {
    const result: Record<string, ManualSelectionAnalysisProjectInfo> = {}
    analysisGroups.forEach((group) => {
      group.materials.forEach((material) => {
        if (material.sourceCollectionId) {
          result[material.sourceCollectionId] = {
            projectId: group.groupId,
            projectName: group.groupName || '未命名选品组',
            projectMaterialCount: group.materialCount || group.materials.length || 1
          }
        }
      })
    })
    return result
  }, [analysisGroups])
  const analysisProjects = useMemo<ManualSelectionAnalysisProjectView[]>(() => {
    const collectionById = new Map(collections.map((record) => [record.id, record]))
    return analysisGroups.map((group) => analysisProjectFromGroup(group, collectionById))
  }, [analysisGroups, collections])
  const ali1688ProcurementInfoByCollectionId = useMemo(() => {
    const result: Record<string, ManualSelectionAli1688ProcurementInfo> = {}
    analysisGroups.forEach((group) => {
      group.materials.forEach((material) => {
        result[material.sourceCollectionId] = {
          purchaseUrl: group.procurement?.ali1688PurchaseUrl,
          purchasePrice: groupProcurementPurchasePrice(group)
        }
      })
    })
    return result
  }, [analysisGroups])
  const visibleCollections = useMemo(() => {
    const projectNameKeyword = normalizeManualSelectionKeyword(filters.projectName)
    return filteredCollections.filter((record) => {
      const project = analysisProjectByCollectionId[record.id]
      if (filters.analysisLinkedStatus === 'linked' && !project) return false
      if (filters.analysisLinkedStatus === 'unlinked' && project) return false
      return !projectNameKeyword
        || normalizeManualSelectionKeyword(project?.projectName || '').includes(projectNameKeyword)
    })
  }, [analysisProjectByCollectionId, filteredCollections, filters])

  return {
    analysisGroups,
    setAnalysisGroups,
    analysisGroupsLoading,
    analysisCollectionIds,
    analysisCollections,
    analysisProjectByCollectionId,
    analysisProjects,
    ali1688ProcurementInfoByCollectionId,
    visibleCollections
  }
}
