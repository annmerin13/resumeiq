// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE, authHeaders } from '../lib/api'

const MAX_FILE_BYTES = 5 * 1024 * 1024

export default function Dashboard() {
  const fileInputRef = useRef(null)
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const fetchResumes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/resume`, { headers: authHeaders() })
      setResumes(res.data)
      setError(null)
    } catch (e) {
      console.error(e)
      setError('Failed to load resumes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchResumes() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are allowed.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File too large. Maximum size is 5MB.')
      e.target.value = ''
      return
    }

    const form = new FormData()
    form.append('resume', file)
    setUploading(true)
    setError(null)
    try {
      await axios.post(`${API_BASE}/api/resume/upload`, form, {
        headers: authHeaders(),
      })
      await fetchResumes()
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please sign in again.')
        navigate('/login')
        return
      }
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this resume? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await axios.delete(`${API_BASE}/api/resume/${id}`, { headers: authHeaders() })
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resume')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.8rem',
            color: 'var(--text-primary)',
          }}>
            My Resumes
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            marginTop: '0.25rem',
          }}>
            Upload a resume to get your AI-powered score
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent-bright)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.6rem 1.4rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            opacity: uploading ? 0.6 : 1,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {uploading ? 'Uploading...' : '+ Upload Resume'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleUpload}
          style={{ display: 'none' }}
          disabled={uploading}
        />
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          color: 'var(--danger)',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Loading...
          </p>
        </div>
      ) : resumes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--surface-1)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            marginBottom: '0.5rem',
          }}>
            No resumes yet
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Upload your first resume to get an AI-powered score
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {resumes.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/scores/${r.id}`)}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.background = 'var(--surface-2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--surface-1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <div style={{
                  background: 'var(--accent-glow)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.65rem',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                }}>
                  📄
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--surface-3)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '99px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {r.file_name?.split('.').pop() || 'PDF'}
                </span>
              </div>

              <p style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--text-primary)',
                marginBottom: '0.3rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {r.file_name || `Resume #${r.id}`}
              </p>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })
                  : '—'}
              </p>

              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  color: 'var(--accent)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  View Score →
                </span>

                <button
                  onClick={(e) => handleDelete(e, r.id)}
                  disabled={deletingId === r.id}
                  style={{
                    background: 'rgba(248,113,113,0.15)',
                    border: '1px solid rgba(248,113,113,0.6)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#F87171',
                    cursor: deletingId === r.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.3rem 0.75rem',
                    transition: 'all 0.2s',
                    opacity: deletingId === r.id ? 0.5 : 1,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {deletingId === r.id ? 'Deleting…' : '🗑 Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
