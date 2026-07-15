import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./ProductBilingualContentEditor.tsx', import.meta.url), 'utf8')

assert(
  source.includes('const [saveConfirmError') &&
    source.includes('setSaveConfirmError(null)') &&
    source.includes('setSaveConfirmError(errorMessage)'),
  '保存确认弹窗必须维护明确的保存失败状态'
)

assert(
  source.includes('errorMessage={saveConfirmError}') &&
    source.includes('保存失败，请处理后重试'),
  '保存确认弹窗必须在弹窗内展示失败原因，避免用户点击确认保存后没有反馈'
)

assert(
  source.includes('关键词或竞品保存失败') &&
    source.includes('antdMessage.error(errorMessage)'),
  '关键词或竞品保存失败时必须同时给 toast 和弹窗错误提示'
)
