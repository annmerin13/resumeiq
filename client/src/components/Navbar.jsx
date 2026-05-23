// filename: client/src/components/Navbar.jsx
// replace the location label span with nav links

import React from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const linkStyle = (isActive) => ({
    color: isActive ? 'var(--accent-bright)' : 'var(--text-muted)',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 400,
    textDecoration: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'color 0.2s',
  })

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <NavLink to='/' end style={({ isActive }) => linkStyle(isActive)}>Dashboard</NavLink>
        <NavLink to='/jd-match' style={({ isActive }) => linkStyle(isActive)}>JD Match</NavLink>
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