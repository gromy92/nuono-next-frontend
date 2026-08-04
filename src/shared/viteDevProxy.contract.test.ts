import assert from 'node:assert/strict'
import type { ProxyOptions, UserConfig } from 'vite'
import viteConfig from '../../vite.config'

const config = viteConfig as UserConfig
const apiProxy = config.server?.proxy?.['/api'] as ProxyOptions | undefined
const actuatorProxy = config.server?.proxy?.['/actuator'] as ProxyOptions | undefined

assert.equal(
  apiProxy?.changeOrigin,
  false,
  'the local API proxy must preserve the browser Host so Spring keeps same-origin POST requests same-origin'
)
assert.equal(
  actuatorProxy?.changeOrigin,
  false,
  'the local actuator proxy should follow the same origin-preserving contract as the API proxy'
)
