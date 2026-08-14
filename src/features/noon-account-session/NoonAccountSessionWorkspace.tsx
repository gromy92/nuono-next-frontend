import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Input, Space, Spin, Typography } from 'antd'
import { apiRequestJson, normalizeError } from '../../shared/api'

type NoonAccountSessionStatus =
  | 'UNKNOWN'
  | 'ACTIVE'
  | 'MANUAL_OTP_REQUIRED'
  | 'OTP_SENT'
  | 'MANUAL_ACTION_REQUIRED'

type NoonAccountSessionView = {
  status: NoonAccountSessionStatus
  challengeId?: string | null
  expiresAt?: string | null
  message?: string | null
}

const statusTitle: Record<NoonAccountSessionStatus, string> = {
  UNKNOWN: '尚未完成日常校验',
  ACTIVE: '账号会话正常',
  MANUAL_OTP_REQUIRED: '需要人工验证码',
  OTP_SENT: '等待输入验证码',
  MANUAL_ACTION_REQUIRED: '需要人工检查 Project 会话'
}

export function NoonAccountSessionWorkspace() {
  const [view, setView] = useState<NoonAccountSessionView | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<{ otpCode: string }>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setView(await apiRequestJson<NoonAccountSessionView>('/api/noon/account-session'))
    } catch (requestError) {
      setError(normalizeError(requestError, '无法读取 Noon 登录状态。'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const send = async () => {
    setSubmitting(true)
    setError(null)
    try {
      setView(await apiRequestJson<NoonAccountSessionView>('/api/noon/account-session/manual-otp', {
        method: 'POST'
      }))
    } catch (requestError) {
      setError(normalizeError(requestError, '无法发送 Noon 验证码。'))
    } finally {
      setSubmitting(false)
    }
  }

  const verify = async () => {
    const { otpCode } = await form.validateFields()
    if (!view?.challengeId) {
      setError('当前没有有效验证码请求，请先人工发送。')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      setView(await apiRequestJson<NoonAccountSessionView>('/api/noon/account-session/manual-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: view.challengeId, otpCode })
      }))
      form.resetFields()
    } catch (requestError) {
      setError(normalizeError(requestError, 'Noon 验证码校验未完成。'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Spin />
  }

  const status = view?.status ?? 'UNKNOWN'
  const canVerify = status === 'OTP_SENT' && Boolean(view?.challengeId)
  return (
    <Card title="Noon 账号登录" style={{ maxWidth: 720 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type={status === 'ACTIVE' ? 'success' : status === 'OTP_SENT' ? 'info' : 'warning'}
          showIcon
          message={statusTitle[status]}
          description={view?.message || '系统每天只检查现有会话，不会自动发送验证码。'}
        />
        {error ? <Alert type="error" showIcon message={error} /> : null}
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          所有已绑定店铺共用一个 Noon 登录账号。需要验证时只发送一次验证码，验证后再更新各 Project 会话；不会按店铺重复发送。
        </Typography.Paragraph>
        {canVerify ? (
          <Form form={form} layout="inline" onFinish={verify}>
            <Form.Item
              name="otpCode"
              rules={[{ required: true, message: '请输入 Noon 验证码。' }]}
            >
              <Input autoComplete="one-time-code" inputMode="numeric" placeholder="输入验证码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>完成验证</Button>
            </Form.Item>
          </Form>
        ) : (
          <Button type="primary" onClick={send} loading={submitting}>人工发送验证码</Button>
        )}
        <Button onClick={() => void load()} disabled={submitting}>刷新状态</Button>
      </Space>
    </Card>
  )
}
