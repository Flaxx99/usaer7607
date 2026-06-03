import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="card bg-error/5 shadow-xl max-w-lg w-full">
            <div className="card-body items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-9 h-9 text-error" />
              </div>

              <h2 className="card-title text-2xl font-bold text-error">
                Algo sali&oacute; mal
              </h2>

              <p className="text-sm text-base-content/60 max-w-sm">
                Ocurri&oacute; un error inesperado en la interfaz. El equipo t&eacute;cnico ha sido notificado.
              </p>

              {this.state.error && (
                <div className="bg-base-100 p-3 rounded-box w-full">
                  <p className="text-xs font-semibold text-base-content/60 mb-1">
                    Detalle t&eacute;cnico:
                  </p>
                  <pre className="text-xs text-error bg-error/5 p-2 rounded-md overflow-auto max-h-28 font-mono">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              <div className="card-actions mt-2">
                <button
                  className="btn btn-outline btn-error"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4" />
                  Recargar P&aacute;gina
                </button>
                <a href="/dashboard" className="btn btn-primary">
                  <Home className="w-4 h-4" />
                  Ir al Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
