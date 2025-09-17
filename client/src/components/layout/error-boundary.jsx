/**
 * 🔹 Frontend (React) - Error Boundary Component
 * MERN Concepts Used:
 * ✅ Components - Class-based error boundary component
 * ✅ Props - Error boundary wrapping child components
 * ✅ State (useState) - Error state management using class state
 * ✅ useEffect - Component lifecycle methods (componentDidCatch)
 * ✅ Event Handling - Error catching and page reload handling
 * ✅ Conditional Rendering - Error UI vs normal children rendering
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Error message styling
 */

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ui] Uncaught error', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center text-red-600">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <pre className="text-xs whitespace-pre-wrap bg-red-50 p-4 rounded border border-red-200 max-w-xl mx-auto overflow-auto">{String(this.state.error)}</pre>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
