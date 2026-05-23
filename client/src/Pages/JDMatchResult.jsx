// filename: client/src/Pages/JDMatchResult.jsx

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE, authHeaders } from '../lib/api'

export default function JDMatchResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/jd-match/${id}`, {
          headers: authHeaders(),
        })
        setMatch(res.data.match)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load match result.')
      } finally {
        setLoading(false)
      }
    }
    fetchMatch()
  }, [id])

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading...</p>
  if (error) return <p style={{ color: 'var(--danger)', padding: '2rem' }}>{error}</p>

  const score = match.match_score
  const scoreColor = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)'
  const parse = v => typeof v === 'string' ? JSON.parse(v) : v

  const matched = parse(match.matched_keywords)
  const missing = parse(match.missing_skills)
  const recs = parse(match.recommendations)

  const s = styles
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.topRow}>
        <div>
          <h1 style={s.title}>{match.job_title || 'JD Match Result'}</h1>
          {match.company_name && <p style={s.company}>{match.company_name}</p>}
        </div>
        <button onClick={() => navigate('/jd-match')} style={s.backBtn}>← New Analysis</button>
      </div>

      {/* Score hero */}
      <div style={s.scoreCard}>
        <div style={{ ...s.scoreBig, color: scoreColor }}>{score}</div>
        <div style={s.scoreLabel}>Match Score</div>
        <div style={s.scoreBar}>
          <div style={{ ...s.scoreBarFill, width: `${score}%`, background: scoreColor }} />
        </div>
        <p style={s.scoreHint}>
          {score >= 70 ? 'Strong match — apply with confidence' :
           score >= 40 ? 'Moderate match — some gaps to address' :
           'Weak match — significant gaps found'}
        </p>
      </div>

      <div style={s.grid}>
        {/* Matched keywords */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>✅ Matched Keywords</h2>
          <div style={s.tagWrap}>
            {matched.length ? matched.map((k, i) => (
              <span key={i} style={{ ...s.tag, ...s.tagGreen }}>{k}</span>
            )) : <p style={s.empty}>No matches found</p>}
          </div>
        </div>

        {/* Missing skills */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>❌ Missing Skills</h2>
          <div style={s.tagWrap}>
            {missing.length ? missing.map((k, i) => (
              <span key={i} style={{ ...s.tag, ...s.tagRed }}>{k}</span>
            )) : <p style={s.empty}>No major gaps!</p>}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>💡 Recommendations</h2>
        <ol style={s.recList}>
          {recs.map((r, i) => (
            <li key={i} style={s.recItem}>
              <span style={s.recNum}>{i + 1}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{r}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' },
  company: { color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' },
  backBtn: {
    background: 'var(--surface-2)', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  scoreCard: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center',
  },
  scoreBig: { fontSize: '5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 },
  scoreLabel: { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem', marginBottom: '1rem' },
  scoreBar: { height: '8px', background: 'var(--surface-2)', borderRadius: '99px', margin: '0 auto 1rem', maxWidth: '400px' },
  scoreBarFill: { height: '100%', borderRadius: '99px', transition: 'width 0.6s ease' },
  scoreHint: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  card: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem',
  },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  tag: { padding: '0.3rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 500 },
  tagGreen: { background: 'rgba(52,211,153,0.15)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)' },
  tagRed: { background: 'rgba(248,113,113,0.15)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)' },
  empty: { color: 'var(--text-muted)', fontSize: '0.875rem' },
  recList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: 0, listStyle: 'none' },
  recItem: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  recNum: {
    minWidth: '24px', height: '24px', borderRadius: '50%',
    background: 'var(--accent-glow)', color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
  },
}