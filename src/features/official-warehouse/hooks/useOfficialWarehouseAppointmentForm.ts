import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import {
  queryOfficialWarehouseAppointmentAvailability,
  officialWarehouseError,
  type OfficialWarehouseAsn,
  type OfficialWarehouseAppointmentAvailability,
  type OfficialWarehouseRoutingWarehouse,
  type UpsertOfficialWarehouseAppointmentPayload
} from '../api'
import {
  availabilitySlotKey,
  defaultAppointmentForm,
  hourToNoonToken,
  parseNoonTimeRange,
  type AppointmentFormState,
  type AppointmentSubmitFeedback,
  type AppointmentSubmitMode
} from '../officialWarehouseFormModel'

export function useOfficialWarehouseAppointmentForm({
  appointmentOpen,
  appointmentTarget,
  appointmentMode
}: {
  appointmentOpen: boolean
  appointmentTarget?: OfficialWarehouseAsn
  appointmentMode: AppointmentSubmitMode
}) {
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(
    defaultAppointmentForm
  )
  const [appointmentSubmitFeedback, setAppointmentSubmitFeedback] =
    useState<AppointmentSubmitFeedback>()
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<
    OfficialWarehouseAppointmentAvailability[]
  >([])
  const [availabilityError, setAvailabilityError] = useState<string>()
  const [manualDateOffset, setManualDateOffset] = useState(0)
  const [manualSelectedDate, setManualSelectedDate] = useState<string>()
  const availabilityInFlightKeyRef = useRef<string | null>(null)

  const appointmentTimeOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        label: `${hour.toString().padStart(2, '0')}:00`,
        value: hourToNoonToken(hour)
      })),
    []
  )
  const appointmentWarehouseOptions = useMemo(() => {
    const warehouses = appointmentTarget?.routingWarehouses || []
    const partnerCode = appointmentTarget?.selectedWarehousePartnerCode?.trim()
    const warehouseCode = appointmentTarget?.selectedWarehouseCode?.trim()
    const matches = (warehouse: OfficialWarehouseRoutingWarehouse) =>
      Boolean(
        (partnerCode && warehouse.partnerCode === partnerCode) ||
          (warehouseCode && warehouse.code === warehouseCode)
      )
    const needsFallback =
      Boolean(partnerCode || warehouseCode) && !warehouses.some(matches)
    const options = needsFallback
      ? [{ partnerCode, code: warehouseCode }, ...warehouses]
      : warehouses
    return options
      .map((warehouse) => ({
        label: `${warehouse.partnerCode || '-'} / ${warehouse.code || '-'}`,
        value: warehouse.partnerCode || warehouse.code || '',
        code: warehouse.code
      }))
      .filter((item) => item.value)
  }, [appointmentTarget])

  const manualCalendarDates = useMemo(() => {
    if (!appointmentForm.apDates) return []
    const start = appointmentForm.apDates[0].startOf('day')
    const end = appointmentForm.apDates[1].startOf('day')
    const days = end.diff(start, 'day')
    if (days < 0) return []
    return Array.from({ length: Math.min(days + 1, 60) }, (_, index) =>
      start.add(index, 'day').format('YYYY-MM-DD')
    )
  }, [appointmentForm.apDates])
  const selectedManualSlot = useMemo(
    () =>
      availabilitySlots.find(
        (slot) => availabilitySlotKey(slot) === appointmentForm.selectedSlotKey
      ),
    [availabilitySlots, appointmentForm.selectedSlotKey]
  )
  const selectedManualDate =
    selectedManualSlot?.date ||
    manualSelectedDate ||
    manualCalendarDates[manualDateOffset] ||
    manualCalendarDates[0]
  const manualVisibleDates = manualCalendarDates.slice(
    manualDateOffset,
    manualDateOffset + 5
  )
  const manualSlotsForSelectedDate = availabilitySlots.filter(
    (slot) => slot.date === selectedManualDate
  )
  const manualMonthLabel = selectedManualDate
    ? dayjs(selectedManualDate).format('MMMM YYYY')
    : dayjs().format('MMMM YYYY')
  const manualAvailabilityQueryKey = useMemo(() => {
    if (
      appointmentMode !== 'manual' ||
      !appointmentOpen ||
      !appointmentTarget ||
      !appointmentForm.apDates ||
      !appointmentForm.warehouseToPartnerCode.trim()
    ) {
      return ''
    }
    return [
      appointmentTarget.id,
      appointmentForm.warehouseToPartnerCode.trim(),
      appointmentForm.warehouseToCode || '',
      selectedManualDate || '',
      appointmentForm.apTimeRange.join(','),
      appointmentForm.availableToday ? '1' : '0'
    ].join('|')
  }, [
    appointmentMode,
    appointmentOpen,
    appointmentTarget,
    appointmentForm,
    selectedManualDate
  ])

  useEffect(() => {
    if (!manualAvailabilityQueryKey) {
      setAvailabilitySlots([])
      setAvailabilityError(undefined)
      return
    }
    const timer = window.setTimeout(() => void loadManualAvailability(), 350)
    return () => window.clearTimeout(timer)
  }, [manualAvailabilityQueryKey])

  function buildAppointmentPayload(): UpsertOfficialWarehouseAppointmentPayload | null {
    if (!appointmentForm.apDates) return null
    return {
      warehouseToPartnerCode: appointmentForm.warehouseToPartnerCode.trim(),
      warehouseToCode: appointmentForm.warehouseToCode,
      apStartDate: appointmentForm.apDates[0].format('YYYY-MM-DD'),
      apEndDate: appointmentForm.apDates[1].format('YYYY-MM-DD'),
      apTimeRange: appointmentForm.apTimeRange.join(','),
      availableToday: appointmentForm.availableToday
    }
  }

  async function loadManualAvailability() {
    if (!appointmentTarget) return
    const requestKey = manualAvailabilityQueryKey
    if (!requestKey || availabilityInFlightKeyRef.current === requestKey) return
    const payload = buildAppointmentPayload()
    if (!payload || !payload.warehouseToPartnerCode || !selectedManualDate) return
    payload.apStartDate = selectedManualDate
    payload.apEndDate = selectedManualDate
    availabilityInFlightKeyRef.current = requestKey
    setAvailabilityLoading(true)
    setAvailabilityError(undefined)
    setAppointmentSubmitFeedback(undefined)
    try {
      const rows = await queryOfficialWarehouseAppointmentAvailability(
        appointmentTarget.id,
        payload
      )
      setAvailabilitySlots(rows)
      setAppointmentForm((current) => {
        const selectedStillAvailable = rows.some(
          (slot) => availabilitySlotKey(slot) === current.selectedSlotKey
        )
        return {
          ...current,
          selectedSlotKey: selectedStillAvailable
            ? current.selectedSlotKey
            : rows[0]
              ? availabilitySlotKey(rows[0])
              : undefined
        }
      })
    } catch (error) {
      setAvailabilitySlots([])
      setAppointmentForm((current) => ({
        ...current,
        selectedSlotKey: undefined
      }))
      setAvailabilityError(
        officialWarehouseError(error, '查询约仓仓位失败')
      )
    } finally {
      if (availabilityInFlightKeyRef.current === requestKey) {
        availabilityInFlightKeyRef.current = null
      }
      setAvailabilityLoading(false)
    }
  }

  function resetForAppointment(row: OfficialWarehouseAsn) {
    const firstWarehouse = row.routingWarehouses?.[0]
    const appointment = row.appointment
    setAppointmentForm({
      warehouseToPartnerCode:
        appointment?.warehouseToPartnerCode ||
        row.selectedWarehousePartnerCode ||
        firstWarehouse?.partnerCode ||
        '',
      warehouseToCode:
        appointment?.warehouseToCode ||
        row.selectedWarehouseCode ||
        firstWarehouse?.code,
      apDates:
        appointment?.apStartDate && appointment.apEndDate
          ? [dayjs(appointment.apStartDate), dayjs(appointment.apEndDate)]
          : [dayjs().add(1, 'day'), dayjs().add(30, 'day')],
      apTimeRange: parseNoonTimeRange(appointment?.apTimeRange),
      availableToday: Boolean(appointment?.availableToday),
      selectedSlotKey: undefined
    })
    setAvailabilitySlots([])
    setAvailabilityError(undefined)
    setAppointmentSubmitFeedback(undefined)
    setManualDateOffset(0)
    setManualSelectedDate(undefined)
  }

  return {
    appointmentForm, setAppointmentForm, appointmentSubmitFeedback,
    setAppointmentSubmitFeedback, availabilityLoading, availabilitySlots,
    setAvailabilitySlots, availabilityError, setAvailabilityError,
    manualDateOffset, setManualDateOffset, manualSelectedDate,
    setManualSelectedDate, appointmentTimeOptions, appointmentWarehouseOptions,
    manualCalendarDates, selectedManualDate, manualVisibleDates,
    manualSlotsForSelectedDate, manualMonthLabel, manualAvailabilityQueryKey,
    buildAppointmentPayload, resetForAppointment
  }
}
