import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchInTransitLogisticsAutoSyncAccounts } from './api'
import type { InTransitLogisticsAutoSyncAccount } from './types'

type AutoSyncAlertState =
  | { status: 'idle'; accounts: InTransitLogisticsAutoSyncAccount[] }
  | { status: 'loading'; accounts: InTransitLogisticsAutoSyncAccount[] }
  | { status: 'success'; accounts: InTransitLogisticsAutoSyncAccount[] }
  | { status: 'error'; accounts: InTransitLogisticsAutoSyncAccount[]; message: string }

export function useInTransitAutoSyncAlerts(enabled: boolean) {
  const requestId = useRef(0)
  const [state, setState] = useState<AutoSyncAlertState>({ status: 'idle', accounts: [] })

  const load = useCallback(async () => {
    if (!enabled) {
      return
    }
    const currentRequestId = ++requestId.current
    setState((current) => ({ status: 'loading', accounts: current.accounts }))
    try {
      const accounts = await fetchInTransitLogisticsAutoSyncAccounts()
      if (requestId.current === currentRequestId) {
        setState({ status: 'success', accounts: accounts ?? [] })
      }
    } catch (error) {
      if (requestId.current === currentRequestId) {
        setState((current) => ({
          status: 'error',
          accounts: current.accounts,
          message: error instanceof Error ? error.message : '货代自动同步告警加载失败'
        }))
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      requestId.current += 1
      return
    }
    void load()
    return () => {
      requestId.current += 1
    }
  }, [enabled, load])

  return { state, load }
}
