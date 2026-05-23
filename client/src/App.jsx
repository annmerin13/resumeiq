// filename: client/src/App.jsx

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/theme.css'

import Navbar from './components/Navbar'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Dashboard from './Pages/Dashboard'
import ScorePage from './Pages/ScorePage'
import JDMatchPage from './Pages/JDMatchPage'
import JDMatchResult from './Pages/JDMatchResult'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar />
                <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/scores/:id" element={<ScorePage />} />
                    <Route path="/jd-match" element={<JDMatchPage />} />
                    <Route path="/jd-match/:id" element={<JDMatchResult />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App