import { Button, Drawer, Input, Space, Tag, Typography } from 'antd'
import { lifecycleItemDisplayName, lifecycleStageTagColor, configTypeTag, statusTag } from '../versionLibraryPresentation'
import type { useOperationConfigEditorActions } from '../hooks/useOperationConfigEditorActions'
import type { useOperationConfigLibraryController } from '../hooks/useOperationConfigLibraryController'

const { Text } = Typography

export function LifecycleVersionEditor({ state, actions }: {
  state: ReturnType<typeof useOperationConfigLibraryController>
  actions: ReturnType<typeof useOperationConfigEditorActions>
}) {
  const { lifecycleEditor, setLifecycleEditor, editorLoading, editorSaving } = state
  const { updateLifecycleEditorMeta, updateLifecycleItem, saveLifecycleEditor } = actions
  return (
        <Drawer
          title={lifecycleEditor?.displayName || '生命周期配置'}
          open={Boolean(lifecycleEditor)}
          onClose={() => setLifecycleEditor(null)}
          width={760}
          loading={editorLoading}
        >
          {lifecycleEditor ? (
            <Space
              direction="vertical"
              size={16}
              className="operations-config-suite-layout"
              data-testid="operation-config-lifecycle-threshold-editor"
            >
              <div className="operation-config-lifecycle-editor-header" data-testid="operation-config-lifecycle-editor-header">
                <div className="operation-config-version-editor-header-main">
                  <Space>
                    {configTypeTag(lifecycleEditor)}
                    {statusTag(lifecycleEditor)}
                  </Space>
                  <div className="operation-config-version-editor-meta">
                    <Input
                      data-testid="operation-config-lifecycle-display-name"
                      value={lifecycleEditor.displayName || ''}
                      placeholder="版本名称"
                      onChange={(event) => updateLifecycleEditorMeta({ displayName: event.target.value })}
                    />
                    <Input
                      data-testid="operation-config-lifecycle-summary"
                      value={lifecycleEditor.summary || ''}
                      placeholder="摘要"
                      onChange={(event) => updateLifecycleEditorMeta({ summary: event.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Space direction="vertical" size={12}>
                {lifecycleEditor.items.map((item, index) => (
                  <div className="operation-config-lifecycle-version-editor-row" key={`${item.groupName || 'row'}-${index}`}>
                    <div className="operation-config-lifecycle-readonly-cell" data-testid={`operation-config-lifecycle-item-group-${index}`}>
                      <Tag color={lifecycleStageTagColor(item.groupName)}>{`[${item.groupName || '默认阶段'}]`}</Tag>
                    </div>
                    <div className="operation-config-lifecycle-name-cell" data-testid={`operation-config-lifecycle-item-name-${index}`}>
                      <Text>{lifecycleItemDisplayName(item)}</Text>
                    </div>
                    <Input
                      data-testid={`operation-config-lifecycle-item-default-value-${index}`}
                      value={item.defaultValue || ''}
                      placeholder="阈值"
                      onChange={(event) => updateLifecycleItem(index, { defaultValue: event.target.value })}
                    />
                  </div>
                ))}
              </Space>
              <Space>
                <Button onClick={() => setLifecycleEditor(null)} disabled={editorSaving}>
                  取消
                </Button>
                <Button type="primary" data-testid="operation-config-lifecycle-save" loading={editorSaving} onClick={saveLifecycleEditor}>
                  保存
                </Button>
              </Space>
            </Space>
          ) : null}
        </Drawer>
  )
}
