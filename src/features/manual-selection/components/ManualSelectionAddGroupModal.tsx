import { Alert, Input, Modal, Radio, Select, Space, Tag, Typography } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import type { ManualSelectionAnalysisProjectView } from '../types'

type Props = {
  records: ProductSelectionSourceCollection[]
  joinMode: 'new' | 'existing'
  setJoinMode: (mode: 'new' | 'existing') => void
  existingId?: string
  setExistingId: (id?: string) => void
  projectName: string
  setProjectName: (name: string) => void
  error: string
  clearError: () => void
  adding: boolean
  projects: ManualSelectionAnalysisProjectView[]
  onCancel: () => void
  onConfirm: () => void
}

export function ManualSelectionAddGroupModal(props: Props) {
  const {
    records, joinMode, setJoinMode, existingId, setExistingId,
    projectName, setProjectName, error, clearError, adding, projects,
    onCancel, onConfirm
  } = props
  return (
    <Modal
      title="加入组"
      open={records.length > 0}
      width={640}
      okText="加入组"
      cancelText="取消"
      confirmLoading={adding}
      onCancel={onCancel}
      onOk={onConfirm}
      destroyOnClose
    >
      <Space className="manual-selection-project-create" direction="vertical" size={12}>
        <Typography.Paragraph className="manual-selection-project-help" type="secondary">
          一个组可以包含多个采集素材，后续在选品分析里合并判断利润、竞品和上架。
        </Typography.Paragraph>
        {error ? (
          <Alert showIcon type="error" message="加入组失败" description={error} />
        ) : null}
        <div className="manual-selection-project-selected">
          <Typography.Text type="secondary">已选择素材</Typography.Text>
          <div className="manual-selection-project-selected-list">
            {records.map((record) => (
              <Tag
                className="manual-selection-project-selected-tag"
                key={record.id}
                title={`${record.sourcePlatform || '三方'} · ${record.sourceTitleCn || record.sourceTitle || record.id}`}
              >
                {record.sourcePlatform || '三方'} · {record.sourceTitleCn || record.sourceTitle || record.id}
              </Tag>
            ))}
          </div>
        </div>
        <Radio.Group
          className="manual-selection-project-mode"
          value={joinMode}
          onChange={(event) => {
            const nextMode = event.target.value as 'new' | 'existing'
            setJoinMode(nextMode)
            setExistingId(nextMode === 'existing' ? existingId || projects[0]?.projectId : undefined)
            clearError()
          }}
        >
          <Radio value="new">新建组</Radio>
          <Radio value="existing" disabled={!projects.length}>加入已有组</Radio>
        </Radio.Group>
        {joinMode === 'existing' ? (
          <label className="manual-selection-project-name-field">
            <span>选择已有组</span>
            <Select
              data-testid="manual-selection-existing-group-select"
              placeholder="选择已有组"
              value={existingId}
              style={{ width: '100%' }}
              options={projects.map((project) => ({
                value: project.projectId,
                label: (
                  <span className="manual-selection-project-option" title={project.projectName}>
                    <span className="manual-selection-project-option-name">{project.projectName}</span>
                    <span className="manual-selection-project-option-count">
                      {project.records.length || project.projectMaterialCount || 1} 个素材
                    </span>
                  </span>
                )
              }))}
              onChange={setExistingId}
            />
          </label>
        ) : (
          <label className="manual-selection-project-name-field">
            <span>组名称</span>
            <Input
              value={projectName}
              maxLength={80}
              placeholder="例如：桌面线缆收纳"
              onChange={(event) => setProjectName(event.target.value)}
            />
          </label>
        )}
      </Space>
    </Modal>
  )
}
