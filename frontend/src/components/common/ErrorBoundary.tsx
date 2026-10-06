import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[React Error Boundary]: Caught unhandled UI error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-surface-background flex flex-col items-center justify-center p-4">
                    <div className="bg-white border border-surface-border rounded-xl p-6 max-w-md w-full shadow-subtle space-y-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Application Error</h2>
                            <p className="text-xs text-slate-500 mt-1">
                                An unexpected error occurred while rendering this interface component.
                            </p>
                        </div>
                        {this.state.error && (
                            <div className="p-3 bg-slate-50 border border-surface-border rounded-lg text-left overflow-x-auto">
                                <p className="font-mono text-[10px] text-rose-700">{this.state.error.message}</p>
                            </div>
                        )}
                        <Button icon={RefreshCw} onClick={this.handleReset} className="w-full">
                            Reload Workspace
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}