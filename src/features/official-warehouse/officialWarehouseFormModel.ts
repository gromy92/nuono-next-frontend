import dayjs, { type Dayjs } from 'dayjs'
import type {
  OfficialWarehouseAppointmentAvailability,
  OfficialWarehouseApiProblem,
  OfficialWarehouseAsn,
  OfficialWarehouseMissingBatch,
  OfficialWarehouseProductCandidate
} from './api'

export type AppointmentFormState = {
  warehouseToPartnerCode: string
  warehouseToCode?: string
  apDates: [Dayjs, Dayjs] | null
  apTimeRange: string[]
  availableToday: boolean
  selectedSlotKey?: string
}

export type AppointmentSubmitMode = 'manual' | 'auto'

export type AppointmentSubmitFeedback = {
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
}

export type CreateAsnSubmitFeedback = {
  message: string
  problem?: OfficialWarehouseApiProblem
}

export type CreateAsnConfirmation = {
  selectedRows: OfficialWarehouseProductCandidate[]
  batchNos: string[]
  missingBatches: OfficialWarehouseMissingBatch[]
}

export type Ali1688SpecDraft = {
  productLengthCm?: number
  productWidthCm?: number
  productHeightCm?: number
  productWeightG?: number
  cartonLengthCm?: number
  cartonWidthCm?: number
  cartonHeightCm?: number
  cartonWeightKg?: number
  cartonQuantity?: number
}

export type AppointmentOpenRequest = {
  row: OfficialWarehouseAsn
  mode: AppointmentSubmitMode
}

export type CorrectionFormState = {
  status: string
  appointmentDate: Dayjs | null
  appointmentSlotId?: number
  appointmentTime: string
  failureType: string
  errorStage: string
  errorMessage: string
}

export function defaultAppointmentForm(): AppointmentFormState {
  return {
    warehouseToPartnerCode: '',
    warehouseToCode: undefined,
    apDates: [dayjs().add(1, 'day'), dayjs().add(30, 'day')],
    apTimeRange: [],
    availableToday: false,
    selectedSlotKey: undefined
  }
}

export function defaultCorrectionForm(): CorrectionFormState {
  return {
    status: 'PENDING',
    appointmentDate: null,
    appointmentSlotId: undefined,
    appointmentTime: '',
    failureType: '',
    errorStage: 'MANUAL_CORRECTION',
    errorMessage: ''
  }
}

export function hourToNoonToken(hour: number) {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

export function parseNoonTimeRange(value?: string) {
  if (!value?.trim()) {
    return []
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function availabilitySlotKey(slot: OfficialWarehouseAppointmentAvailability) {
  return `${slot.date || ''}|${slot.slotId || ''}|${slot.time || ''}`
}

export function splitSlotTime(value?: string): [string, string] {
  if (!value?.trim()) {
    return ['-', '-']
  }
  const parts = value.split('-').map((item) => item.trim()).filter(Boolean)
  return [parts[0] || value, parts[1] || '-']
}

export function compactAppointmentFeedbackMessage(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 240) {
    return normalized
  }
  return `${normalized.slice(0, 240)}...`
}
