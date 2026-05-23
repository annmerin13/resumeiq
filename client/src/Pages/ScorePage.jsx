// src/pages/ScorePage.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE, authHeaders } from '../lib/api'
import ScoreCard from '../components/ScoreCard'
import ScoreBreakdown from '../components/ScoreBreakdown'

export default function ScorePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/api/scores/analyze/${id}`,
          {},
          { headers: authHeaders(true) }
        )

        console.log('API response:', res.data)

        setScore({
          overallScore: res.data.overallScore,
          categories: res.data.categories,
        })
      } catch (err) {
        console.error('Fetch failed:', err.response?.data || err.message)
        setError('Failed to analyze resume. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [id])

  if (loading) return (
    <div style={{
      textAlign: 'center',
      padding: '4rem',
      color: 'var(--text-muted)',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
        Analyzing resume...
      </p>
    </div>
  )

  if (error) return (
    <div style={{
      textAlign: 'center',
      padding: '4rem',
      color: 'var(--danger)',
    }}>
      <p>{error}</p>
    </div>
  )

  if (!score) return null

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        ← Back to Dashboard
      </button>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '1.8rem',
        color: 'var(--text-primary)',
        marginBottom: '0.4rem',
      }}>
        Score Analysis
      </h1>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        marginBottom: '2rem',
      }}>
        Resume #{id}
      </p>

      <div style={{
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}>
        <ScoreCard score={score.overallScore} />
        <ScoreBreakdown categories={score.categories} />
      </div>
    </div>
  )
}