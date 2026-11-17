import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message) as { error?: string; operationType?: string; path?: string };
        if (parsed.error) {
          friendly = `${parsed.error} (Operation: ${parsed.operationType || 'unknown'}, Path: ${parsed.path || 'unknown'})`;
        }
      } catch {
        // plain error message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B111D] p-6">
          <div className="max-w-lg w-full p-6 rounded-xl bg-white dark:bg-[#172337] border border-rose-200 dark:border-rose-800 space-y-4">
            <div className="flex items-center gap-3 text-[#DC4C4C]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="font-display text-lg font-bold">Application Error</h1>
            </div>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-words bg-slate-50 dark:bg-[#101827] p-3 rounded-lg">
              {friendly}
            </p>
            <Button
              size="sm"
              iconLeft={<RotateCcw className="w-4 h-4" />}
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
