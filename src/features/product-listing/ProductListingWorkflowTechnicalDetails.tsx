import { Collapse, Descriptions, Table, Tag, Typography } from 'antd'
import type {
  ProductListingNoonWriteStepResult,
  ProductListingTaskView,
  ProductListingWorkflowView
} from './types'

const { Paragraph, Text } = Typography

type ProductListingWorkflowTechnicalDetailsProps = {
  workflow: ProductListingWorkflowView
}

export function ProductListingWorkflowTechnicalDetails({
  workflow
}: ProductListingWorkflowTechnicalDetailsProps) {
  return (
    <Collapse
      ghost
      items={[
        {
          key: 'technical-details',
          label: '技术详情',
          children: (
            <>
              <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                <Descriptions.Item label="phase">{workflow.phase}</Descriptions.Item>
                <Descriptions.Item label="writeCertainty">{workflow.writeCertainty}</Descriptions.Item>
                <Descriptions.Item label="nextAction">{workflow.nextAction}</Descriptions.Item>
                <Descriptions.Item label="reasonCode">{workflow.reasonCode || '-'}</Descriptions.Item>
              </Descriptions>
              <TaskTechnicalDetails title="Dry-run" task={workflow.dryRunTask} />
              <TaskTechnicalDetails title="真实上架任务" task={workflow.realRunTask} showSteps />
            </>
          )
        }
      ]}
    />
  )
}

function TaskTechnicalDetails({
  title,
  task,
  showSteps = false
}: {
  title: string
  task?: ProductListingTaskView
  showSteps?: boolean
}) {
  if (!task) {
    return null
  }
  return (
    <div className="product-listing-workflow-technical-task">
      <Text strong>{title}</Text>
      <Descriptions size="small" column={{ xs: 1, md: 3 }}>
        <Descriptions.Item label="task">{task.taskNo || task.taskId}</Descriptions.Item>
        <Descriptions.Item label="mode">{task.mode}</Descriptions.Item>
        <Descriptions.Item label="status">
          <Tag>{task.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="failureCode">
          {task.failureCode || task.noonResult?.failureCode || '-'}
        </Descriptions.Item>
      </Descriptions>
      {showSteps ? <NoonStepTable steps={task.noonResult?.steps || []} /> : null}
    </div>
  )
}

function NoonStepTable({ steps }: { steps: ProductListingNoonWriteStepResult[] }) {
  return (
    <Table<ProductListingNoonWriteStepResult>
      className="product-listing-real-run-steps-table"
      size="small"
      tableLayout="fixed"
      pagination={false}
      dataSource={steps}
      rowKey={(record, index) => `${record.stepKey || 'step'}-${index ?? 0}`}
      columns={[
        { title: 'stepKey', dataIndex: 'stepKey', width: 180 },
        { title: 'status', dataIndex: 'status', width: 110 },
        {
          title: 'externalReference',
          dataIndex: 'externalReference',
          render: (value: string) => (
            <Paragraph
              className="product-listing-real-run-step-reference"
              copyable={{ text: value || '' }}
              ellipsis={{ rows: 3, expandable: true }}
            >
              {value || '-'}
            </Paragraph>
          )
        },
        { title: 'failureCode', dataIndex: 'failureCode', width: 160 },
      ]}
      locale={{ emptyText: '暂无真实上架步骤' }}
    />
  )
}
