import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadOfficialWarehouseAppointments,
  officialWarehouseError,
  type OfficialWarehouseAppointment
} from '../api'
import { buildAppointmentHistorySummary } from '../domain'

export function useOfficialWarehouseAppointmentHistory({
  storeCode,
  siteCode
}: {
  storeCode: string
  siteCode: string
}) {
  const [appointments, setAppointments] = useState<
    OfficialWarehouseAppointment[]
  >([])
  const [appointmentHistoryLoading, setAppointmentHistoryLoading] =
    useState(false)
  const [appointmentHistoryOpen, setAppointmentHistoryOpen] = useState(false)
  const [appointmentStatusFilter, setAppointmentStatusFilter] =
    useState<string>()
  const [appointmentKeyword, setAppointmentKeyword] = useState('')
  const statusFilterInitializedRef = useRef(false)
  const appointmentHistorySummary = useMemo(
    () => buildAppointmentHistorySummary(appointments),
    [appointments]
  )

  useEffect(() => {
    void loadAppointmentHistory()
  }, [storeCode, siteCode])

  useEffect(() => {
    if (!statusFilterInitializedRef.current) {
      statusFilterInitializedRef.current = true
      return
    }
    void loadAppointmentHistory()
  }, [appointmentStatusFilter])

  async function loadAppointmentHistory() {
    setAppointmentHistoryLoading(true)
    try {
      const rows = await loadOfficialWarehouseAppointments({
        storeCode,
        siteCode,
        status: appointmentStatusFilter,
        keyword: appointmentKeyword
      })
      setAppointments(rows)
    } catch (error) {
      message.error(officialWarehouseError(error, '读取约仓历史失败'))
    } finally {
      setAppointmentHistoryLoading(false)
    }
  }

  return {
    appointments,
    appointmentHistoryLoading,
    appointmentHistoryOpen,
    setAppointmentHistoryOpen,
    appointmentStatusFilter,
    setAppointmentStatusFilter,
    appointmentKeyword,
    setAppointmentKeyword,
    appointmentHistorySummary,
    loadAppointmentHistory
  }
}
