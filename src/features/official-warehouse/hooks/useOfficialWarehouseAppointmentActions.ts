import { message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import {
  cancelOfficialWarehouseAppointment,
  correctOfficialWarehouseAppointment,
  loadOfficialWarehouseAsn,
  officialWarehouseError,
  runOfficialWarehouseAppointmentOnce,
  type CorrectOfficialWarehouseAppointmentPayload,
  type OfficialWarehouseAppointment,
  type OfficialWarehouseAsn
} from '../api'
import {
  buildAppointmentRunOnceFeedback
} from '../domain'
import { officialWarehouseAppointmentRequiresReconciliation } from '../officialWarehouseAppointmentLifecycle'
import {
  businessErrorText
} from '../officialWarehouseAsnPresentation'
import {
  defaultCorrectionForm,
  type AppointmentSubmitFeedback,
  type CorrectionFormState
} from '../officialWarehouseFormModel'
import { printFbnTransferPdf } from '../printFbnTransferPdf'

export function useOfficialWarehouseAppointmentActions({
  reloadAll,
  reloadHistory
}: {
  reloadAll: () => Promise<void>
  reloadHistory: () => Promise<void>
}) {
  const [durationNow, setDurationNow] = useState(dayjs)
  const [appointmentRunFeedback, setAppointmentRunFeedback] =
    useState<AppointmentSubmitFeedback>()
  const [appointmentRunningId, setAppointmentRunningId] = useState<string>()
  const [pdfPrintingAsnId, setPdfPrintingAsnId] = useState<string>()
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [correctionTarget, setCorrectionTarget] =
    useState<OfficialWarehouseAppointment>()
  const [correctionForm, setCorrectionForm] = useState<CorrectionFormState>(
    defaultCorrectionForm
  )
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setDurationNow(dayjs()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  async function runAppointmentNow(
    appointment: OfficialWarehouseAppointment
  ) {
    setAppointmentRunningId(appointment.id)
    setAppointmentRunFeedback(undefined)
    try {
      const result = await runOfficialWarehouseAppointmentOnce(appointment.id)
      const feedback = buildAppointmentRunOnceFeedback(result)
      const feedbackPrefix = feedback.message.split('。原因：')[0]
      const feedbackDetail =
        result.errorMessage || result.failureType
          ? businessErrorText(result.errorMessage, result.failureType)
          : ''
      const feedbackMessage =
        feedbackDetail && feedback.type !== 'success'
          ? `${feedbackPrefix}。原因：${feedbackDetail}`
          : feedback.message
      setAppointmentRunFeedback({
        type: feedback.type,
        message: feedbackMessage
      })
      if (feedback.type === 'success') message.success(feedbackMessage)
      else if (feedback.type === 'warning') message.warning(feedbackMessage)
      else message.error(feedbackMessage)
      await reloadAll()
    } catch (error) {
      const errorMessage = officialWarehouseError(
        error,
        '执行自动约仓失败'
      )
      setAppointmentRunFeedback({ type: 'error', message: errorMessage })
      message.error(errorMessage)
      await reloadAll()
    } finally {
      setAppointmentRunningId(undefined)
    }
  }

  async function cancelAppointment(
    appointment: OfficialWarehouseAppointment
  ) {
    setAppointmentRunningId(appointment.id)
    try {
      await cancelOfficialWarehouseAppointment(appointment.id)
      message.success('自动约仓已取消')
      await reloadAll()
    } catch (error) {
      message.error(officialWarehouseError(error, '取消自动约仓失败'))
      await reloadHistory()
    } finally {
      setAppointmentRunningId(undefined)
    }
  }

  async function downloadFbnTransferPdf(row: OfficialWarehouseAsn) {
    if (row.appointment?.status !== 'SCHEDULED') {
      message.warning('只有约仓成功后才能下载 PDF')
      return
    }
    setPdfPrintingAsnId(row.id)
    try {
      const detail = await loadOfficialWarehouseAsn(row.id)
      if (detail.appointment?.status !== 'SCHEDULED') {
        message.warning(
          '当前 ASN 尚未确认约仓成功，请先同步 ASN 列表后再下载 PDF'
        )
        return
      }
      await printFbnTransferPdf(detail, {
        printedBy: detail.noonUser || ''
      })
    } catch (error) {
      message.error(officialWarehouseError(error, '生成约仓 PDF 失败'))
    } finally {
      setPdfPrintingAsnId(undefined)
    }
  }

  function openCorrection(appointment: OfficialWarehouseAppointment) {
    const reconciliationRequired =
      officialWarehouseAppointmentRequiresReconciliation(appointment)
    setCorrectionTarget(appointment)
    setCorrectionForm({
      status: appointment.status || 'PENDING',
      appointmentDate: appointment.appointmentDate
        ? dayjs(appointment.appointmentDate)
        : null,
      appointmentSlotId: appointment.appointmentSlotId,
      appointmentTime: appointment.appointmentTime || '',
      failureType: reconciliationRequired
        ? 'MANUAL_RECONCILED_FAILED'
        : appointment.failureType || '',
      errorStage: reconciliationRequired
        ? 'MANUAL_RECONCILIATION'
        : appointment.errorStage || 'MANUAL_CORRECTION',
      errorMessage: reconciliationRequired ? '' : appointment.errorMessage || '',
      reconciliationConfirmed: false
    })
    setCorrectionOpen(true)
  }

  async function submitCorrection() {
    if (!correctionTarget) return
    const reconciliationRequired =
      officialWarehouseAppointmentRequiresReconciliation(correctionTarget)
    if (reconciliationRequired && !correctionForm.reconciliationConfirmed) {
      message.warning('请先确认已在 Noon 后台核对当前约仓结果')
      return
    }
    if (
      correctionForm.status === 'SCHEDULED' &&
      !correctionForm.appointmentDate
    ) {
      message.warning('订正为约仓成功时必须填写约仓日期')
      return
    }
    if (
      reconciliationRequired &&
      correctionForm.status === 'FAILED' &&
      !correctionForm.errorMessage.trim()
    ) {
      message.warning('请填写 Noon 对账结论')
      return
    }
    const payload: CorrectOfficialWarehouseAppointmentPayload = {
      status: correctionForm.status,
      reconciliationConfirmed: reconciliationRequired || undefined
    }
    if (correctionForm.status === 'SCHEDULED') {
      payload.appointmentDate =
        correctionForm.appointmentDate?.format('YYYY-MM-DD')
      payload.appointmentSlotId = correctionForm.appointmentSlotId
      payload.appointmentTime = correctionForm.appointmentTime.trim()
    }
    if (correctionForm.status === 'FAILED') {
      payload.failureType =
        correctionForm.failureType.trim() || 'MANUAL_CORRECTION'
      payload.errorStage =
        correctionForm.errorStage.trim() || 'MANUAL_CORRECTION'
      payload.errorMessage = correctionForm.errorMessage.trim()
    }
    setCorrectionSubmitting(true)
    try {
      await correctOfficialWarehouseAppointment(correctionTarget.id, payload)
      message.success(reconciliationRequired ? 'Noon 对账结果已订正' : '约仓记录已订正')
      setCorrectionOpen(false)
      await reloadAll()
    } catch (error) {
      message.error(officialWarehouseError(error, '订正约仓记录失败'))
    } finally {
      setCorrectionSubmitting(false)
    }
  }

  return {
    durationNow, appointmentRunFeedback, setAppointmentRunFeedback,
    appointmentRunningId, pdfPrintingAsnId, correctionOpen, setCorrectionOpen,
    correctionTarget, correctionForm, setCorrectionForm, correctionSubmitting,
    runAppointmentNow, cancelAppointment, downloadFbnTransferPdf,
    openCorrection, submitCorrection
  }
}
