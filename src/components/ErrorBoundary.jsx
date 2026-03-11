// @ts-nocheck — class component with dynamic error state; typed migration tracked in issue #TS-001
import React from 'react';
import PropTypes from 'prop-types';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SynthReel] Unhandled UI error', {
      error,
      errorInfo,
      context: this.props.context || 'unknown',
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div
          style={{
            maxWidth: 560,
            width: '100%',
            border: '1px solid #2e3347',
            borderRadius: 8,
            padding: 20,
            background: '#0f1320',
            color: '#dbe4ff',
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: '1.1rem' }}>Something went wrong</h1>
          <p style={{ color: '#9aa9d1' }}>The app hit an unexpected error. Reload to retry.</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: '.75rem',
              color: '#f6b2c1',
              background: '#12182a',
              padding: 10,
              borderRadius: 6,
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 12 }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  context: PropTypes.string,
};
