// src/components/ScoreBreakdown.jsx
import React, { useState } from 'react'

const CATEGORY_LABELS = {
  format: 'Format',
  content: 'Content',
  completeness: 'Completeness',
  optimization: 'Optimization',
}

export default function ScoreBreakdown({ categories }) {
  const [expanded, setExpanded] = useState('format') // format open by default

  if (!categories) return null

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      flex: 1,
      minWidth: '280px',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '1.5rem',
      }}>
        Score Breakdown
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          let raw = categories[key]
          if (typeof raw === 'string') {
            try { raw = JSON.parse(raw) } catch { raw = 0 }
          }

          const val = typeof raw === 'object' && raw !== null
            ? Math.round(raw.score ?? 0)
            : Math.round(raw ?? 0)

          const checks = typeof raw === 'object' ? (raw.checks ?? []) : []
          const issues = checks.flatMap(c => c.issues ?? [])
          const isOpen = expanded === key

          const color = val >= 75
            ? 'var(--success)'
            : val >= 50
            ? 'var(--warning)'
            : 'var(--danger)'

          return (
            <div key={key} style={{
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: `1px solid ${isOpen ? 'var(--accent)' : 'transparent'}`,
              transition: 'border-color 0.2s',
            }}>
              {/* Header row — always visible */}
              <div
                onClick={() => setExpanded(isOpen ? null : key)}
                style={{
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                {/* Score badge */}
                <div style={{
                  minWidth: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: `${color}22`,
                  border: `2px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color,
                }}>
                  {val}
                </div>

                {/* Label + bar */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.35rem',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                    }}>
                      {label}
                    </span>

                    {/* Issues pill — always shown */}
                    {issues.length > 0 ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isOpen ? 'var(--warning)' : 'var(--text-primary)',
                        background: isOpen ? 'rgba(255,180,0,0.15)' : 'var(--surface-3)',
                        border: `1px solid ${isOpen ? 'var(--warning)' : 'var(--border)'}`,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '99px',
                        letterSpacing: '0.2px',
                        transition: 'all 0.2s',
                      }}>
                        {isOpen ? '▲' : '▼'} {issues.length} issue{issues.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--success)',
                        background: 'rgba(0,200,100,0.12)',
                        border: '1px solid var(--success)',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '99px',
                      }}>
                        ✓ All good
                      </span>
                    )}
                  </div>

                  <div style={{
                    background: 'var(--surface-3)',
                    borderRadius: '99px',
                    height: '5px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${val}%`,
                      height: '100%',
                      background: color,
                      borderRadius: '99px',
                      transition: 'width 1s ease-in-out',
                    }} />
                  </div>
                </div>
              </div>

              {/* Expandable issues panel */}
              {isOpen && issues.length > 0 && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '0.75rem 1.25rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <p style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                  }}>
                    Issues to fix
                  </p>
                  {issues.map((issue, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                      background: 'var(--surface-1)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.75rem',
                    }}>
                      <span style={{
                        color: 'var(--warning)',
                        fontSize: '0.75rem',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}>
                        ⚠
                      </span>
                      <span style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}>
                        {issue}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Expanded + no issues state */}
              {isOpen && issues.length === 0 && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  color: 'var(--success)',
                  fontSize: '0.82rem',
                }}>
                  ✓ No issues found in this category
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}