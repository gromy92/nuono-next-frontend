import { isGroupEndpointMissingError } from './manualSelectionGroupRepository'

const GROUP_ENDPOINT_MISSING_MESSAGE =
  '当前后端未部署选品组接口，请重启当前分支后端或切换到包含 /api/product-selection/groups 的服务。'
const BACKEND_UNAVAILABLE_MESSAGE =
  '当前后端服务异常或未启动，请确认本地后端已启动并指向当前分支服务后再重试。'

export function normalizeManualSelectionPageErrorMessage(messageText: string | undefined, fallback: string) {
  const normalized = (messageText || '').trim()
  if (!normalized) {
    return fallback
  }
  if (isGroupEndpointMissingError(normalized)) {
    return GROUP_ENDPOINT_MISSING_MESSAGE
  }
  if (/request failed: 500|internal server error|failed to fetch/i.test(normalized)) {
    return BACKEND_UNAVAILABLE_MESSAGE
  }
  return normalized
}
