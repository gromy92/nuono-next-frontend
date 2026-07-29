import { Input, InputNumber, Modal, Typography } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import type { ManualSelectionAli1688ProcurementInfo } from '../types'

const { Text } = Typography

export type Ali1688EditorState = {
  groupId: string
  groupName: string
  purchaseUrl: string
  purchasePrice?: number
}

export type GroupNameEditorState = {
  groupId: string
  groupName: string
  draftName: string
}

type Props = {
  ali1688Editor: Ali1688EditorState | null
  setAli1688Editor: Dispatch<SetStateAction<Ali1688EditorState | null>>
  groupNameEditor: GroupNameEditorState | null
  setGroupNameEditor: Dispatch<SetStateAction<GroupNameEditorState | null>>
  groupNameSaving: boolean
  setGroupNameSaving: (saving: boolean) => void
  groupNameError: string
  setGroupNameError: (message: string) => void
  onChangeGroupProcurementInfo: (groupId: string, values: Partial<ManualSelectionAli1688ProcurementInfo>) => void
  onChangeGroupName: (groupId: string, groupName: string) => Promise<void> | void
}

export function ManualSelectionAnalysisEditors(props: Props) {
  const handleSaveGroupName = async () => {
    if (!props.groupNameEditor) {
      return
    }
    const nextName = props.groupNameEditor.draftName.trim()
    if (!nextName) {
      props.setGroupNameError('组名不能为空')
      return
    }
    props.setGroupNameSaving(true)
    props.setGroupNameError('')
    try {
      await props.onChangeGroupName(props.groupNameEditor.groupId, nextName)
      props.setGroupNameEditor(null)
    } catch (error) {
      props.setGroupNameError(error instanceof Error ? error.message : '保存组名失败')
    } finally {
      props.setGroupNameSaving(false)
    }
  }

  const handleSaveAli1688Editor = () => {
    if (!props.ali1688Editor) {
      return
    }
    props.onChangeGroupProcurementInfo(props.ali1688Editor.groupId, {
      purchaseUrl: props.ali1688Editor.purchaseUrl,
      purchasePrice: props.ali1688Editor.purchasePrice
    })
    props.setAli1688Editor(null)
  }

  return (
    <>
      <Modal
        title="编辑组名"
        open={Boolean(props.groupNameEditor)}
        width={480}
        okText="保存"
        cancelText="取消"
        confirmLoading={props.groupNameSaving}
        onCancel={() => {
          if (!props.groupNameSaving) {
            props.setGroupNameEditor(null)
            props.setGroupNameError('')
          }
        }}
        onOk={() => void handleSaveGroupName()}
        destroyOnClose
      >
        {props.groupNameEditor ? (
          <div className="manual-selection-group-name-editor">
            <label htmlFor="manual-selection-group-name-input">组名</label>
            <Input
              id="manual-selection-group-name-input"
              allowClear
              maxLength={200}
              value={props.groupNameEditor.draftName}
              onChange={(event) => {
                props.setGroupNameError('')
                props.setGroupNameEditor((current) => current
                  ? { ...current, draftName: event.target.value }
                  : current)
              }}
              onPressEnter={() => void handleSaveGroupName()}
            />
            {props.groupNameError ? <Text type="danger">{props.groupNameError}</Text> : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        title="编辑1688信息"
        open={Boolean(props.ali1688Editor)}
        width={520}
        okText="保存"
        cancelText="取消"
        onCancel={() => props.setAli1688Editor(null)}
        onOk={handleSaveAli1688Editor}
        destroyOnClose
      >
        {props.ali1688Editor ? (
          <div className="manual-selection-analysis-ali1688-editor">
            <label>
              <span>采购链接</span>
              <Input
                allowClear
                placeholder="https://detail.1688.com/offer/..."
                value={props.ali1688Editor.purchaseUrl}
                onChange={(event) => props.setAli1688Editor((current) => current
                  ? { ...current, purchaseUrl: event.target.value }
                  : current)}
              />
            </label>
            <label>
              <span>采购单价</span>
              <InputNumber
                min={0}
                precision={2}
                addonAfter="RMB"
                placeholder="单价"
                value={props.ali1688Editor.purchasePrice}
                style={{ width: '100%' }}
                onChange={(value) => props.setAli1688Editor((current) => current
                  ? { ...current, purchasePrice: typeof value === 'number' ? value : undefined }
                  : current)}
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
