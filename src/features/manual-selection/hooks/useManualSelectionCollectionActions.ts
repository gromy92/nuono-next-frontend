import { message } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useMemo, useState } from 'react'
import type {
  ProductSelectionSourceCollection
} from '../../source-collection/types'
import { buildManualSelectionUrlCollectionValue } from '../collectionFilters'
import {
  createManualSelectionSourceCollection,
  recollectManualSelectionSourceCollection,
  replaceManualSelectionCollection,
  upsertManualSelectionCollection
} from '../collectionMutations'
import type {
  ManualSelectionPageProps,
  NewCollectionValues
} from '../types'

type UseManualSelectionCollectionActionsProps = ManualSelectionPageProps & {
  setCollections: Dispatch<SetStateAction<ProductSelectionSourceCollection[]>>
}

export function useManualSelectionCollectionActions(props: UseManualSelectionCollectionActionsProps) {
  const {
    storeName,
    storeCode,
    operatorName = '系统管理员',
    setCollections
  } = props
  const [submitting, setSubmitting] = useState(false)
  const mutationContext = useMemo(
    () => ({
      storeName,
      storeCode,
      operatorName
    }),
    [operatorName, storeCode, storeName]
  )

  const createNewCollection = useCallback(
    async (values: NewCollectionValues) => {
      const siteLink = (values.siteLink || '').trim()
      if (!siteLink) {
        message.warning('请输入三方链接')
        return false
      }
      setSubmitting(true)
      try {
        const nextCollection = await createManualSelectionSourceCollection(
          buildManualSelectionUrlCollectionValue(siteLink, { titleCn: values.titleCn?.trim() }),
          mutationContext
        )
        setCollections((current) => upsertManualSelectionCollection(current, nextCollection))
        message.success('新增采集任务已提交')
        return true
      } catch (error) {
        message.error(error instanceof Error ? error.message : '新增采集失败')
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [mutationContext, setCollections]
  )

  const recollect = useCallback(
    async (record: ProductSelectionSourceCollection) => {
      setSubmitting(true)
      try {
        const nextCollection = await recollectManualSelectionSourceCollection(record, mutationContext)
        setCollections((current) => replaceManualSelectionCollection(current, nextCollection))
        message.success('重新采集任务已提交')
      } catch (error) {
        message.error(error instanceof Error ? error.message : '重新采集失败')
      } finally {
        setSubmitting(false)
      }
    },
    [mutationContext, setCollections]
  )

  return {
    submitting,
    createNewCollection,
    recollect
  }
}
