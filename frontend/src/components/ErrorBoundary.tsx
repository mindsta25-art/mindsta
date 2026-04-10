import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showOfflineIndicator?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isOnline: boolean;
  isRetrying: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;
  private onlineCheckInterval: number | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isOnline: navigator.onLine,
    isRetrying: false,
  };

  constructor(props: Props) {
    super(props);
    this.setupOnlineListener();
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Handle specific error types
    if (this.isChunkLoadError(error)) {
      this.handleChunkLoadError();
      return;
    }

    if (this.isNetworkError(error)) {
      this.handleNetworkError();
      return;
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (import.meta.env.PROD) {
      this.reportErrorToService(error, errorInfo);
    }

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
        custom_map: {
          component_stack: errorInfo.componentStack,
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
    window.location.href = "/";
  };

  handleRetry = async () => {
    const maxRetries = this.props.maxRetries || 3;

    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Wait a bit before retrying
    await new Promise(resolve => {
      this.retryTimeoutId = window.setTimeout(resolve, 1000 * (this.state.retryCount + 1));
    });

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  private setupOnlineListener() {
    const updateOnlineStatus = () => {
      this.setState({ isOnline: navigator.onLine });
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cleanup on unmount
    this.onlineCheckInterval = window.setInterval(updateOnlineStatus, 30000); // Check every 30s
  }

  private isChunkLoadError(error: Error): boolean {
    return error.message.includes('Loading chunk') ||
           error.message.includes('Loading CSS chunk') ||
           error.message.includes('ChunkLoadError');
  }

  private isNetworkError(error: Error): boolean {
    return error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }

  private handleChunkLoadError() {
    // For chunk load errors, try to reload once
    if (this.state.retryCount === 0) {
      console.log('Chunk load error detected, reloading...');
      window.location.reload();
    }
  }

  private handleNetworkError() {
    // Network errors are handled by the offline indicator
    console.log('Network error detected');
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Add your error reporting service here
    // Example implementations:

    // Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   });
    // }

    // LogRocket
    // if (window.LogRocket) {
    //   window.LogRocket.captureException(error, {
    //     extra: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   });
    // }

    // Custom API endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Ignore reporting errors to avoid infinite loops
    });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.onlineCheckInterval) {
      clearInterval(this.onlineCheckInterval);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-xl shadow-elevated p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We're sorry for the inconvenience. An unexpected error occurred.
              </p>

              {this.props.showOfflineIndicator !== false && !this.state.isOnline && (
                <div className="flex items-center justify-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded-lg">
                  <WifiOff className="w-4 h-4" />
                  <span>You appear to be offline</span>
                </div>
              )}

              {this.state.isRetrying && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-lg">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Retrying...</span>
                </div>
              )}
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-4 text-sm">
                <summary className="cursor-pointer font-semibold text-foreground mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong className="text-destructive">Error:</strong>
                    <pre className="mt-1 overflow-auto text-muted-foreground">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-destructive">Stack Trace:</strong>
                      <pre className="mt-1 overflow-auto text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-3">
              {this.props.enableRetry !== false && this.state.retryCount < (this.props.maxRetries || 3) && (
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="w-full gap-2"
                  size="lg"
                  variant="default"
                >
                  <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  Try Again {this.state.retryCount > 0 && `(${this.state.retryCount}/${this.props.maxRetries || 3})`}
                </Button>
              )}

              <Button
                onClick={this.handleReset}
                className="w-full gap-2"
                size="lg"
                variant={this.props.enableRetry !== false && this.state.retryCount < (this.props.maxRetries || 3) ? "outline" : "default"}
              >
                <RefreshCw className="w-4 h-4" />
                Return to Home
              </Button>

              <Button
                variant="outline"
                onClick={this.handleReload}
                className="w-full"
                size="lg"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
