/**
 * Development-only logging utility
 * Only outputs logs when NODE_ENV is 'development'
 */
export function devLog(message: string, data?: Record<string, any>): void {
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    console.log(`[DEV] ${message}`, data ? data : "");
  }
}

/**
 * Development-only error logging utility
 * Only outputs error logs when NODE_ENV is 'development'
 */
export function devError(message: string, error?: Error | unknown): void {
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    const errorData =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;

    console.error(`[DEV ERROR] ${message}`, errorData ? errorData : "");
  }
}

/**
 * Development-only warning logging utility
 * Only outputs warning logs when NODE_ENV is 'development'
 */
export function devWarn(message: string, data?: Record<string, any>): void {
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    console.warn(`[DEV WARN] ${message}`, data ? data : "");
  }
}
