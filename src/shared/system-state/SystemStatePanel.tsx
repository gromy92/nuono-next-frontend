import type { ReactNode } from 'react'
import {
  FileSearchOutlined,
  InboxOutlined,
  LockOutlined,
  WarningOutlined
} from '@ant-design/icons'
import './system-state.css'

export type SystemStateVariant = 'empty' | 'not-found' | 'forbidden' | 'error'

export type SystemStateFact = {
  label: string
  value: string
  tone?: 'success' | 'warning' | 'info'
}

type SystemStatePanelProps = {
  actions?: ReactNode
  compact?: boolean
  description: ReactNode
  facts?: SystemStateFact[]
  title: ReactNode
  variant: SystemStateVariant
}

const STATE_PRESENTATION: Record<SystemStateVariant, {
  code: string
  eyebrow: string
  icon: ReactNode
}> = {
  empty: {
    code: '—',
    eyebrow: '暂无数据',
    icon: <InboxOutlined />
  },
  'not-found': {
    code: '404',
    eyebrow: '页面不存在',
    icon: <FileSearchOutlined />
  },
  forbidden: {
    code: '403',
    eyebrow: '访问受限',
    icon: <LockOutlined />
  },
  error: {
    code: '!',
    eyebrow: '加载失败',
    icon: <WarningOutlined />
  }
}

export function SystemStatePanel({
  actions,
  compact = false,
  description,
  facts = [],
  title,
  variant
}: SystemStatePanelProps) {
  const presentation = STATE_PRESENTATION[variant]

  return (
    <section
      className={`nuono-system-state is-${variant}${compact ? ' is-compact' : ''}`}
      data-testid={`system-state-${variant}`}
    >
      <div className="nuono-system-state-visual" aria-hidden="true">
        <span className="nuono-system-state-code">{presentation.code}</span>
        <span className="nuono-system-state-icon">{presentation.icon}</span>
        <i />
        <i />
        <i />
      </div>

      <div className="nuono-system-state-content">
        <span className="nuono-system-state-eyebrow">{presentation.eyebrow}</span>
        <h2>{title}</h2>
        <div className="nuono-system-state-description">{description}</div>

        {facts.length ? (
          <div className="nuono-system-state-facts">
            {facts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`} className={`is-${fact.tone || 'info'}`}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {actions ? <div className="nuono-system-state-actions">{actions}</div> : null}
      </div>
    </section>
  )
}
