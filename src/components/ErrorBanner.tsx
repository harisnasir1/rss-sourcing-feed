import React from 'react'

export default function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div style={{ background: '#fff8e1', color: '#5a4000', padding: '12px 16px', borderLeft: '4px solid #f5a623', marginBottom: 12, borderRadius: 4 }}>
      <strong>🔧 Under Maintenance</strong>
      <div style={{ marginTop: 6, fontSize: 13 }}>
        We're currently performing maintenance. Please check back shortly.
      </div>
    </div>
  )
}
