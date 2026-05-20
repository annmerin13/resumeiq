// src/components/ScoreCard.jsx
import React from 'react'

export default function ScoreCard({ score, label = 'Overall Score' }) {
  const size = 160
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const progress = isNaN(score) || score == null ? 0 : Math.min(Math.max(score, 0), 100)
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const getColor = (s) => {
    if (s >= 75) return 'var(--success)'
    if (s >= 50) return 'var(--warning)'
    return 'var(--danger)'
  }

  const color = getColor(progress)

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      minWidth: '220px',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        margin: 0,
      }}>
        {label}
      </p>

      {/* SVG circle with score overlaid via <text> — perfectly centered */}
      <svg height={size} width={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          stroke="var(--surface-3)"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress arc */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
        {/* Score label — rotated back so it's upright */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            fontWeight: 800,
            fontSize: '2.4rem',
            fill: color,
            fontFamily: 'var(--font-display)',
          }}
        >
          {Math.round(progress)}
        </text>
      </svg>
    </div>
  )
}