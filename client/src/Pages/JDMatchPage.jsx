import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE, authHeaders } from '../lib/api'

const MAX_FILE_BYTES = 5 * 1024 * 1024

export default function JDMatchPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [resumes, setResumes] = useState([])
  const [resumeId, setResumeId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const fetchResumes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/resume`, { headers: authHeaders() })
      setResumes(res.data)
      if (res.data.length > 0 && !resumeId) {
        setResumeId(String(res.data[0].id))
      }
    } catch {
      setError('Failed to load resumes.')
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

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

    if (!localStorage.getItem('token')) {
      setError('Please sign in to upload a resume.')
      navigate('/login')
      return
    }

    const form = new FormData()
    form.append('resume', file)
    setUploading(true)
    setError('')
    setUploadSuccess('')
    try {
      const res = await axios.post(`${API_BASE}/api/resume/upload`, form, {
        headers: authHeaders(),
      })
      const uploaded = res.data.resume
      await fetchResumes()
      if (uploaded?.id) setResumeId(String(uploaded.id))
      setUploadSuccess(`Uploaded: ${uploaded.file_name || file.name}`)
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

    const handleAnalyze = async () => {
      
    if (!resumeId || !jobDescription.trim()) {
      setError('Select a resume and paste a job description.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        `${API_BASE}/api/jd-match/analyze`,
        {
          resume_id: Number(resumeId),
          job_title: jobTitle,
          company_name: companyName,
          job_description: jobDescription,
        },
        { headers: authHeaders(true) }
      )
      navigate(`/jd-match/${res.data.match.id}`)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Analyze API not found. Restart the server (npm run dev in server folder).')
        return
      }
      setError(
        err.response?.data?.error
        || err.response?.data?.message
        || 'Analysis failed. Check server logs and GROQ_API_KEY in .env.'
      )
    } finally {
      setLoading(false)
    }
  }

  const s = styles
  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>JD Match Analyzer</h1>
        <p style={s.subtitle}>See how well your resume fits a job description</p>
      </div>

      <div style={s.card}>
        <div style={s.field}>
          <div style={s.rowBetween}>
            <label style={s.label}>Select Resume</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                ...s.uploadBtn,
                opacity: uploading ? 0.6 : 1,
                cursor: uploading ? 'not-allowed' : 'pointer',
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
          {resumes.length === 0 ? (
            <p style={s.hint}>No resumes yet. Upload a PDF or DOCX to get started.</p>
          ) : (
            <select
              value={resumeId}
              onChange={e => setResumeId(e.target.value)}
              style={s.select}
            >
              <option value="">— choose a resume —</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.file_name}</option>
              ))}
            </select>
          )}
        </div>

        <div style={s.row}>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Job Title <span style={s.optional}>(optional)</span></label>
            <input
              style={s.input}
              placeholder="e.g. Software Engineer"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
          </div>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Company <span style={s.optional}>(optional)</span></label>
            <input
              style={s.input}
              placeholder="e.g. Google"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Job Description</label>
          <textarea
            style={s.textarea}
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={12}
          />
          <span style={s.charCount}>{jobDescription.length} chars</span>
        </div>

        {uploadSuccess && <p style={s.success}>{uploadSuccess}</p>}
        {error && <p style={s.error}>{error}</p>}

        <button
          onClick={handleAnalyze}
          disabled={loading || uploading || !resumeId}
          style={{ ...s.btn, opacity: loading || uploading || !resumeId ? 0.6 : 1 }}
        >
          {loading ? 'Analyzing...' : 'Analyze Match →'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: '780px', margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '0.4rem',
  },
  subtitle: { color: 'var(--text-muted)', fontSize: '0.95rem' },
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.4rem',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  row: { display: 'flex', gap: '1rem' },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.02em',
  },
  optional: { fontWeight: 400, color: 'var(--text-muted)' },
  hint: { color: 'var(--text-muted)', fontSize: '0.875rem' },
  uploadBtn: {
    background: 'var(--accent-dim)',
    color: 'var(--accent-bright)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  select: {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.6rem 0.9rem',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    cursor: 'pointer',
  },
  input: {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.6rem 0.9rem',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
  },
  textarea: {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.8rem 0.9rem',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.6,
  },
  charCount: { fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'flex-end' },
  success: { color: 'var(--success, #4ade80)', fontSize: '0.875rem' },
  error: { color: 'var(--danger)', fontSize: '0.875rem' },
  btn: {
    background: 'var(--accent-dim)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    transition: 'all 0.2s',
  },
}
