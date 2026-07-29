export type OfficialWarehouseAppointment = {
  id: string
  asnId?: string
  localAsnNo?: string
  noonAsnNr?: string
  storeCode?: string
  siteCode?: string
  status: string
  warehouseToPartnerCode: string
  warehouseToCode?: string
  apStartDate: string
  apEndDate: string
  apTimeRange?: string
  availableToday?: boolean
  appointmentDate?: string
  appointmentSlotId?: number
  appointmentTime?: string
  gate?: string
  docks?: string
  attemptCount?: number
  lastAttemptAt?: string
  nextAttemptAt?: string
  apSuccessTime?: string
  failureType?: string
  errorStage?: string
  errorMessage?: string
  createdAt?: string
  updatedAt?: string
}

export type OfficialWarehouseAppointmentAvailability = {
  date?: string
  slotId?: number
  time?: string
  label?: string
}

export type NoonHttpCallLog = {
  id: string
  occurredAt?: string
  sourceModule?: string
  operation?: string
  storeCode?: string
  siteCode?: string
  projectCode?: string
  partnerId?: string
  businessType?: string
  businessId?: string
  businessRef?: string
  httpMethod?: string
  host?: string
  path?: string
  responseStatusCode?: number
  elapsedMs?: number
  status?: string
  failureType?: string
  errorMessage?: string
  requestSummaryJson?: string
  responseSummaryJson?: string
}

export type UpsertOfficialWarehouseAppointmentPayload = {
  warehouseToPartnerCode: string
  warehouseToCode?: string
  apStartDate: string
  apEndDate: string
  apTimeRange?: string
  availableToday?: boolean
  appointmentDate?: string
  appointmentSlotId?: number
  appointmentTime?: string
}

export type CorrectOfficialWarehouseAppointmentPayload = {
  status: string
  appointmentDate?: string
  appointmentSlotId?: number
  appointmentTime?: string
  failureType?: string
  errorStage?: string
  errorMessage?: string
}
