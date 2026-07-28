import { disableOperationConfigVersion, publishOperationConfigVersion } from '../api'
import { detailToRow } from '../calendarConfigDomain'
import type { OperationConfigVersionRow } from '../types'
import type { useOperationConfigLibraryController } from './useOperationConfigLibraryController'

export function useOperationConfigPublishActions(
  state: ReturnType<typeof useOperationConfigLibraryController>
) {
  const {
    scope, publishCandidate, setPublishCandidate, setPublishingVersionNo,
    setDisablingVersionNo, setVersions, setDetail, shouldKeepVersion, setError
  } = state
  const publishScopePayload = () => {
    if (scope?.systemAdmin) {
      return {}
    }
    const fallbackStore = scope?.stores?.[0]
    const ownerUserId = scope?.defaultOwnerUserId ?? fallbackStore?.ownerUserId
    const storeCode = scope?.defaultStoreCode ?? fallbackStore?.storeCode
    const siteCode = scope?.defaultSiteCode ?? fallbackStore?.siteCode
    if (!ownerUserId || !storeCode || !siteCode) {
      return null
    }
    return { ownerUserId, storeCode, siteCode }
  }

  const confirmPublish = async () => {
    if (!publishCandidate) {
      return
    }
    const scopePayload = publishScopePayload()
    if (scopePayload === null) {
      setError('缺少可发布的授权店铺范围')
      return
    }
    setPublishingVersionNo(publishCandidate.versionNo)
    setError(undefined)
    try {
      const published = await publishOperationConfigVersion(publishCandidate.versionNo, {
        ...scopePayload,
        message: 'publish typed operation config version'
      })
      const publishedRow = detailToRow(published)
      setVersions((current) => current.map((item) => (item.versionNo === published.versionNo ? publishedRow : item)).filter(shouldKeepVersion))
      setDetail((current) => (current?.versionNo === published.versionNo ? published : current))
      setPublishCandidate(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本发布失败')
    } finally {
      setPublishingVersionNo(undefined)
    }
  }

  const disableVersion = async (record: OperationConfigVersionRow) => {
    setDisablingVersionNo(record.versionNo)
    setError(undefined)
    try {
      const disabled = await disableOperationConfigVersion(record.versionNo, { reason: '停用版本' })
      const disabledRow = detailToRow(disabled)
      setVersions((current) => current.map((item) => (item.versionNo === disabled.versionNo ? disabledRow : item)).filter(shouldKeepVersion))
      setDetail((current) => (current?.versionNo === disabled.versionNo ? disabled : current))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本停用失败')
    } finally {
      setDisablingVersionNo(undefined)
    }
  }

  return { confirmPublish, disableVersion }
}
