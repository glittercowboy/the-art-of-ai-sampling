// ABOUTME: Analytics dashboard page with authentication and metrics display
// ABOUTME: Private dashboard for viewing visitor statistics and engagement data

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import EnhancedDashboard from '../components/EnhancedDashboard'

export default function Dashboard({ authenticated = false }) {
  // Add pulse animation styles
  if (typeof window !== 'undefined' && !document.getElementById('pulse-animation')) {
    const style = document.createElement('style')
    style.id = 'pulse-animation'
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyticsData()
    }
  }, [isAuthenticated])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${password}`
        }
      })

      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
        setIsAuthenticated(true)
      } else {
        const errorData = await response.json()
        setError('Invalid password')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${password}`
        }
      })

      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (err) {
      setError('Error loading analytics data')
    } finally {
      setLoading(false)
    }
  }


  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Analytics Dashboard - Login</title>
        </Head>
        <div style={styles.loginContainer}>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <h1>Analytics Dashboard Login</h1>
            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </>
    )
  }

  if (loading && !data) {
    return (
      <>
        <Head>
          <title>Analytics Dashboard</title>
        </Head>
        <div style={styles.loadingContainer}>
          <p>Loading analytics data...</p>
        </div>
      </>
    )
  }

  if (error && !data) {
    return (
      <>
        <Head>
          <title>Analytics Dashboard</title>
        </Head>
        <div style={styles.errorContainer}>
          <p>Error loading analytics data</p>
          <button onClick={fetchAnalyticsData} style={styles.button}>
            Retry
          </button>
        </div>
      </>
    )
  }

  if (!data) {
    return null
  }

  return (
    <>
      <Head>
        <title>Analytics Dashboard</title>
      </Head>
      <EnhancedDashboard data={data} />
    </>
  )
}

const styles = {
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f0f0',
  },
  loginForm: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  inputGroup: {
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#e6ac55',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginBottom: '1rem',
    padding: '0.5rem',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
}