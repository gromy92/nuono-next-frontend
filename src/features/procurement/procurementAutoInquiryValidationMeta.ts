import {
  procurementAutoInquiryValidationFailed,
  procurementAutoInquiryValidationPassed
} from './autoInquiry';
import type { ProcurementAutoInquiryWorkbenchState } from './types';

type LatestTask = NonNullable<Extract<ProcurementAutoInquiryWorkbenchState, { status: 'success' }>['data']['latestTask']>;

export function buildProcurementAutoInquiryValidationMeta(
  procurementAutoInquiryState: ProcurementAutoInquiryWorkbenchState,
  procurementAutoInquiryLatestTask: LatestTask | undefined
) {
    if (procurementAutoInquiryState.status === 'loading') {
      return {
        alertType: 'info' as const,
        resultTagColor: 'processing' as const,
        resultLabel: '正在读取',
        summary: '正在读取“发送链路打通”阶段的当前状态。'
      };
    }
    if (procurementAutoInquiryState.status === 'error') {
      return {
        alertType: 'error' as const,
        resultTagColor: 'error' as const,
        resultLabel: '读取失败',
        summary: procurementAutoInquiryState.message
      };
    }
    if (procurementAutoInquiryState.status === 'success') {
      if (procurementAutoInquiryValidationPassed(procurementAutoInquiryLatestTask)) {
        return {
          alertType: 'success' as const,
          resultTagColor: 'success' as const,
          resultLabel: '阶段通过',
          summary: '真实托管浏览器发送已经完成，SENT、发送证据、thread checkpoint 和消息摘要都已落回主链。'
        };
      }
      if ((procurementAutoInquiryLatestTask?.failureCode ?? '').toUpperCase() === 'LOGIN_REQUIRED') {
        return {
          alertType: 'warning' as const,
          resultTagColor: 'warning' as const,
          resultLabel: '阶段环境待就绪',
          summary:
            procurementAutoInquiryLatestTask?.failureMessage ||
            '系统侧的 1688 真实发送环境还在准备中，请稍后刷新结果；这一轮不需要你自己去登录 1688。'
        };
      }
      if ((procurementAutoInquiryLatestTask?.failureCode ?? '').toUpperCase() === 'CHAT_TAB_NOT_FOUND') {
        return {
          alertType: 'warning' as const,
          resultTagColor: 'warning' as const,
          resultLabel: '阶段环境待就绪',
          summary:
            '系统侧还没有拿到可复用的 1688 聊天页，这一轮会在阶段内继续收口；不需要你自己去补聊天会话。'
        };
      }
      if (procurementAutoInquiryValidationFailed(procurementAutoInquiryLatestTask)) {
        return {
          alertType: 'error' as const,
          resultTagColor: 'error' as const,
          resultLabel: '阶段未通过',
          summary:
            procurementAutoInquiryLatestTask?.failureMessage ||
            procurementAutoInquiryLatestTask?.handoffReason ||
            procurementAutoInquiryState.data.message ||
            '当前任务没有通过这轮验证，请看失败原因字段。'
        };
      }
      if (procurementAutoInquiryLatestTask) {
        return {
          alertType: 'info' as const,
          resultTagColor: 'processing' as const,
          resultLabel: '已触发待观察',
          summary:
            procurementAutoInquiryState.data.message ||
            procurementAutoInquiryLatestTask.message ||
            '真实发送阶段已经触发，正在等待你查看状态与关键证据。'
        };
      }
      return {
        alertType: 'warning' as const,
        resultTagColor: 'default' as const,
        resultLabel: '待触发',
        summary: procurementAutoInquiryState.data.message || '当前发送链路验证样本还没有创建自动询价任务。'
      };
    }
    return {
      alertType: 'warning' as const,
      resultTagColor: 'default' as const,
      resultLabel: '待触发',
      summary: '进入采购单后，先打开这一张阶段验收卡，再触发一次发送链路验证。'
    };

}
