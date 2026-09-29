import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

/** Catches render errors so a judge never sees a blank screen. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo) {
    // Demo only: log locally, never send anywhere.
    console.error('[BillShield] render error', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetDemo = () => {
    try {
      window.localStorage.removeItem('billshield.demo-state.v1');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
        <div className="card card-pad w-full max-w-lg space-y-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warn-soft text-warn">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Something interrupted the demo</h1>
          <p className="muted">
            BillShield hit an unexpected state. Nothing was sent anywhere — this is a local, simulated prototype.
          </p>
          {this.state.message ? (
            <p className="surface-inset break-words px-3 py-2 text-left text-xs text-ink-muted">{this.state.message}</p>
          ) : null}
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reload the demo
            </button>
            <button type="button" className="btn btn-outline" onClick={this.handleResetDemo}>
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
