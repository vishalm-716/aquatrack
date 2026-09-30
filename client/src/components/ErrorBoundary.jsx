import React from 'react';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state card" style={{ margin: '40px auto', maxWidth: '500px' }}>
          <HiOutlineExclamationTriangle style={{ fontSize: '48px', color: 'var(--danger)', margin: '0 auto 12px' }} />
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
