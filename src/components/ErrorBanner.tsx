import React from 'react'

export default function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div style={{ background: '#ffe6e6', color: '#622', padding: '10px 14px', borderLeft: '4px solid #c44', marginBottom: 12 }}>
      <strong>Network error</strong>
      <div style={{ marginTop: 6, fontSize: 13 }}>{message}</div>
    </div>
  )
}
