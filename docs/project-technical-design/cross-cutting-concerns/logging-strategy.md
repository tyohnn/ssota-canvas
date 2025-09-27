# Logging Strategy

쏘타 MVP의 로깅 전략과 구조화된 로깅 시스템을 정의합니다.

---

## 🎯 Logging Principles

1. **Structured Logging**: JSON 형태의 구조화된 로그
2. **Context Preservation**: 요청 추적을 위한 상관관계 ID
3. **Performance Monitoring**: 성능 메트릭 포함
4. **Security Compliance**: 민감한 데이터 제외
5. **Operational Insights**: 운영에 필요한 정보 제공

---

## 📊 Log Levels & Categories

### Log Levels

```typescript
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  correlationId?: string
  userId?: string
  operation?: string
  duration?: number
  domain?: string
  action?: string
}
```

### Log Categories

```typescript
enum LogCategory {
  // Domain Operations
  DOMAIN_OPERATION = 'domain.operation',
  DOMAIN_EVENT = 'domain.event',
  DOMAIN_ERROR = 'domain.error',
  
  // Infrastructure
  DATABASE_QUERY = 'database.query',
  DATABASE_TRANSACTION = 'database.transaction',
  EXTERNAL_API = 'external.api',
  CACHE_OPERATION = 'cache.operation',
  
  // Security
  AUTHENTICATION = 'security.auth',
  AUTHORIZATION = 'security.authz',
  AUDIT = 'security.audit',
  
  // Performance
  PERFORMANCE = 'performance',
  REQUEST_LIFECYCLE = 'request.lifecycle',
  
  // Business
  USER_ACTION = 'business.user_action',
  BUSINESS_EVENT = 'business.event'
}
```

---

## 🏗️ Logging Architecture

### Logger Interface

```typescript
interface Logger {
  error(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  debug(message: string, context?: Record<string, any>): void
  trace(message: string, context?: Record<string, any>): void
  
  // Domain-specific logging
  domainOperation(operation: string, context?: Record<string, any>): void
  domainEvent(event: DomainEvent, context?: Record<string, any>): void
  domainError(error: DomainError, context?: Record<string, any>): void
  
  // Performance logging
  performance(operation: string, duration: number, context?: Record<string, any>): void
  
  // Security logging
  security(event: string, context?: Record<string, any>): void
  
  // Business logging
  business(event: string, context?: Record<string, any>): void
}
```

### Structured Logger Implementation

