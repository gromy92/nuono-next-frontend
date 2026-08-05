import { useMemo, useReducer, type Key } from 'react'
import type { OfficialWarehouseProductCandidate } from '../api'
import { officialWarehouseCandidateKey } from '../officialWarehouseCandidatePresentation'

export type AsnCandidateSourceMode = 'batch' | 'manual'

export function selectedAsnLineQuantities({
  key,
  batchKeys,
  manualKeys,
  batchQuantities,
  manualQuantities
}: {
  key: string
  batchKeys: string[]
  manualKeys: string[]
  batchQuantities: Record<string, number>
  manualQuantities: Record<string, number>
}) {
  const batchQuantity = batchKeys.includes(key) ? batchQuantities[key] || 0 : 0
  const manualQuantity = manualKeys.includes(key) ? manualQuantities[key] || 0 : 0
  return { quantity: batchQuantity + manualQuantity, manualQuantity }
}

export type AsnLineSelectionState = {
  mode: AsnCandidateSourceMode
  batchKeys: string[]
  manualKeys: string[]
  selectedCandidateByKey: Record<string, OfficialWarehouseProductCandidate>
  batchQuantityByKey: Record<string, number>
  manualQuantityByKey: Record<string, number>
  batchLimitByKey: Record<string, number>
}

export type AsnLineSelectionAction =
  | { type: 'reset' }
  | { type: 'mode'; mode: AsnCandidateSourceMode }
  | { type: 'prepare'; mode: AsnCandidateSourceMode; rows: OfficialWarehouseProductCandidate[] }
  | { type: 'selection'; mode: AsnCandidateSourceMode; keys: Key[]; rows: OfficialWarehouseProductCandidate[] }
  | { type: 'quantity'; mode: AsnCandidateSourceMode; key: string; quantity: number }
  | { type: 'clear-batch' }
  | { type: 'clear-all' }

export const initialAsnLineSelectionState: AsnLineSelectionState = {
  mode: 'manual',
  batchKeys: [],
  manualKeys: [],
  selectedCandidateByKey: {},
  batchQuantityByKey: {},
  manualQuantityByKey: {},
  batchLimitByKey: {}
}

function uniqueKeys(keys: Key[]) {
  return Array.from(new Set(keys.map(String)))
}

function retainedCandidates(
  current: Record<string, OfficialWarehouseProductCandidate>,
  rows: OfficialWarehouseProductCandidate[],
  retainedKeys: Set<string>
) {
  const next = { ...current }
  rows.forEach((row) => {
    next[officialWarehouseCandidateKey(row)] = row
  })
  Object.keys(next).forEach((key) => {
    if (!retainedKeys.has(key)) delete next[key]
  })
  return next
}

export function officialWarehouseAsnLineSelectionReducer(
  state: AsnLineSelectionState,
  action: AsnLineSelectionAction
): AsnLineSelectionState {
  if (action.type === 'reset') return initialAsnLineSelectionState
  if (action.type === 'mode') return { ...state, mode: action.mode }
  if (action.type === 'clear-all') {
    return { ...initialAsnLineSelectionState, mode: state.mode }
  }
  if (action.type === 'clear-batch') {
    const retainedKeys = new Set(state.manualKeys)
    return {
      ...state,
      batchKeys: [],
      batchQuantityByKey: {},
      batchLimitByKey: {},
      selectedCandidateByKey: retainedCandidates(state.selectedCandidateByKey, [], retainedKeys)
    }
  }
  if (action.type === 'prepare') {
    const quantityKey = action.mode === 'batch' ? 'batchQuantityByKey' : 'manualQuantityByKey'
    const quantities = { ...state[quantityKey] }
    const limits = { ...state.batchLimitByKey }
    action.rows.forEach((row) => {
      const key = officialWarehouseCandidateKey(row)
      const batchLimit = Math.max(0, Number(row.batchAvailableQuantity || 0))
      if (quantities[key] == null) quantities[key] = action.mode === 'batch' ? Math.max(1, batchLimit) : 1
      if (action.mode === 'batch') limits[key] = batchLimit
    })
    return { ...state, [quantityKey]: quantities, batchLimitByKey: limits }
  }
  if (action.type === 'selection') {
    const keys = uniqueKeys(action.keys)
    const batchKeys = action.mode === 'batch' ? keys : state.batchKeys
    const manualKeys = action.mode === 'manual' ? keys : state.manualKeys
    const retainedKeys = new Set([...batchKeys, ...manualKeys])
    return {
      ...state,
      batchKeys,
      manualKeys,
      selectedCandidateByKey: retainedCandidates(state.selectedCandidateByKey, action.rows, retainedKeys)
    }
  }
  const quantityKey = action.mode === 'batch' ? 'batchQuantityByKey' : 'manualQuantityByKey'
  return { ...state, [quantityKey]: { ...state[quantityKey], [action.key]: action.quantity } }
}

export function useOfficialWarehouseAsnLineSelection() {
  const [state, dispatch] = useReducer(
    officialWarehouseAsnLineSelectionReducer,
    initialAsnLineSelectionState
  )
  const selectedCandidateKeys = useMemo(
    () => Array.from(new Set([...state.batchKeys, ...state.manualKeys])),
    [state.batchKeys, state.manualKeys]
  )
  const selectedRows = selectedCandidateKeys
    .map((key) => state.selectedCandidateByKey[key])
    .filter((row): row is OfficialWarehouseProductCandidate => Boolean(row))

  return {
    candidateMode: state.mode,
    setCandidateMode: (mode: AsnCandidateSourceMode) => dispatch({ type: 'mode', mode }),
    selectedBatchCandidateKeys: state.batchKeys,
    selectedManualCandidateKeys: state.manualKeys,
    selectedCandidateKeys,
    visibleSelectedCandidateKeys: state.mode === 'batch' ? state.batchKeys : state.manualKeys,
    selectedCandidateByKey: state.selectedCandidateByKey,
    selectedRows,
    batchQuantityByCandidateKey: state.batchQuantityByKey,
    manualQuantityByCandidateKey: state.manualQuantityByKey,
    batchLimitByCandidateKey: state.batchLimitByKey,
    quantityByCandidateKey: state.mode === 'batch' ? state.batchQuantityByKey : state.manualQuantityByKey,
    prepareCandidates: (mode: AsnCandidateSourceMode, rows: OfficialWarehouseProductCandidate[]) =>
      dispatch({ type: 'prepare', mode, rows }),
    updateCandidateSelection: (keys: Key[], rows: OfficialWarehouseProductCandidate[]) =>
      dispatch({ type: 'selection', mode: state.mode, keys, rows }),
    setCandidateQuantity: (key: string, quantity: number) =>
      dispatch({ type: 'quantity', mode: state.mode, key, quantity }),
    clearBatchCandidateSelection: () => dispatch({ type: 'clear-batch' }),
    clearCandidateSelection: () => dispatch({ type: 'clear-all' }),
    resetCandidateSelection: () => dispatch({ type: 'reset' })
  }
}
