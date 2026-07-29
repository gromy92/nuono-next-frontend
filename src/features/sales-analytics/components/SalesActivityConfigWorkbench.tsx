import {
  CalendarOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Typography
} from 'antd'
import type { SalesActivityWindow } from '../types'
import type { ActivityWindowFormValues } from '../model/pageTypes'
import type { useSalesAnalyticsDataset } from '../hooks/useSalesAnalyticsDataset'
import type { useSalesActivityWindows } from '../hooks/useSalesActivityWindows'
import { activityColumns } from '../presentation/activityPresentation'
import { ActivityMarkerSummary } from '../presentation/statusPresentation'

const { RangePicker } = DatePicker
const { Text } = Typography

export function SalesActivityConfigWorkbench({
  dataset,
  activities
}: {
  dataset: ReturnType<typeof useSalesAnalyticsDataset>
  activities: ReturnType<typeof useSalesActivityWindows>
}) {
  return (
    <div data-testid="sales-activity-config-workbench" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Space wrap>
          <RangePicker
            value={dataset.dateRange}
            allowClear={false}
            onChange={(value) => {
              if (value?.[0] && value?.[1]) dataset.setDateRange([value[0], value[1]])
            }}
          />
        </Space>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void activities.loadActivities()}
            loading={activities.activityLoading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => activities.openActivityModal()}
          >
            新增活动
          </Button>
        </Space>
      </div>

      <ActivityMarkerSummary
        title="当前范围生效活动"
        activityWindows={activities.activityWindows}
        loading={activities.activityLoading}
      />

      <div data-testid="sales-activity-config" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 8 }}>
          <Space>
            <CalendarOutlined />
            <Text strong>节日配置</Text>
          </Space>
        </div>
        <Table<SalesActivityWindow>
          loading={activities.activityLoading}
          rowKey={(row) => String(row.id)}
          size="small"
          columns={activityColumns(
            activities.openActivityModal,
            activities.toggleActivity,
            activities.activitySaving
          )}
          dataSource={activities.activityHistory}
          pagination={false}
        />
      </div>

      <Modal
        title={activities.editingActivity ? '编辑活动' : '新增活动'}
        open={activities.activityModalOpen}
        confirmLoading={activities.activitySaving}
        onOk={() => void activities.submitActivity()}
        onCancel={() => activities.setActivityModalOpen(false)}
      >
        <Form<ActivityWindowFormValues> form={activities.activityForm} layout="vertical">
          <Form.Item name="name" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="activityType" label="活动类型" rules={[{ required: true, message: '请选择活动类型' }]}>
            <Select
              options={[
                { label: '节日', value: 'holiday' },
                { label: '平台活动', value: 'promotion' },
                { label: '薪酬日', value: 'salary_day' },
                { label: '其他', value: 'other' }
              ]}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="活动日期" rules={[{ required: true, message: '请选择活动日期' }]}>
            <RangePicker allowClear={false} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="categoryScope" label="类目范围">
            <Input />
          </Form.Item>
          <Form.Item name="factor" label="影响因子" rules={[{ required: true, type: 'number', min: 0.1, max: 5, message: '影响因子需在 0.1 到 5 之间' }]}>
            <InputNumber step={0.05} min={0.1} max={5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
