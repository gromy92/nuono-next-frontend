import { useMemo, useState } from 'react'
import { filterManualSelectionCollections } from '../collectionFilters'
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

  const filteredCollections = useMemo(
    () => filterManualSelectionCollections(collections, filters),
    [collections, filters]
  )

  return {
    collections,
    filteredCollections,
    loading,
    submitting,
    createNewCollection,
    loadCollections,
    recollect,
    setFilters
  }
}
