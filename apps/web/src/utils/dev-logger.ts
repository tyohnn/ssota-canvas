import { config } from '@/config';

const isDevelopment = config.environment === 'development';

/**
 * Development-only logging utility
 * Only outputs logs when NODE_ENV is 'development'
 */
export function devLog(message: string, data?: Record<string, any>): void {
  if (isDevelopment) {
    const timestamp = new Date().toISOString();
    console.log(`[DEV] ${message}`, data ? data : '');
  }
}

/**
 * Production event logging with sampling (10% rate)
 * Use for important business events only
 * - Invitation created/accepted
 * - Organization created/deleted
 * - Ownership transferred
 */
export function eventLog(message: string, data?: Record<string, any>): void {
  // Development: Always log
  if (isDevelopment) {
    console.log(`[EVENT] ${message}`, data ? data : '');
    return;
  }

  // Production: 10% sampling
  if (Math.random() < 0.1) {
    console.log(`[EVENT] ${message}`, data ? data : '');
  }
}

/**
 * Development-only error logging utility
 * Only outputs error logs when NODE_ENV is 'development'
 */
export function devError(message: string, error?: Error | unknown): void {
  if (isDevelopment) {
    const timestamp = new Date().toISOString();
    const errorData =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;

    console.error(`[DEV ERROR] ${message}`, errorData ? errorData : '');
  }
}

/**
 * Development-only warning logging utility
 * Only outputs warning logs when NODE_ENV is 'development'
 */
export function devWarn(message: string, data?: Record<string, any>): void {
  if (isDevelopment) {
    const timestamp = new Date().toISOString();
    console.warn(`[DEV WARN] ${message}`, data ? data : '');
  }
}

/**
 * Performance timing utility for measuring execution time
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    if (isDevelopment) {
      console.log(`[PERF] ${this.label}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }

  log(message: string, data?: Record<string, any>): void {
    const currentTime = performance.now() - this.startTime;
    if (isDevelopment) {
      console.log(
        `[PERF] ${this.label} - ${message}: ${currentTime.toFixed(2)}ms`,
        data ? data : ''
      );
    }
  }
}

/**
 * Create a performance timer
 */
export function startTimer(label: string): PerformanceTimer {
  return new PerformanceTimer(label);
}
