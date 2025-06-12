// ABOUTME: Professional analytics dashboard component with interactive charts
// ABOUTME: Displays visitor metrics, engagement data, and conversion funnel with Chart.js visualizations

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function EnhancedDashboard({ data }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [animatedMetrics, setAnimatedMetrics] = useState({
    visitors: 0,
    clicks: 0,
    leads: 0,
    checkouts: 0
  })

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Animate numbers on mount
  useEffect(() => {
    const duration = 1000
    const steps = 60
    const interval = duration / steps
    
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      setAnimatedMetrics({
        visitors: Math.floor(data.visitors.total * progress),
        clicks: Math.floor(data.clicks.total * progress),
        leads: Math.floor(data.leads.total * progress),
        checkouts: Math.floor(data.checkoutForms.total * progress)
      })
      
      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)
    
    return () => clearInterval(timer)
  }, [data])

  // Theme colors
  const theme = {
    light: {
      bg: '#ffffff',
      cardBg: '#f8f9fa',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      primary: '#e6ac55',
      secondary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      chartGrid: 'rgba(0, 0, 0, 0.05)'
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      border: '#334155',
      primary: '#e6ac55',
      secondary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      chartGrid: 'rgba(255, 255, 255, 0.05)'
    }
  }

  const currentTheme = isDarkMode ? theme.dark : theme.light

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Prepare timeline chart data
  const timelineData = {
    labels: data.timeline.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Visitors',
        data: data.timeline.map(item => item.visitors),
        borderColor: currentTheme.primary,
        backgroundColor: `${currentTheme.primary}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: currentTheme.primary,
        pointBorderColor: currentTheme.bg,
        pointBorderWidth: 2
      },
      {
        label: 'Clicks',
        data: data.timeline.map(item => item.clicks),
        borderColor: currentTheme.secondary,
        backgroundColor: `${currentTheme.secondary}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: currentTheme.secondary,
        pointBorderColor: currentTheme.bg,
        pointBorderWidth: 2
      }
    ]
  }

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: currentTheme.text,
          font: {
            size: 12,
            weight: '500'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Visitor Activity - Last 7 Days',
        color: currentTheme.text,
        font: {
          size: 16,
          weight: '600'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: currentTheme.cardBg,
        titleColor: currentTheme.text,
        bodyColor: currentTheme.textSecondary,
        borderColor: currentTheme.border,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: currentTheme.textSecondary,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: currentTheme.chartGrid,
          drawBorder: false
        },
        ticks: {
          color: currentTheme.textSecondary,
          font: {
            size: 11
          },
          callback: function(value) {
            return formatNumber(value)
          }
        }
      }
    }
  }

  // Prepare scroll depth doughnut data
  const scrollData = {
    labels: data.scrollDepth.distribution.map(item => `${item.depth}% Depth`),
    datasets: [{
      data: data.scrollDepth.distribution.map(item => item.count),
      backgroundColor: [
        currentTheme.danger,
        currentTheme.warning,
        currentTheme.secondary,
        currentTheme.success
      ],
      borderColor: currentTheme.bg,
      borderWidth: 3,
      hoverOffset: 4
    }]
  }

  const scrollOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: currentTheme.text,
          font: {
            size: 12,
            weight: '500'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Scroll Depth Distribution',
        color: currentTheme.text,
        font: {
          size: 16,
          weight: '600'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: currentTheme.cardBg,
        titleColor: currentTheme.text,
        bodyColor: currentTheme.textSecondary,
        borderColor: currentTheme.border,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${formatNumber(context.parsed)} (${percentage}%)`
          }
        }
      }
    }
  }

  // Prepare funnel chart data
  const funnelData = {
    labels: ['Visitors', 'Clicks', 'Leads', 'Checkouts', 'Conversions'],
    datasets: [{
      label: 'Conversion Funnel',
      data: [
        data.visitors.total,
        data.clicks.total,
        data.leads.total,
        data.checkoutForms.total,
        data.conversions.total
      ],
      backgroundColor: [
        `${currentTheme.primary}`,
        `${currentTheme.secondary}`,
        `${currentTheme.success}`,
        `${currentTheme.warning}`,
        `${currentTheme.danger}`
      ],
      borderColor: currentTheme.bg,
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  }

  const funnelOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Conversion Funnel',
        color: currentTheme.text,
        font: {
          size: 16,
          weight: '600'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: currentTheme.cardBg,
        titleColor: currentTheme.text,
        bodyColor: currentTheme.textSecondary,
        borderColor: currentTheme.border,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const percentage = context.dataIndex > 0 
              ? ((context.parsed.y / funnelData.datasets[0].data[context.dataIndex - 1]) * 100).toFixed(1)
              : '100'
            return `${formatNumber(context.parsed.y)} (${percentage}% of previous)`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: currentTheme.textSecondary,
          font: {
            size: 11,
            weight: '500'
          }
        }
      },
      y: {
        grid: {
          color: currentTheme.chartGrid,
          drawBorder: false
        },
        ticks: {
          color: currentTheme.textSecondary,
          font: {
            size: 11
          },
          callback: function(value) {
            return formatNumber(value)
          }
        }
      }
    }
  }

  return (
    <div style={{
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        borderBottom: `1px solid ${currentTheme.border}`,
        background: `linear-gradient(135deg, ${currentTheme.cardBg} 0%, ${currentTheme.bg} 100%)`
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: isMobile ? '1.5rem' : '2rem', 
              fontWeight: '700',
              margin: '0 0 0.5rem 0',
              background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Analytics Dashboard
            </h1>
            <p style={{ 
              color: currentTheme.textSecondary, 
              margin: 0,
              fontSize: '0.875rem'
            }}>
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: `1px solid ${currentTheme.border}`,
              backgroundColor: currentTheme.cardBg,
              color: currentTheme.text,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = currentTheme.border
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = currentTheme.cardBg
            }}
          >
            {isDarkMode ? '☀️' : '🌙'} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {/* Total Visitors Card */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '1.5rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,${isDarkMode ? '0.3' : '0.1'})`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: `linear-gradient(135deg, ${currentTheme.primary}20 0%, ${currentTheme.primary}05 100%)`,
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.textSecondary,
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Total Visitors
              </div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700',
                color: currentTheme.primary,
                lineHeight: 1
              }}>
                {formatNumber(animatedMetrics.visitors)}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.success,
                marginTop: '0.5rem',
                fontWeight: '500'
              }}>
                +{formatNumber(data.visitors.today)} today
              </div>
            </div>
          </div>

          {/* Total Clicks Card */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '1.5rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,${isDarkMode ? '0.3' : '0.1'})`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: `linear-gradient(135deg, ${currentTheme.secondary}20 0%, ${currentTheme.secondary}05 100%)`,
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.textSecondary,
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Total Clicks
              </div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700',
                color: currentTheme.secondary,
                lineHeight: 1
              }}>
                {formatNumber(animatedMetrics.clicks)}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.textSecondary,
                marginTop: '0.5rem',
                fontWeight: '500'
              }}>
                {data.clicks.rate.toFixed(1)}% CTR
              </div>
            </div>
          </div>

          {/* Leads Card */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '1.5rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,${isDarkMode ? '0.3' : '0.1'})`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: `linear-gradient(135deg, ${currentTheme.success}20 0%, ${currentTheme.success}05 100%)`,
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.textSecondary,
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Leads Generated
              </div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700',
                color: currentTheme.success,
                lineHeight: 1
              }}>
                {formatNumber(animatedMetrics.leads)}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.textSecondary,
                marginTop: '0.5rem',
                fontWeight: '500'
              }}>
                {data.leads.conversionRate.toFixed(1)}% conversion
              </div>
            </div>
          </div>

          {/* Average Time Card */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '1.5rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,${isDarkMode ? '0.3' : '0.1'})`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: `linear-gradient(135deg, ${currentTheme.warning}20 0%, ${currentTheme.warning}05 100%)`,
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.textSecondary,
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Avg. Time on Page
              </div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700',
                color: currentTheme.warning,
                lineHeight: 1
              }}>
                {formatTime(data.averageTime)}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: currentTheme.textSecondary,
                marginTop: '0.5rem',
                fontWeight: '500'
              }}>
                {data.scrollDepth.average}% avg scroll
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem'
        }}>
          {/* Timeline Chart */}
          <div style={{
            gridColumn: isMobile ? 'span 1' : 'span 2',
            backgroundColor: currentTheme.cardBg,
            padding: isMobile ? '1rem' : '2rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            boxShadow: `0 4px 20px rgba(0,0,0,${isDarkMode ? '0.2' : '0.05'})`
          }}>
            <div style={{ height: '300px' }}>
              <Line data={timelineData} options={timelineOptions} />
            </div>
          </div>

          {/* Scroll Depth Doughnut */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: isMobile ? '1rem' : '2rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            boxShadow: `0 4px 20px rgba(0,0,0,${isDarkMode ? '0.2' : '0.05'})`
          }}>
            <div style={{ height: '300px' }}>
              <Doughnut data={scrollData} options={scrollOptions} />
            </div>
          </div>

          {/* Funnel Chart */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: isMobile ? '1rem' : '2rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            boxShadow: `0 4px 20px rgba(0,0,0,${isDarkMode ? '0.2' : '0.05'})`
          }}>
            <div style={{ height: '300px' }}>
              <Bar data={funnelData} options={funnelOptions} />
            </div>
          </div>

        {/* Traffic Sources */}
        {data.trafficSources && data.trafficSources.sources.length > 0 && (
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '2rem',
            borderRadius: '1rem',
            border: `1px solid ${currentTheme.border}`,
            marginTop: '2rem',
            boxShadow: `0 4px 20px rgba(0,0,0,${isDarkMode ? '0.2' : '0.05'})`
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: currentTheme.text,
              marginBottom: '1.5rem'
            }}>
              Top Traffic Sources
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.trafficSources.sources.map((source, index) => {
                const getSourceIcon = () => {
                  if (source.type === 'direct') return '🔗'
                  if (source.type === 'referrer') return '🌐'
                  return '📊' // UTM
                }
                
                const getSourceColor = () => {
                  if (source.type === 'direct') return currentTheme.primary
                  if (source.type === 'referrer') return currentTheme.success
                  return currentTheme.warning // UTM
                }
                
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '0.5rem',
                      backgroundColor: `${getSourceColor()}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}>
                      {getSourceIcon()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: currentTheme.text,
                          textTransform: source.type === 'utm' ? 'uppercase' : 'capitalize'
                        }}>
                          {source.name}
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: currentTheme.text
                          }}>
                            {formatNumber(source.views)}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            color: currentTheme.textSecondary
                          }}>
                            ({source.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div style={{
                        height: '4px',
                        backgroundColor: currentTheme.border,
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${source.percentage}%`,
                          backgroundColor: getSourceColor(),
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>

        {/* Connection Status */}
        {data.connectionStatus && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: currentTheme.cardBg,
            borderRadius: '0.5rem',
            border: `1px solid ${currentTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: data.connectionStatus.connected
                ? (data.connectionStatus.type === 'redis' ? currentTheme.success : currentTheme.warning)
                : currentTheme.danger,
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontWeight: '500' }}>
              {data.connectionStatus.connected ? (
                data.connectionStatus.type === 'redis' 
                  ? 'Connected to Redis' 
                  : 'Using In-Memory Storage'
              ) : 'Disconnected'}
            </span>
            {data.connectionStatus.connected && data.connectionStatus.type !== 'redis' && (
              <span style={{ color: currentTheme.textSecondary }}>
                (Data will be lost on restart)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Add pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}