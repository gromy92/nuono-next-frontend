import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { App as AntdApp } from 'antd';
import {
  fetchFileParseLogisticsActivations,
  saveFileParseLogisticsActivations,
  type FileParseLogisticsActivationPayload
} from './api';
import type { AiParseRolePermission, AiParseTargetOutputPlan, AiParseVersion } from './types';

type AppContext = ReturnType<typeof AntdApp.useApp>;

type LogisticsInput = {
  messageApi: AppContext['message'];
  detailTab: string;
  isLogisticsPlan: boolean;
  targetPlan: AiParseTargetOutputPlan | undefined;
  versions: AiParseVersion[];
  permission: AiParseRolePermission;
  setActionLoading: Dispatch<SetStateAction<boolean>>;
};

export function useFileParseLogisticsActivation(input: LogisticsInput) {
  const {
    detailTab,
    isLogisticsPlan,
    messageApi,
    permission,
    setActionLoading,
    targetPlan,
    versions
  } = input;
  const [activation, setActivation] = useState<FileParseLogisticsActivationPayload | null>(null);
  const [versionId, setVersionId] = useState('');
  const [selectedChannelKeys, setSelectedChannelKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const versionIds = versions.map((version) => version.id).join('|');

  useEffect(() => {
    if (!isLogisticsPlan || !versions.length) {
      setVersionId('');
      setActivation(null);
      setSelectedChannelKeys([]);
      return;
    }
    const defaultId = versions.find((version) => version.status === 'active')?.id ?? versions[0].id;
    setVersionId((current) => versions.some((version) => version.id === current) ? current : defaultId);
  }, [isLogisticsPlan, versionIds]);

  useEffect(() => {
    if (detailTab !== 'versions' || !isLogisticsPlan || !targetPlan || !versionId) return;
    let active = true;
    setLoading(true);
    fetchFileParseLogisticsActivations(targetPlan.id, versionId)
      .then((payload) => {
        if (!active) return;
        setActivation(payload);
        setSelectedChannelKeys(payload.selectedChannelKeys.length
          ? payload.selectedChannelKeys
          : payload.channels.filter((channel) => channel.selected).map((channel) => channel.channelKey));
      })
      .catch((error) => {
        if (!active) return;
        messageApi.error(error instanceof Error ? error.message : '加载物流服务线生效配置失败');
        setActivation(null);
        setSelectedChannelKeys([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [detailTab, isLogisticsPlan, messageApi, targetPlan, versionId]);

  const toggle = (channelKey: string, checked: boolean) => {
    setSelectedChannelKeys((current) => checked
      ? (current.includes(channelKey) ? current : [...current, channelKey])
      : current.filter((key) => key !== channelKey));
  };

  const save = async () => {
    if (!targetPlan || !versionId) {
      messageApi.warning('请选择要生效的物流版本');
      return;
    }
    if (!permission.canActivateLogisticsChannels) {
      messageApi.warning('当前角色没有物流服务线生效权限');
      return;
    }
    setActionLoading(true);
    try {
      const payload = await saveFileParseLogisticsActivations({
        targetPlanId: Number(targetPlan.id),
        versionId: Number(versionId),
        selectedChannelKeys
      });
      setActivation(payload);
      setSelectedChannelKeys(payload.selectedChannelKeys.length
        ? payload.selectedChannelKeys
        : payload.channels.filter((channel) => channel.selected).map((channel) => channel.channelKey));
      messageApi.success('已保存物流服务线生效选择');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存物流服务线生效选择失败');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    activation,
    versionId,
    setVersionId,
    selectedChannelKeys,
    loading,
    toggle,
    save: () => void save()
  };
}
