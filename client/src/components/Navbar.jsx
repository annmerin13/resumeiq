// src/components/Navbar.jsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <span
        onClick={() => navigate('/')}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'var(--accent-bright)',
          cursor: 'pointer',
          letterSpacing: '-0.5px',
        }}
      >
        Resume<span style={{ color: 'var(--text-primary)' }}>IQ</span>
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {location.pathname === '/' ? 'Dashboard' : 'Score Analysis'}
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem 1rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--accent)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}