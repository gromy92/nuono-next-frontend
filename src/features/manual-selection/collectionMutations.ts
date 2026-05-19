import type {
  ProductSelectionSourceCollection,
  SourceCollectionFormValue
} from '../source-collection/types'
import {
  createManualSelectionCollection,
  recollectManualSelectionCollection
} from './api'

export type ManualSelectionMutationContext = {
  storeName: string
  storeCode?: string
  operatorName: string
}

export function upsertManualSelectionCollection(
  collections: ProductSelectionSourceCollection[],
  nextCollection: ProductSelectionSourceCollection
) {
  return [
    nextCollection,
    ...collections.filter((item) => item.id !== nextCollection.id)
  ]
}

export function replaceManualSelectionCollection(
  collections: ProductSelectionSourceCollection[],
  nextCollection: ProductSelectionSourceCollection
) {
  return collections.map((item) => (item.id === nextCollection.id ? nextCollection : item))
}

export function createManualSelectionSourceCollection(
  values: SourceCollectionFormValue,
  context: ManualSelectionMutationContext
) {
  return createManualSelectionCollection(
    values,
    context.storeName,
    context.storeCode,
    context.operatorName
  )
}

export function recollectManualSelectionSourceCollection(
  record: ProductSelectionSourceCollection,
  context: ManualSelectionMutationContext
) {
  return recollectManualSelectionCollection(
    record.id,
    context.storeCode,
    context.operatorName
  )
}
