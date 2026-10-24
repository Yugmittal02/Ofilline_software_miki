import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleCopy = () => {
    const text = `${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack || ''}`
    navigator.clipboard?.writeText(text)
    alert('Error details copied to clipboard')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff7ed',
          padding: '20px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fed7aa',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px'
            }}>
              ⚠️
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1c1917',
              margin: '0 0 8px'
            }}>
              BillEasy Encountered a Problem
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#78716c',
              margin: '0 0 20px',
              lineHeight: 1.5
            }}>
              The application encountered an unexpected error. You can try reloading the application.
            </p>

            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              textAlign: 'left',
              maxHeight: '160px',
              overflowY: 'auto'
            }}>
              <p style={{
                margin: 0,
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#991b1b',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.toString() || 'Unknown error'}
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload BillEasy
              </button>

              <button
                onClick={this.handleCopy}
                style={{
                  background: '#f5f5f4',
                  color: '#44403c',
                  border: '1px solid #d6d3d1',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Copy Error
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
