import type { AiParseOperationLog } from './types';

export const initialParseLogs: AiParseOperationLog[] = [
  {
    id: 'log-001',
    taskId: 'TASK-20260509-0001',
    action: '创建解析批次',
    operatorName: '系统管理员',
    operatedAt: '2026-05-09 15:40',
    detail: '上传 4 个输入项，绑定标准 STD-2026.05。'
  },
  {
    id: 'log-002',
    taskId: 'TASK-20260509-0001',
    action: '生成解析结果',
    operatorName: '系统',
    operatedAt: '2026-05-09 16:20',
    detail: '生成不可变解析结果 RESULT-20260509-0001-R1。'
  },
  {
    id: 'log-003',
    taskId: 'TASK-20260509-0002',
    action: '生成解析结果',
    operatorName: '系统',
    operatedAt: '2026-05-09 15:02',
    detail: '生成出仓费解析结果 RESULT-20260509-0002-R1，等待人工确认。'
  },
  {
    id: 'log-004',
    taskId: 'TASK-20260508-0007',
    action: '发布版本',
    operatorName: '系统管理员',
    operatedAt: '2026-05-08 16:25',
    detail: '发布 LOGI-YITE-2026-05 并设为当前生效版本。'
  }
];
