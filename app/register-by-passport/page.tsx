'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterByPassportPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main portal shell with Register by Passport tab active
    router.replace('/?nav=Register+by+Passport')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '24px 32px',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#008064',
          borderRadius: '50%',
          margin: '0 auto 12px',
          animation: 'spin 0.8s linear infinite'
        }} />
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
          Loading Passport Onboarding...
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
          جاري فتح واجهة التسجيل عبر الجواز
        </p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
