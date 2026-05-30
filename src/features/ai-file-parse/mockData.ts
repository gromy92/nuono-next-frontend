import type { AiParseInputType } from './types';

// 说明:ai-file-parse 主链路已全部走真实 /api/file-management/parse/** 接口。
// 早期的样本任务/明细/版本/快照/日志（initialParseTasks / initialParseItems /
// initialParseVersions / initialVersionSnapshotItems / mockLogs / clone* /
// createAcceptanceTask 等）均无任何外部消费，已删除。
// 当前仅保留两个真实被使用的导出：
//   - aiParseStandards：标准字段定义元数据（resultFields 为空时的字段兜底）
//   - inputTypeLabel：输入类型中文标签
export { aiParseStandards } from './mockCatalog';

export function inputTypeLabel(inputType: AiParseInputType) {
  const labelMap: Record<AiParseInputType, string> = {
    FILE: '文件',
    IMAGE: '图片',
    EXCEL: 'Excel',
    PDF: 'PDF',
    OCR_TEXT: 'OCR文本',
    MANUAL_TEXT: '人工文案'
  };
  return labelMap[inputType];
}