```typescript
class StructuredLogger implements Logger {
  private readonly serviceName: string
  private readonly version: string
  
  constructor(serviceName: string, version: string) {
    this.serviceName = serviceName
    this.version = version
  }
  
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      correlationId: this.getCorrelationId(),
      userId: this.getCurrentUserId(),
      service: this.serviceName,
      version: this.version,
      environment: process.env.NODE_ENV
    }
  }
  
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined
    
    const sanitized = { ...context }
    
    // Remove sensitive data
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization']
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    // Sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeContext(sanitized[key])
      }
    })
    
    return sanitized
  }
  
  private getCorrelationId(): string | undefined {
    // Get correlation ID from async context or generate new one
    return globalThis.correlationId || this.generateCorrelationId()
  }
  
  private getCurrentUserId(): string | undefined {
    // Get current user ID from auth context
    try {
      const { userId } = auth()
      return userId
    } catch {
      return undefined
    }
  }
  
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private log(entry: LogEntry): void {
    const logString = JSON.stringify(entry)
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString)
        break
      case LogLevel.WARN:
        console.warn(logString)
        break
      case LogLevel.INFO:
        console.info(logString)
        break
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV !== 'production') {
          console.debug(logString)
        }
        break
      case LogLevel.TRACE:
        if (process.env.NODE_ENV === 'development') {
          console.trace(logString)
        }
        break
    }
    
    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry)
    }
  }
  
  error(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context)
    this.log(entry)
  }
  
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context)
    this.log(entry)
  }
  
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.log(entry)
  }
  
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.log(entry)
  }
  
  trace(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.TRACE, message, context)
    this.log(entry)
  }
  
  domainOperation(operation: string, context?: Record<string, any>): void {
    this.info(`Domain operation: ${operation}`, {
      ...context,
      category: LogCategory.DOMAIN_OPERATION,
      operation
    })
  }
  
  domainEvent(event: DomainEvent, context?: Record<string, any>): void {
    this.info(`Domain event: ${event.type}`, {
      ...context,
      category: LogCategory.DOMAIN_EVENT,
      eventType: event.type,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      version: event.version,
      eventData: event.data
    })
  }
  
  domainError(error: DomainError, context?: Record<string, any>): void {
    this.error(`Domain error: ${error.message}`, {
      ...context,
      category: LogCategory.DOMAIN_ERROR,
      errorCode: error.code,
      errorName: error.name,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      errorContext: error.context
    })
  }
  
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      category: LogCategory.PERFORMANCE,
      operation,
      duration,
      durationMs: duration
    })
  }
  
  security(event: string, context?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      category: LogCategory.AUTHENTICATION,
      securityEvent: event
    })
  }
  
  business(event: string, context?: Record<string, any>): void {
    this.info(`Business event: ${event}`, {
      ...context,
      category: LogCategory.BUSINESS_EVENT,
      businessEvent: event
    })
  }
  
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implementation for external logging service
    // e.g., send to DataDog, New Relic, or custom log aggregation service
  }
}
```

---

## 🎨 Domain-Specific Logging

### Visual Canvas Domain Logger

```typescript
class CanvasLogger {
  constructor(private logger: Logger) {}
  
  logCanvasInitialization(pageId: string, blockCount: number): void {
    this.logger.domainOperation('canvas.initialize', {
      pageId,
      blockCount,
      domain: 'visual-canvas'
    })
  }
  
  logBlockCreation(blockId: string, blockType: string, pageId: string): void {
    this.logger.domainOperation('block.create', {
      blockId,
      blockType,
      pageId,
      domain: 'visual-canvas'
    })
  }
  
  logBlockMovement(
    blockId: string, 
    fromPosition: Position, 
    toPosition: Position,
    duration: number
  ): void {
    this.logger.domainOperation('block.move', {
      blockId,
      fromPosition,
      toPosition,
      domain: 'visual-canvas'
    })
    
    this.logger.performance('block.move', duration, {
      blockId,
      domain: 'visual-canvas'
    })
  }
  
  logEdgeCreation(
    edgeId: string, 
    sourceId: string, 
    targetId: string
  ): void {
    this.logger.domainOperation('edge.create', {
      edgeId,
      sourceId,
      targetId,
      domain: 'visual-canvas'
    })
  }
  
  logCanvasError(error: DomainError, operation: string): void {
    this.logger.domainError(error, {
      operation,
      domain: 'visual-canvas'
    })
  }
}
```

### Component System Domain Logger

```typescript
class ComponentLogger {
  constructor(private logger: Logger) {}
  
  logComponentCreation(
    componentId: string, 
    name: string, 
    workspaceId: string,
    propertyCount: number
  ): void {
    this.logger.domainOperation('component.create', {
      componentId,
      name,
      workspaceId,
      propertyCount,
      domain: 'component-system'
    })
  }
  
  logInstanceCreation(
    instanceId: string, 
    componentId: string, 
    blockId: string,
    overrideCount: number
  ): void {
    this.logger.domainOperation('instance.create', {
      instanceId,
      componentId,
      blockId,
      overrideCount,
      domain: 'component-system'
    })
  }
  
  logInstanceSync(
    instanceId: string, 
    componentId: string, 
    syncedProperties: string[],
    duration: number
  ): void {
    this.logger.domainOperation('instance.sync', {
      instanceId,
      componentId,
      syncedProperties,
      domain: 'component-system'
    })
    
    this.logger.performance('instance.sync', duration, {
      instanceId,
      componentId,
      domain: 'component-system'
    })
  }
  
  logInstanceDetachment(
    instanceId: string, 
    componentId: string,
    reason: string
  ): void {
    this.logger.domainOperation('instance.detach', {
      instanceId,
      componentId,
      reason,
      domain: 'component-system'
    })
  }
  
  logComponentError(error: DomainError, operation: string): void {
    this.logger.domainError(error, {
      operation,
      domain: 'component-system'
    })
  }
}
```

