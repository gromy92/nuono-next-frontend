import { useState } from 'react'
import { Form, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { saveInTransitActualArrival, saveInTransitEstimatedArrival } from './api'
import type { InTransitBatch, InTransitBatchFilters } from './types'

type EstimatedArrivalFormValues = {
  maintenanceType?: 'estimated' | 'actual'
  arrivalAt?: Dayjs
  note?: string
}

export function useInTransitEstimatedArrival(
  filters: InTransitBatchFilters,
  load: (filters: InTransitBatchFilters) => Promise<void>
) {
  const [modalOpen, setModalOpen] = useState(false)
  const [targetBatch, setTargetBatch] = useState<InTransitBatch | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<EstimatedArrivalFormValues>()

  const openEstimatedArrival = (row: InTransitBatch) => {
    setTargetBatch(row)
    form.resetFields()
    const parsedArrival = row.estimatedArrivalAt ? dayjs(row.estimatedArrivalAt) : null
    form.setFieldsValue({
      maintenanceType: 'estimated',
      arrivalAt: parsedArrival?.isValid() ? parsedArrival : undefined,
      note: row.estimatedArrivalSource === 'MANUAL' ? row.estimatedArrivalSourceDetail ?? undefined : undefined
    })
    setModalOpen(true)
  }

  const closeEstimatedArrival = () => {
    setModalOpen(false)
    setTargetBatch(null)
    form.resetFields()
  }

  const submitEstimatedArrival = async () => {
    if (!targetBatch) {
      return
    }
    const values = await form.validateFields()
    if (!values.arrivalAt) {
      return
    }
    setSubmitting(true)
    try {
      if (values.maintenanceType === 'actual') {
        await saveInTransitActualArrival(targetBatch.batchId, {
          actualArrivalAt: values.arrivalAt.format('YYYY-MM-DDTHH:mm:ss'),
          note: values.note?.trim() || undefined
        })
        message.success('实际到达时间已维护')
      } else {
        await saveInTransitEstimatedArrival(targetBatch.batchId, {
          estimatedArrivalAt: values.arrivalAt.startOf('day').format('YYYY-MM-DDT00:00:00'),
          note: values.note?.trim() || undefined
        })
        message.success('预计到达时间已维护')
      }
      closeEstimatedArrival()
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '到达时间保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    form,
    modalOpen,
    targetBatch,
    submitting,
    openEstimatedArrival,
    closeEstimatedArrival,
    submitEstimatedArrival
  }
}
