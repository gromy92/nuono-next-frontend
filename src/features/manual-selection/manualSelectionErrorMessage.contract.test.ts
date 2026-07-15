import assert from 'node:assert/strict'
import { normalizeManualSelectionPageErrorMessage } from './manualSelectionErrorMessage'

assert.equal(
  normalizeManualSelectionPageErrorMessage('No message available', '读取选品分析失败'),
  '当前后端未部署选品组接口，请重启当前分支后端或切换到包含 /api/product-selection/groups 的服务。'
)

assert.equal(
  normalizeManualSelectionPageErrorMessage('Request failed: 404', '读取选品分析失败'),
  '当前后端未部署选品组接口，请重启当前分支后端或切换到包含 /api/product-selection/groups 的服务。'
)

assert.equal(
  normalizeManualSelectionPageErrorMessage('Request failed: 500', '读取选品分析失败'),
  '当前后端服务异常或未启动，请确认本地后端已启动并指向当前分支服务后再重试。'
)

assert.equal(
  normalizeManualSelectionPageErrorMessage('', '读取选品分析失败'),
  '读取选品分析失败'
)

assert.equal(
  normalizeManualSelectionPageErrorMessage('保存竞品失败', '读取选品分析失败'),
  '保存竞品失败'
)
