import { Button, Descriptions, Drawer, Form, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography, Upload } from 'antd';
import { CloudUploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { FormInstance, UploadFile } from 'antd';
import { makeFieldInput } from './fieldControls';
import { getFieldValueClass, readFieldDisplayValue } from './helpers';
import { changeTypeMeta, reviewStatusMeta } from './meta';
import type {
  AiParseDocumentStandard,
  AiParseResultItem,
  AiParseRolePermission,
  AiParseStandardField,
  AiParseTargetOutputPlan,
  AiParseTask
} from './types';

const { Text } = Typography;

export type CreateBatchFormValues = {
  documentTitle: string;
  targetPlanId: string;
  ocrText?: string;
  manualText?: string;
  remark?: string;
};

export type EditResultFormValues = {
  fields: Record<string, string | number | boolean | null>;
};

type CreateBatchDrawerProps = {
  form: FormInstance<CreateBatchFormValues>;
  open: boolean;
  targetPlans: AiParseTargetOutputPlan[];
  parentTask?: AiParseTask | null;
  submitting: boolean;
  uploadFiles: UploadFile[];
  onClose: () => void;
  onSubmit: () => void;
  onTargetPlanChange: (targetPlanId: string) => void;
  onUploadFilesChange: (files: UploadFile[]) => void;
};

export function CreateBatchDrawer({
  form,
  open,
  targetPlans,
  parentTask,
  submitting,
  uploadFiles,
  onClose,
  onSubmit,
  onTargetPlanChange,
  onUploadFilesChange
}: CreateBatchDrawerProps) {
  const selectTargetPlan = (targetPlanId: string) => {
    form.setFieldValue('targetPlanId', targetPlanId);
    onTargetPlanChange(targetPlanId);
  };

  return (
    <Drawer
      title={parentTask ? '更新源文件' : '新建解析文档'}
      width={680}
      open={open}
      forceRender
      onClose={onClose}
      extra={
        <Space>
          <Button disabled={submitting} onClick={onClose}>
            取消
          </Button>
          <Button type="primary" loading={submitting} disabled={submitting} onClick={onSubmit}>
            {parentTask ? '创建更新解析' : '创建解析文档'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item label="文档名称" name="documentTitle" rules={[{ required: true, message: '请输入文档名称' }]}>
          <Input placeholder="例如：Noon 佣金 2026-05" />
        </Form.Item>

        {parentTask ? (
          <div className="ai-file-parse-target-plan-list">
            <Text type="secondary">
              基于第 {parentTask.iterationNo ?? 1} 次解析更新源文件，创建后会按当前生效版本重新对比。
            </Text>
          </div>
        ) : null}

        <Form.Item label="目标输出方案" name="targetPlanId" rules={[{ required: true, message: '请选择目标输出方案' }]}>
          <Select
            data-testid="file-parse-create-target-plan-select"
            disabled={Boolean(parentTask)}
            options={targetPlans.map((item) => ({
              label: `${item.label} / ${item.documentName}`,
              value: item.id
            }))}
            onChange={selectTargetPlan}
          />
        </Form.Item>

        <Form.Item label="输入项">
          <Upload.Dragger
            multiple
            beforeUpload={() => false}
            fileList={uploadFiles}
            onChange={({ fileList }) => onUploadFilesChange(fileList)}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">上传文件、图片、PDF 或 Excel</p>
          </Upload.Dragger>
        </Form.Item>

        <Form.Item label="OCR 文本" name="ocrText">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} placeholder="可粘贴图片 OCR 或 PDF 文字识别内容" />
        </Form.Item>
        <Form.Item label="人工补充文案" name="manualText">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} placeholder="补充业务说明、口径或无法上传的文本" />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input placeholder="本次解析备注" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

type EditResultDrawerProps = {
  form: FormInstance<EditResultFormValues>;
  item: AiParseResultItem | null;
  standard: AiParseDocumentStandard | undefined;
  onClose: () => void;
  onSave: () => void;
};

export function EditResultDrawer({ form, item, standard, onClose, onSave }: EditResultDrawerProps) {
  return (
    <Drawer
      title="编辑解析结果"
      width={620}
      open={Boolean(item)}
      forceRender
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={onSave}>
            保存
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" preserve={false} style={{ display: item && standard ? undefined : 'none' }}>
        {item && standard ? (
          <>
          <Descriptions bordered size="small" column={1} className="ai-file-parse-standard-box">
            <Descriptions.Item label="业务主键">{item.naturalKey}</Descriptions.Item>
            <Descriptions.Item label="来源证据">{item.evidence}</Descriptions.Item>
            <Descriptions.Item label="处理状态">
              <Tag color={reviewStatusMeta[item.reviewStatus].color}>
                {reviewStatusMeta[item.reviewStatus].label}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
          {standard.resultFields.map((field) => (
            <Form.Item
              key={field.key}
              label={field.label}
              name={['fields', field.key]}
              rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : undefined}
            >
              {makeFieldInput(field)}
            </Form.Item>
          ))}
          </>
        ) : null}
      </Form>
    </Drawer>
  );
}

type FieldCompareModalProps = {
  item: AiParseResultItem | null;
  standard: AiParseDocumentStandard | undefined;
  permission: AiParseRolePermission;
  taskPublished: boolean;
  keepOldHelp: string;
  onClose: () => void;
  onConfirm: (item: AiParseResultItem) => void;
  onKeepOld: (item: AiParseResultItem) => void;
};

export function FieldCompareModal({
  item,
  standard,
  permission,
  taskPublished,
  keepOldHelp,
  onClose,
  onConfirm,
  onKeepOld
}: FieldCompareModalProps) {
  return (
    <Modal
      title="字段级对比"
      width={760}
      open={Boolean(item)}
      destroyOnClose
      onCancel={onClose}
      footer={
        item ? (
          <Space>
            <Button onClick={onClose}>关闭</Button>
            <Button
              disabled={!permission.canDraftEdit || taskPublished || !item.oldFields}
              onClick={() => {
                onKeepOld(item);
                onClose();
              }}
            >
              <Space size={4}>
                <span>保留旧值</span>
                <Tooltip title={keepOldHelp}>
                  <ExclamationCircleOutlined className="ai-file-parse-help-icon" />
                </Tooltip>
              </Space>
            </Button>
            <Button
              disabled={!permission.canDraftEdit || taskPublished}
              onClick={() => {
                onConfirm(item);
                onClose();
              }}
            >
              接受新值
            </Button>
            <Button
              type="primary"
              disabled={!permission.canDraftEdit || taskPublished}
              onClick={() => {
                onConfirm(item);
                onClose();
              }}
            >
              标记已处理
            </Button>
          </Space>
        ) : null
      }
    >
      {item && standard ? (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="变化">
              <Tag color={changeTypeMeta[item.changeType].color}>{changeTypeMeta[item.changeType].label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="业务主键">{item.naturalKey}</Descriptions.Item>
            <Descriptions.Item label="校验">{item.validationMessage}</Descriptions.Item>
          </Descriptions>
          <Table
            rowKey="key"
            size="small"
            pagination={false}
            columns={[
              { title: '字段', dataIndex: 'label', width: 140 },
              {
                title: '最近版本',
                width: 220,
                render: (_, record: AiParseStandardField) => readFieldDisplayValue(item.oldFields?.[record.key])
              },
              {
                title: '本次解析',
                width: 220,
                render: (_, record: AiParseStandardField) => (
                  <span className={getFieldValueClass(item, record.key)}>
                    {readFieldDisplayValue(item.fields[record.key])}
                  </span>
                )
              }
            ]}
            dataSource={standard.resultFields}
          />
        </Space>
      ) : null}
    </Modal>
  );
}