### Workspace Structure Domain Logger

```typescript
class WorkspaceLogger {
  constructor(private logger: Logger) {}
  
  logWorkspaceCreation(
    workspaceId: string, 
    name: string, 
    organizationId: string,
    createdBy: string
  ): void {
    this.logger.domainOperation('workspace.create', {
      workspaceId,
      name,
      organizationId,
      createdBy,
      domain: 'workspace-structure'
    })
    
    this.logger.business('workspace.created', {
      workspaceId,
      organizationId,
      createdBy
    })
  }
  
  logPageCreation(
    pageId: string, 
    title: string, 
    workspaceId: string,
    parentId?: string
  ): void {
    this.logger.domainOperation('page.create', {
      pageId,
      title,
      workspaceId,
      parentId,
      domain: 'workspace-structure'
    })
  }
  
  logPageMovement(
    pageId: string, 
    sourceWorkspaceId: string, 
    targetWorkspaceId: string,
    duration: number
  ): void {
    this.logger.domainOperation('page.move', {
      pageId,
      sourceWorkspaceId,
      targetWorkspaceId,
      domain: 'workspace-structure'
    })
    
    this.logger.performance('page.move', duration, {
      pageId,
      domain: 'workspace-structure'
    })
  }
  
  logOrganizationSync(
    organizationId: string, 
    clerkOrgId: string,
    memberCount: number,
    duration: number
  ): void {
    this.logger.domainOperation('organization.sync', {
      organizationId,
      clerkOrgId,
      memberCount,
      domain: 'workspace-structure'
    })
    
    this.logger.performance('organization.sync', duration, {
      organizationId,
      domain: 'workspace-structure'
    })
  }
  
  logWorkspaceError(error: DomainError, operation: string): void {
    this.logger.domainError(error, {
      operation,
      domain: 'workspace-structure'
    })
  }
}
```

---

## 🔍 Performance & Request Logging

### Request Lifecycle Logger

```typescript
class RequestLogger {
  constructor(private logger: Logger) {}
  
  logRequestStart(
    method: string, 
    url: string, 
    userId?: string,
    requestId?: string
  ): void {
    this.logger.info('Request started', {
      category: LogCategory.REQUEST_LIFECYCLE,
      method,
      url,
      userId,
      requestId,
      action: 'request.start'
    })
  }
  
  logRequestEnd(
    method: string, 
    url: string, 
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string
  ): void {
    this.logger.info('Request completed', {
      category: LogCategory.REQUEST_LIFECYCLE,
      method,
      url,
      statusCode,
      duration,
      durationMs: duration,
      userId,
      requestId,
      action: 'request.end'
    })
    
    this.logger.performance('request.total', duration, {
      method,
      url,
      statusCode,
      userId
    })
  }
  
  logServerActionStart(
    actionName: string, 
    input: any,
    userId?: string
  ): void {
    this.logger.debug('Server action started', {
      category: LogCategory.REQUEST_LIFECYCLE,
      actionName,
      inputSize: JSON.stringify(input).length,
      userId,
      action: 'server_action.start'
    })
  }
  
  logServerActionEnd(
    actionName: string, 
    result: any,
    duration: number,
    userId?: string
  ): void {
    this.logger.debug('Server action completed', {
      category: LogCategory.REQUEST_LIFECYCLE,
      actionName,
      resultSize: JSON.stringify(result).length,
      duration,
      userId,
      action: 'server_action.end'
    })
    
    this.logger.performance(`server_action.${actionName}`, duration, {
      actionName,
      userId
    })
  }
}
```

