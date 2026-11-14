import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Civic Air Quality Studio - Caught UI Exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" role="alert" style={{
          maxWidth: '640px',
          margin: '4rem auto',
          padding: '2rem',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #fee2e2',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#dc2626' }}>
            <AlertTriangle size={24} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Application Runtime Error</h2>
          </div>
          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>
            An unexpected error occurred while rendering the civic dashboard. Your underlying dataset is safe.
          </p>
          <pre style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#991b1b',
            overflowX: 'auto',
            marginBottom: '1.5rem'
          }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            Reload Studio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
