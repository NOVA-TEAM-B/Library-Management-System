import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error in component boundary:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-lg mx-auto glass-panel border-rose-500/20 bg-rose-500/5 my-8 rounded-2xl animate-fade-in text-xs">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider">
              {this.props.fallbackTitle || "Component Execution Error"}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {this.state.error?.message || "An unexpected error occurred while rendering this module."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg border border-white/10 text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Component View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
