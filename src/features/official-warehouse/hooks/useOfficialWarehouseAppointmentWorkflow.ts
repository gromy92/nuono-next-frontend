import { message } from 'antd'
import { useState } from 'react'
import {
  officialWarehouseError,
  submitManualOfficialWarehouseAppointment,
  upsertOfficialWarehouseAppointment,
  type OfficialWarehouseAsn
} from '../api'
import {
  buildManualAppointmentResultMessage
} from '../domain'
import {
  availabilitySlotKey,
  compactAppointmentFeedbackMessage,
  type AppointmentOpenRequest,
  type AppointmentSubmitMode
} from '../officialWarehouseFormModel'
import { isAutoAppointmentRunning } from '../officialWarehouseAsnPresentation'
import { useOfficialWarehouseAppointmentForm } from './useOfficialWarehouseAppointmentForm'

export function useOfficialWarehouseAppointmentWorkflow({
  reloadAll
}: {
  reloadAll: () => Promise<void>
}) {
  const [appointmentOpen, setAppointmentOpen] = useState(false)
  const [appointmentTarget, setAppointmentTarget] =
    useState<OfficialWarehouseAsn>()
  const [appointmentMode, setAppointmentMode] =
    useState<AppointmentSubmitMode>('auto')
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false)
  const [rescheduleConfirm, setRescheduleConfirm] =
    useState<AppointmentOpenRequest>()
  const form = useOfficialWarehouseAppointmentForm({
    appointmentOpen,
    appointmentTarget,
    appointmentMode
  })

  function requestOpenAppointment(
    row: OfficialWarehouseAsn,
    mode: AppointmentSubmitMode
  ) {
    if (mode === 'manual' && isAutoAppointmentRunning(row)) {
      message.warning('自动约仓处理中，不能手动约仓。')
      return
    }
    if (row.appointment?.status === 'SCHEDULED') {
      setRescheduleConfirm({ row, mode })
      return
    }
    openAppointment(row, mode)
  }

  function confirmRescheduleAppointment() {
    if (!rescheduleConfirm) return
    const next = rescheduleConfirm
    setRescheduleConfirm(undefined)
    openAppointment(next.row, next.mode)
  }

  function openAppointment(
    row: OfficialWarehouseAsn,
    mode: AppointmentSubmitMode
  ) {
    setAppointmentTarget(row)
    setAppointmentMode(mode)
    form.resetForAppointment(row)
    setAppointmentOpen(true)
  }

  async function submitAppointment() {
    if (!appointmentTarget) return
    if (!form.appointmentForm.apDates) {
      message.warning('请选择约仓日期范围')
      return
    }
    if (!form.appointmentForm.warehouseToPartnerCode.trim()) {
      message.warning('请选择到达仓库')
      return
    }
    const payload = form.buildAppointmentPayload()
    if (!payload) {
      message.warning('请选择约仓日期范围')
      return
    }
    setAppointmentSubmitting(true)
    try {
      if (appointmentMode === 'manual') {
        const selectedSlot = form.availabilitySlots.find(
          (slot) =>
            availabilitySlotKey(slot) ===
            form.appointmentForm.selectedSlotKey
        )
        if (!selectedSlot) {
          const warning = '当前没有可用仓位，请调整仓库或时间后重试'
          form.setAppointmentSubmitFeedback({
            type: 'warning',
            message: warning
          })
          message.warning(warning)
          return
        }
        form.setAppointmentSubmitFeedback(undefined)
        const result = await submitManualOfficialWarehouseAppointment(
          appointmentTarget.id,
          {
            ...payload,
            appointmentDate: selectedSlot.date,
            appointmentSlotId: selectedSlot.slotId,
            appointmentTime: selectedSlot.time
          }
        )
        const resultMessage = buildManualAppointmentResultMessage(result)
        if (result.status === 'SCHEDULED') {
          message.success(resultMessage)
          setAppointmentOpen(false)
        } else if (result.failureType === 'NO_CAPACITY') {
          form.setAppointmentSubmitFeedback({
            type: 'warning',
            message: resultMessage
          })
          message.warning(resultMessage)
        } else {
          form.setAppointmentSubmitFeedback({
            type: 'error',
            message: compactAppointmentFeedbackMessage(resultMessage)
          })
          message.error(resultMessage)
        }
      } else {
        await upsertOfficialWarehouseAppointment(appointmentTarget.id, payload)
        message.success('自动约仓已提交')
        setAppointmentOpen(false)
      }
      await reloadAll()
    } catch (error) {
      const errorMessage = officialWarehouseError(
        error,
        appointmentMode === 'manual'
          ? '手动约仓失败'
          : '提交自动约仓失败'
      )
      form.setAppointmentSubmitFeedback({
        type: 'error',
        message: compactAppointmentFeedbackMessage(errorMessage)
      })
      message.error(errorMessage)
    } finally {
      setAppointmentSubmitting(false)
    }
  }

  return {
    appointmentOpen, setAppointmentOpen, appointmentTarget, appointmentMode,
    appointmentSubmitting, rescheduleConfirm, setRescheduleConfirm,
    requestOpenAppointment, confirmRescheduleAppointment, submitAppointment,
    ...form
  }
}
