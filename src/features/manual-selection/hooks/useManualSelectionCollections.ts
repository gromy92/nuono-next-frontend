import { useCallback, useState } from 'react'
import type {
  ManualSelectionPageProps,
  ManualSelectionSearchValues
} from '../types'
import { useManualSelectionCollectionActions } from './useManualSelectionCollectionActions'
import { useManualSelectionCollectionData } from './useManualSelectionCollectionData'

export function useManualSelectionCollections(props: ManualSelectionPageProps) {
  const [filters, setFilters] = useState<ManualSelectionSearchValues>({})
  const {
    collections,
    setCollections,
    loading,
    pagination,
    loadCollections
  } = useManualSelectionCollectionData(props)
  const {
    submitting,
    createNewCollection,
    recollect
  } = useManualSelectionCollectionActions({
    ...props,
    setCollections
  })

  const searchCollections = useCallback(
    (values: ManualSelectionSearchValues) => {
      setFilters(values)
      void loadCollections({
        page: 1,
        filters: values
      })
    },
    [loadCollections]
  )

  const changePage = useCallback(
    (page: number, pageSize: number) => {
      void loadCollections({
        page,
        pageSize,
        filters
      })
    },
    [filters, loadCollections]
  )

  return {
    collections,
    filteredCollections: collections,
    loading,
    pagination,
    submitting,
    changePage,
    createNewCollection,
    loadCollections,
    recollect,
    setFilters: searchCollections
  }
}