### Database Operation Logger

```typescript
class DatabaseLogger {
  constructor(private logger: Logger) {}
  
  logQuery(
    operation: string, 
    table: string, 
    duration: number,
    rowCount?: number,
    query?: string
  ): void {
    this.logger.debug('Database query executed', {
      category: LogCategory.DATABASE_QUERY,
      operation,
      table,
      duration,
      rowCount,
      query: query ? this.sanitizeQuery(query) : undefined,
      action: 'database.query'
    })
    
    this.logger.performance(`database.${operation}`, duration, {
      table,
      rowCount
    })
  }
  
  logTransaction(
    operation: string, 
    tables: string[], 
    duration: number,
    success: boolean
  ): void {
    this.logger.info('Database transaction executed', {
      category: LogCategory.DATABASE_TRANSACTION,
      operation,
      tables,
      duration,
      success,
      action: 'database.transaction'
    })
    
    this.logger.performance(`database.transaction.${operation}`, duration, {
      tables,
      success
    })
  }
  
  private sanitizeQuery(query: string): string {
    // Remove sensitive data from SQL queries
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='[REDACTED]'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='[REDACTED]'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret='[REDACTED]'")
  }
}
```

---

## 🔐 Security & Audit Logging

### Security Logger

```typescript
class SecurityLogger {
  constructor(private logger: Logger) {}
  
  logAuthentication(
    event: 'login' | 'logout' | 'login_failed' | 'token_refresh',
    userId?: string,
    method?: string,
    context?: Record<string, any>
  ): void {
    this.logger.security(`Authentication: ${event}`, {
      userId,
      method,
      ...context,
      category: LogCategory.AUTHENTICATION
    })
  }
  
  logAuthorization(
    event: 'access_granted' | 'access_denied' | 'permission_changed',
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): void {
    this.logger.security(`Authorization: ${event}`, {
      userId,
      resource,
      action,
      ...context,
      category: LogCategory.AUTHORIZATION
    })
  }
  
  logAudit(
    event: string,
    userId: string,
    resource: string,
    action: string,
    details?: Record<string, any>
  ): void {
    this.logger.info('Audit event', {
      category: LogCategory.AUDIT,
      auditEvent: event,
      userId,
      resource,
      action,
      details,
      action: 'audit.event'
    })
  }
  
  logSecurityViolation(
    violation: string,
    userId?: string,
    context?: Record<string, any>
  ): void {
    this.logger.warn('Security violation detected', {
      category: LogCategory.AUTHENTICATION,
      violation,
      userId,
      ...context,
      action: 'security.violation'
    })
  }
}
```

---

## 📊 Log Aggregation & Analysis

### Log Metrics Collector

