import { defineConfig } from 'vite'

export default defineConfig(async () => {
  // dynamically import ESM-only plugin at runtime to avoid require/ESM issues
  const reactPlugin = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [reactPlugin()]
  }
})
