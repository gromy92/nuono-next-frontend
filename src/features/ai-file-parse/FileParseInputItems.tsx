import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Space, Tag, Tooltip, Typography } from 'antd';
import { withPublicBasePath } from '../../runtimePaths';
import { summarizeInputs } from './helpers';
import { inputTypeLabel } from './fileParseTaskModel';
import type { AiParseTask } from './types';

const { Text } = Typography;

export const keepOldHelp = '保留旧值：这条仍对应已有规则，但本次解析的新值不采用，发布时沿用对比版本里的旧值。';
export const rejectHelp = '驳回：这条解析结果不进入发布版本，适合无效、重复或不属于当前目标输出方案的数据。';

export function ActionHelp({ text }: { text: string }) {
  return (
    <Tooltip title={text}>
      <ExclamationCircleOutlined className="ai-file-parse-help-icon" />
    </Tooltip>
  );
}

function downloadHref(input: AiParseTask['inputItems'][number]) {
  return input.downloadUrl ? withPublicBasePath(input.downloadUrl) : '';
}

export function FileParseInputItems({ task, compact = false }: { task: AiParseTask; compact?: boolean }) {
  if (!task.inputItems.length) {
    return <Text type="secondary">{summarizeInputs(task, inputTypeLabel)}</Text>;
  }
  return (
    <Space direction="vertical" size={compact ? 4 : 6} className="ai-file-parse-input-list">
      {task.inputItems.map((input) => {
        const label = inputTypeLabel(input.inputType);
        const isText = input.inputType === 'OCR_TEXT' || input.inputType === 'MANUAL_TEXT';
        const href = downloadHref(input);
        return (
          <div key={input.id} className="ai-file-parse-input-item">
            <Tag>{label}</Tag>
            {isText || !href ? (
              <Text strong>{input.displayName}</Text>
            ) : (
              <Typography.Link href={href} download={input.displayName}>
                {input.displayName}
              </Typography.Link>
            )}
            {!compact && input.detail ? <Text type="secondary">{input.detail}</Text> : null}
          </div>
        );
      })}
    </Space>
  );
}
