// ABOUTME: Analytics dashboard page with authentication and metrics display
// ABOUTME: Private dashboard for viewing visitor statistics and engagement data

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Dashboard({ authenticated = false }) {
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
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
      <div data-testid="analytics-dashboard" className="mobile-responsive" style={styles.dashboard}>
        <header style={styles.header}>
          <h1>Analytics Dashboard</h1>
          <p>Last updated: {formatDate(data.lastUpdated)}</p>
        </header>

        <div style={styles.metricsGrid}>
          {/* Visitor Metrics */}
          <div style={styles.card}>
            <h2>Visitors</h2>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.visitors.total}</span>
              <span style={styles.metricLabel}>Total Visitors</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.visitors.today}</span>
              <span style={styles.metricLabel}>Today's Visitors</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.visitors.unique}</span>
              <span style={styles.metricLabel}>Unique Visitors</span>
            </div>
          </div>

          {/* Click Metrics */}
          <div style={styles.card}>
            <h2>Engagement</h2>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.clicks.total}</span>
              <span style={styles.metricLabel}>Total Clicks</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.clicks.today}</span>
              <span style={styles.metricLabel}>Today's Clicks</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.clicks.rate.toFixed(1)}%</span>
              <span style={styles.metricLabel}>Click Rate</span>
            </div>
          </div>

          {/* Conversion Metrics */}
          <div style={styles.card}>
            <h2>Conversions</h2>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.conversions.total}</span>
              <span style={styles.metricLabel}>Conversions</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.conversions.rate.toFixed(1)}%</span>
              <span style={styles.metricLabel}>Conversion Rate</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricValue}>${data.conversions.revenue}</span>
              <span style={styles.metricLabel}>Revenue</span>
            </div>
          </div>

          {/* Time & Scroll Metrics */}
          <div style={styles.card}>
            <h2>Behavior</h2>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{formatTime(data.averageTime)}</span>
              <span style={styles.metricLabel}>Average Time on Page</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricValue}>{data.scrollDepth.average}%</span>
              <span style={styles.metricLabel}>Average Scroll Depth</span>
            </div>
          </div>

          {/* Scroll Depth Distribution */}
          <div style={styles.card}>
            <h2>Scroll Depth Distribution</h2>
            {data.scrollDepth.distribution.map((item) => (
              <div key={item.depth} style={styles.metric}>
                <span style={styles.metricValue}>{item.count}</span>
                <span style={styles.metricLabel}>{item.depth}% depth</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
  dashboard: {
    padding: '2rem',
    backgroundColor: '#f0f0f0',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #eee',
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    color: '#666',
    fontSize: '0.9rem',
  },
}