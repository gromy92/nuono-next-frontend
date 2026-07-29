import { Alert, Space, Table, Typography } from 'antd'
import type { AuthSession } from '../../auth/session'
import { useOperationConfigEditorActions } from '../hooks/useOperationConfigEditorActions'
import { useOperationConfigLibraryController } from '../hooks/useOperationConfigLibraryController'
import { useOperationConfigPublishActions } from '../hooks/useOperationConfigPublishActions'
import { useOperationConfigVersionColumns } from '../hooks/useOperationConfigVersionColumns'
import type { OperationConfigVersionConfigType } from '../versionLibraryTypes'
import { CalendarVersionEditor } from './CalendarVersionEditor'
import { LifecycleVersionEditor } from './LifecycleVersionEditor'
import { OperationConfigDetailDrawer } from './OperationConfigDetailDrawer'
import { PublishVersionModal } from './PublishVersionModal'

const { Title } = Typography

export function OperationConfigVersionWorkbench({
  session,
  configType,
  title = '运营配置版本'
}: {
  session: AuthSession
  configType?: OperationConfigVersionConfigType
  title?: string
}) {
  const state = useOperationConfigLibraryController({ session, configType })
  const editor = useOperationConfigEditorActions(state)
  const publish = useOperationConfigPublishActions(state)
  const columns = useOperationConfigVersionColumns({ state, publish, configType })

  return (
    <section className="operations-config-suite-page operations-config-version-library-page">
      <Space direction="vertical" size={16} className="operations-config-suite-layout">
        {!configType ? (
          <Space direction="vertical" size={4}>
            <Title level={3} data-testid="operation-config-version-library-title">
              {title}
            </Title>
          </Space>
        ) : null}
        {state.error ? <Alert type="error" showIcon message={state.error} /> : null}
        <Table
          data-testid="operation-config-version-library-table"
          rowKey="versionNo"
          columns={columns}
          dataSource={state.versions}
          loading={state.loading}
          pagination={false}
          scroll={{ x: configType ? 1160 : 1300 }}
        />
        <OperationConfigDetailDrawer state={state} />
        <CalendarVersionEditor state={state} actions={editor} />
        <LifecycleVersionEditor state={state} actions={editor} />
        <PublishVersionModal state={state} publish={publish} />
      </Space>
    </section>
  )
}
