import { Tag } from 'antd'

export function RunStatusTag({ status }: { status: string }) {
  if (status === 'succeeded') {
    return <Tag color="green">抓取成功</Tag>
  }
  if (status === 'running') {
    return <Tag color="blue">抓取中</Tag>
  }
  if (status === 'partial_failed') {
    return <Tag color="orange">部分失败</Tag>
  }
  if (status === 'captcha_required') {
    return <Tag color="orange">验证码</Tag>
  }
  return <Tag color="red">抓取受限</Tag>
}
