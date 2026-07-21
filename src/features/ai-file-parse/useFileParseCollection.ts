import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { App as AntdApp } from 'antd';
import {
  deleteFileParseTask,
  fetchFileParseTargetPlans,
  fetchFileParseTasks
} from './api';
import {
  EMPTY_TASK_FILTERS,
  mapTargetPlan,
  mapTaskFromList,
  taskFiltersToQuery
} from './fileParseTaskModel';
import type { AiParseTask, AiParseTaskFilters, AiParseTargetOutputPlan } from './types';

type AppContext = ReturnType<typeof AntdApp.useApp>;

export function useFileParseCollection(
  messageApi: AppContext['message'],
  modal: AppContext['modal'],
  setActionLoading: Dispatch<SetStateAction<boolean>>
) {
  const [targetPlans, setTargetPlans] = useState<AiParseTargetOutputPlan[]>([]);
  const [tasks, setTasks] = useState<AiParseTask[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskFilters, setTaskFilters] = useState<AiParseTaskFilters>(EMPTY_TASK_FILTERS);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [selectedTaskId, tasks]
  );

  const loadTasks = async (nextSelectedTaskId?: string, filtersOverride = taskFilters) => {
    const payload = await fetchFileParseTasks({
      ...taskFiltersToQuery(filtersOverride),
      page: 1,
      pageSize: 50
    });
    const mappedTasks = payload.items.map(mapTaskFromList);
    const visibleIds = new Set(mappedTasks.map((task) => task.id));
    setSelectedTaskIds((current) => current.filter((taskId) => visibleIds.has(taskId)));
    setTasks((current) => mappedTasks.map((task) => ({
      ...task,
      inputItems: current.find((item) => item.id === task.id)?.inputItems ?? task.inputItems
    })));
    const requestedId = nextSelectedTaskId && visibleIds.has(nextSelectedTaskId) ? nextSelectedTaskId : '';
    const currentId = selectedTaskId && visibleIds.has(selectedTaskId) ? selectedTaskId : '';
    const resolvedId = requestedId || currentId || mappedTasks[0]?.id || '';
    setSelectedTaskId(resolvedId);
    if (!resolvedId) setViewMode('list');
    return mappedTasks;
  };

  useEffect(() => {
    let active = true;
    setPageLoading(true);
    Promise.all([fetchFileParseTargetPlans(), fetchFileParseTasks({ page: 1, pageSize: 50 })])
      .then(([plansPayload, tasksPayload]) => {
        if (!active) return;
        const nextPlans = plansPayload.map(mapTargetPlan);
        const nextTasks = tasksPayload.items.map(mapTaskFromList);
        setTargetPlans(nextPlans);
        setTasks(nextTasks);
        setSelectedTaskId(nextTasks[0]?.id ?? '');
      })
      .catch((error) => {
        if (active) messageApi.error(error instanceof Error ? error.message : '加载文件管理解析数据失败');
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });
    return () => {
      active = false;
    };
  }, [messageApi]);

  const reloadWithFilters = async (nextFilters: AiParseTaskFilters) => {
    setTaskFilters(nextFilters);
    setPageLoading(true);
    try {
      await loadTasks(undefined, nextFilters);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载解析文档列表失败');
    } finally {
      setPageLoading(false);
    }
  };

  const openDetail = (task: AiParseTask, tab = 'processing') => {
    setSelectedTaskId(task.id);
    setViewMode('detail');
    return tab;
  };

  const deleteTask = (task: AiParseTask) => {
    modal.confirm({
      title: '删除解析文档',
      content: '会删除该文档及其解析记录、已发布版本和当前生效业务结果，删除后不会自动恢复上一版。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true);
        try {
          await deleteFileParseTask(task.id);
          if (selectedTaskId === task.id) setViewMode('list');
          await loadTasks();
          messageApi.success('已删除解析文档');
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : '删除解析文档失败');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const deleteTasks = (selectedTasks: AiParseTask[]) => {
    const deletable = selectedTasks.filter((task) => task.availableActions?.canCreateTask);
    if (!deletable.length) {
      messageApi.warning('请先选择可删除的解析文档');
      return;
    }
    modal.confirm({
      title: '批量删除解析文档',
      content: `会删除选中的 ${deletable.length} 个文档及其解析记录、已发布版本和当前生效业务结果，删除后不会自动恢复上一版。`,
      okText: '确认批量删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true);
        try {
          const results = await Promise.all(deletable.map(async (task) => {
            try {
              await deleteFileParseTask(task.id);
              return { task, success: true as const };
            } catch (error) {
              return { task, success: false as const, error };
            }
          }));
          const succeeded = results.filter((result) => result.success);
          const failed = results.filter((result) => !result.success);
          const succeededIds = new Set(succeeded.map((result) => result.task.id));
          if (selectedTaskId && succeededIds.has(selectedTaskId)) setViewMode('list');
          setSelectedTaskIds((current) => current.filter((taskId) => !succeededIds.has(taskId)));
          await loadTasks();
          if (failed.length) {
            const error = failed[0]?.error;
            messageApi.warning(`删除成功 ${succeeded.length} 个，失败 ${failed.length} 个：${error instanceof Error ? error.message : '失败项已保留'}`);
          } else {
            messageApi.success(`删除成功 ${succeeded.length} 个，失败 0 个`);
          }
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  return {
    targetPlans,
    tasks,
    setTasks,
    pageLoading,
    viewMode,
    setViewMode,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    selectedTaskIds,
    setSelectedTaskIds,
    taskFilters,
    loadTasks,
    reloadWithFilters,
    resetFilters: () => void reloadWithFilters({ ...EMPTY_TASK_FILTERS }),
    openDetail,
    deleteTask,
    deleteTasks
  };
}
