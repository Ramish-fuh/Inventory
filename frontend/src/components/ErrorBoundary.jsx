import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '1rem', color: '#ff3b30' }}>
          <h3>Something went wrong</h3>
          {this.props.fallback || 'An error occurred while loading this component.'}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;