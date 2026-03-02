import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './utils/AuthContext'
import { Analytics } from "@vercel/analytics/react"
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
    <BrowserRouter>
      <App />
      <Analytics />
    </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