```typescript
interface LogMetrics {
  totalLogs: number
  logsByLevel: Record<LogLevel, number>
  logsByCategory: Record<string, number>
  logsByDomain: Record<string, number>
  averageResponseTime: number
  errorRate: number
  topErrors: Array<{
    error: string
    count: number
    lastOccurred: Date
  }>
}

class LogMetricsCollector {
  private metrics: LogMetrics = {
    totalLogs: 0,
    logsByLevel: {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.DEBUG]: 0,
      [LogLevel.TRACE]: 0
    },
    logsByCategory: {},
    logsByDomain: {},
    averageResponseTime: 0,
    errorRate: 0,
    topErrors: []
  }
  
  recordLog(entry: LogEntry): void {
    this.metrics.totalLogs++
    this.metrics.logsByLevel[entry.level]++
    
    // Track by category
    if (entry.context?.category) {
      this.metrics.logsByCategory[entry.context.category] = 
        (this.metrics.logsByCategory[entry.context.category] || 0) + 1
    }
    
    // Track by domain
    if (entry.domain) {
      this.metrics.logsByDomain[entry.domain] = 
        (this.metrics.logsByDomain[entry.domain] || 0) + 1
    }
    
    // Track performance
    if (entry.duration) {
      this.updateAverageResponseTime(entry.duration)
    }
    
    // Track errors
    if (entry.level === LogLevel.ERROR) {
      this.updateErrorRate()
      this.updateTopErrors(entry)
    }
  }
  
  private updateAverageResponseTime(duration: number): void {
    const totalRequests = this.metrics.logsByLevel[LogLevel.INFO]
    if (totalRequests > 0) {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (totalRequests - 1) + duration) / totalRequests
    }
  }
  
  private updateErrorRate(): void {
    const totalLogs = this.metrics.totalLogs
    const errorLogs = this.metrics.logsByLevel[LogLevel.ERROR]
    this.metrics.errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0
  }
  
  private updateTopErrors(entry: LogEntry): void {
    const errorCode = entry.context?.errorCode || entry.message
    
    const existingError = this.metrics.topErrors.find(e => e.error === errorCode)
    
    if (existingError) {
      existingError.count++
      existingError.lastOccurred = new Date(entry.timestamp)
    } else {
      this.metrics.topErrors.push({
        error: errorCode,
        count: 1,
        lastOccurred: new Date(entry.timestamp)
      })
    }
    
    // Sort by count and keep top 10
    this.metrics.topErrors.sort((a, b) => b.count - a.count)
    this.metrics.topErrors = this.metrics.topErrors.slice(0, 10)
  }
  
  getMetrics(): LogMetrics {
    return { ...this.metrics }
  }
  
  reset(): void {
    this.metrics = {
      totalLogs: 0,
      logsByLevel: {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.DEBUG]: 0,
        [LogLevel.TRACE]: 0
      },
      logsByCategory: {},
      logsByDomain: {},
      averageResponseTime: 0,
      errorRate: 0,
      topErrors: []
    }
  }
}
```

---

## 🚀 Logging Integration

### Logger Factory

```typescript
class LoggerFactory {
  private static loggers: Map<string, Logger> = new Map()
  private static metricsCollector = new LogMetricsCollector()
  
  static getLogger(name: string): Logger {
    if (!LoggerFactory.loggers.has(name)) {
      const logger = new StructuredLogger(name, process.env.APP_VERSION || '1.0.0')
      LoggerFactory.loggers.set(name, logger)
    }
    
    return LoggerFactory.loggers.get(name)!
  }
  
  static getDomainLogger(domain: string): Logger {
    return LoggerFactory.getLogger(`domain.${domain}`)
  }
  
  static getMetricsCollector(): LogMetricsCollector {
    return LoggerFactory.metricsCollector
  }
}

// Usage
const canvasLogger = LoggerFactory.getDomainLogger('visual-canvas')
const componentLogger = LoggerFactory.getDomainLogger('component-system')
const workspaceLogger = LoggerFactory.getDomainLogger('workspace-structure')
```

### Middleware Integration

```typescript
// Next.js Middleware for request logging
export function requestLoggingMiddleware(req: NextRequest): NextResponse {
  const requestLogger = LoggerFactory.getLogger('request')
  const startTime = Date.now()
  
  // Log request start
  requestLogger.logRequestStart(
    req.method,
    req.url,
    req.headers.get('x-user-id') || undefined,
    req.headers.get('x-request-id') || undefined
  )
  
  // Continue with request
  const response = NextResponse.next()
  
  // Log request end
  const duration = Date.now() - startTime
  requestLogger.logRequestEnd(
    req.method,
    req.url,
    response.status,
    duration,
    req.headers.get('x-user-id') || undefined,
    req.headers.get('x-request-id') || undefined
  )
  
  return response
}
```

이 로깅 전략은 **구조화된 로깅**, **도메인별 특화**, **성능 모니터링**, **보안 감사**를 통해 운영에 필요한 모든 정보를 체계적으로 수집하고 분석할 수 있도록 합니다.
