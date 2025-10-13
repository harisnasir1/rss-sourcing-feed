import { defineConfig, loadEnv } from 'vite'

// Simple synchronous config without @vitejs/plugin-react to avoid ESM loading issues
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const runpodUrl = env.VITE_RUNPOD_URL || ''

  const proxy = runpodUrl ? {
    '/api/runpod': {
      target: runpodUrl.replace(/\/api\/product\/getlisting.*$/, '') || runpodUrl,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/runpod/, '/api/product')
    }
  } : undefined

  return {
    // Intentionally no plugins here to avoid ESM/CJS plugin resolution problems on some Node setups.
    server: {
      proxy
    }
  }
})
