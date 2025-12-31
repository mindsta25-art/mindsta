/* eslint-disable @typescript-eslint/no-explicit-any */

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  additionalInfo?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private setupGlobalErrorHandlers() {
    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      this.logError(event.error || new Error(event.message), {
        type: "uncaught_error",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          type: "unhandled_rejection",
          reason: event.reason,
        }
      );
    });
  }

  logError(error: Error | unknown, additionalInfo?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalInfo,
    };

    this.logs.push(errorLog);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("Error logged:", errorLog);
    }

    // Send to external logging service in production
    if (import.meta.env.PROD) {
      this.sendToLoggingService(errorLog);
    }

    return errorLog;
  }

  private async sendToLoggingService(errorLog: ErrorLog) {
    // Implement your logging service integration here
    // Examples: Sentry, LogRocket, Datadog, etc.
    try {
      // Example: await fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorLog) });
      console.log("Would send to logging service:", errorLog);
    } catch (err) {
      console.error("Failed to send error to logging service:", err);
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  logInfo(message: string, additionalInfo?: Record<string, any>) {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, additionalInfo);
    }
  }

  logWarning(message: string, additionalInfo?: Record<string, any>) {
    if (import.meta.env.DEV) {
      console.warn(`[WARNING] ${message}`, additionalInfo);
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();

export const logError = (error: Error | unknown, additionalInfo?: Record<string, any>) => {
  return errorLogger.logError(error, additionalInfo);
};

export const logInfo = (message: string, additionalInfo?: Record<string, any>) => {
  errorLogger.logInfo(message, additionalInfo);
};

export const logWarning = (message: string, additionalInfo?: Record<string, any>) => {
  errorLogger.logWarning(message, additionalInfo);
};
