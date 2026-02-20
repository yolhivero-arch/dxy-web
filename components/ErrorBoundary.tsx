import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Initialize state as a class property. This is a more modern syntax and helps TypeScript's type inference, resolving issues with 'this.state' and 'this.props' being unrecognized.
  // Fix: The class property syntax for state seems to cause issues in this build environment. Reverting to a constructor to ensure `this.props` is correctly initialized.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="bg-white rounded-3xl shadow-xl border-t-8 border-rose-500 p-10 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Error de Aplicación</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">
              Ocurrió un error inesperado. Por favor, recargá la página.
            </p>
            {this.state.error && (
              <pre className="text-left bg-slate-100 rounded-xl p-4 text-xs text-rose-700 font-mono overflow-auto max-h-40 mb-6">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-slate-800 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-700 transition-all"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;