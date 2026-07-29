import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Segmented, Select, Spin, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ProductSelectionSourceCollection } from '../source-collection/types'
import {
  loadAli1688Collections,
  recollectAli1688Collection,
  retryAli1688Collection
} from '../source-collection/api'
import {
  buildAli1688Task,
  getSourceCollectionId,
  getTaskId,
  sortAli1688Tasks,
  TASK_FILTER_LABELS,
  type Ali1688Task,
  type Ali1688TaskFilter
} from './ali1688CollectionModel'
import { TaskCard, TaskDetail } from './Ali1688TaskViews'
import './Ali1688CollectionPage.css'

type Ali1688CollectionPageProps = {
  storeName: string
  storeCode?: string
  operatorName?: string
  operatorUserId?: number
}

export function Ali1688CollectionPage(props: Ali1688CollectionPageProps) {
  const { storeName, storeCode, operatorUserId } = props
  const [records, setRecords] = useState<ProductSelectionSourceCollection[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>()
  const [searchText, setSearchText] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [taskFilter, setTaskFilter] = useState<Ali1688TaskFilter>('all')
  const [actionKey, setActionKey] = useState<string>()

  const loadCollections = useCallback(async () => {
    setLoading(true)
    try {
      setRecords(await loadAli1688Collections(storeName, storeCode, operatorUserId))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取1688查询记录失败')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [operatorUserId, storeCode, storeName])

  useEffect(() => {
    void loadCollections()
  }, [loadCollections])

  const tasks = useMemo(
    () => records.map((record) => buildAli1688Task(record)).sort(sortAli1688Tasks),
    [records]
  )
  const sourceOptions = useMemo(() => {
    const platforms = Array.from(new Set(tasks.map((task) => task.record.sourcePlatform).filter(Boolean)))
    return [
      { label: '全部来源', value: 'all' },
      ...platforms.map((platform) => ({ label: platform, value: platform }))
    ]
  }, [tasks])
  const filteredTasks = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return tasks.filter((task) => {
      if (taskFilter !== 'all' && task.group !== taskFilter) return false
      if (sourceFilter !== 'all' && task.record.sourcePlatform !== sourceFilter) return false
      if (!keyword) return true
      return [
        task.record.collectionNo,
        task.record.sourceTitle,
        task.record.sourceTitleCn,
        task.record.selectedText,
        task.view.message,
        ...(task.view.candidates || []).flatMap((candidate) => [
          candidate.title,
          candidate.supplierName,
          candidate.locationText
        ])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [searchText, sourceFilter, taskFilter, tasks])

  useEffect(() => {
    if (!filteredTasks.length) {
      setSelectedTaskId(undefined)
    } else if (!selectedTaskId || !filteredTasks.some((task) => task.record.id === selectedTaskId)) {
      setSelectedTaskId(filteredTasks[0].record.id)
    }
  }, [filteredTasks, selectedTaskId])

  useEffect(() => {
    if (!tasks.some((task) => task.view.status === 'running' || task.view.status === 'queued')) {
      return undefined
    }
    const timer = window.setInterval(() => void loadCollections(), 5000)
    return () => window.clearInterval(timer)
  }, [loadCollections, tasks])

  const selectedTask = filteredTasks.find((task) => task.record.id === selectedTaskId) || filteredTasks[0]
  const handleRecollectTask = useCallback(async (task: Ali1688Task) => {
    const sourceCollectionId = getSourceCollectionId(task)
    if (!sourceCollectionId) {
      message.warning('缺少源头采集ID，无法重跑。')
      return
    }
    setActionKey(`recollect:${sourceCollectionId}`)
    try {
      await recollectAli1688Collection(sourceCollectionId)
      message.success('已重新发起1688采集。')
      await loadCollections()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '重新发起1688采集失败')
    } finally {
      setActionKey(undefined)
    }
  }, [loadCollections])
  const handleRetryTask = useCallback(async (task: Ali1688Task) => {
    const taskId = getTaskId(task)
    if (!taskId) {
      message.warning('缺少1688任务ID，无法重试。')
      return
    }
    setActionKey(`retry:${taskId}`)
    try {
      await retryAli1688Collection(taskId)
      message.success('已提交1688任务重试。')
      await loadCollections()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '1688任务重试失败')
    } finally {
      setActionKey(undefined)
    }
  }, [loadCollections])

  const filterOptions = (Object.keys(TASK_FILTER_LABELS) as Ali1688TaskFilter[]).map((key) => ({
    label: `${TASK_FILTER_LABELS[key]} ${key === 'all' ? tasks.length : tasks.filter((task) => task.group === key).length}`,
    value: key
  }))

  return (
    <div className="ali1688-workbench" data-testid="ali1688-collection-page">
      <div className="ali1688-toolbar">
        <Segmented
          className="ali1688-task-filter"
          options={filterOptions}
          value={taskFilter}
          onChange={(value) => setTaskFilter(value as Ali1688TaskFilter)}
        />
        <Input
          allowClear
          className="ali1688-search"
          placeholder="搜索商品、候选、供应商"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Select
          className="ali1688-source-select"
          options={sourceOptions}
          value={sourceFilter}
          onChange={setSourceFilter}
        />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadCollections()}>
          刷新
        </Button>
      </div>

      <Spin spinning={loading && !tasks.length}>
        <div className="ali1688-workspace">
          <aside className="ali1688-task-queue" data-testid="ali1688-task-queue">
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.record.id}
                  task={task}
                  active={task.record.id === selectedTask?.record.id}
                  onClick={() => setSelectedTaskId(task.record.id)}
                />
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无1688查询记录" />
            )}
          </aside>
          <main className="ali1688-detail" data-testid="ali1688-task-detail">
            {selectedTask ? (
              <TaskDetail
                task={selectedTask}
                actionKey={actionKey}
                onRecollect={handleRecollectTask}
                onRetry={handleRetryTask}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择查询记录" />
            )}
          </main>
        </div>
      </Spin>
    </div>
  )
}
