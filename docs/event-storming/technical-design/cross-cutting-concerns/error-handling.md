# Error Handling Strategy

쏘타 MVP의 에러 처리 전략과 도메인별 에러 관리 방식을 정의합니다.

---

## 🎯 Error Handling Principles

1. **Fail Fast**: 입력 검증 단계에서 빠른 실패
2. **Graceful Degradation**: 사용자 경험을 해치지 않는 우아한 실패
3. **Context Preservation**: 디버깅을 위한 충분한 컨텍스트 정보
4. **User-Friendly Messages**: 사용자가 이해할 수 있는 에러 메시지
5. **Structured Logging**: 구조화된 로깅으로 모니터링 지원

---

## 🏗️ Error Architecture

### Error Hierarchy

```typescript
// Base Error Classes
abstract class DomainError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number
  abstract readonly isOperational: boolean
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Application Errors
abstract class ApplicationError extends DomainError {
  abstract readonly code: string
  abstract readonly statusCode: number
  readonly isOperational = true
}

// Infrastructure Errors
abstract class InfrastructureError extends DomainError {
  abstract readonly code: string
  abstract readonly statusCode: number
  readonly isOperational = false
}

// Validation Errors
abstract class ValidationError extends ApplicationError {
  abstract readonly code: string
  readonly statusCode = 400
}
```

---

## 🎨 Domain-Specific Errors

### Visual Canvas Domain

```typescript
// Canvas Errors
export class CanvasNotFoundError extends ApplicationError {
  readonly code = 'CANVAS_NOT_FOUND'
  readonly statusCode = 404
  
  constructor(pageId: string) {
    super(`Canvas not found for page: ${pageId}`, { pageId })
  }
}

export class CanvasAlreadyInitializedError extends ApplicationError {
  readonly code = 'CANVAS_ALREADY_INITIALIZED'
  readonly statusCode = 409
  
  constructor(pageId: string) {
    super(`Canvas already initialized for page: ${pageId}`, { pageId })
  }
}

// Block Errors
export class BlockNotFoundError extends ApplicationError {
  readonly code = 'BLOCK_NOT_FOUND'
  readonly statusCode = 404
  
  constructor(blockId: string) {
    super(`Block not found: ${blockId}`, { blockId })
  }
}

export class InvalidBlockTypeError extends ValidationError {
  readonly code = 'INVALID_BLOCK_TYPE'
  
  constructor(type: string, validTypes: string[]) {
    super(`Invalid block type: ${type}. Valid types: ${validTypes.join(', ')}`, {
      type,
      validTypes
    })
  }
}

export class BlockPositionOutOfBoundsError extends ValidationError {
  readonly code = 'BLOCK_POSITION_OUT_OF_BOUNDS'
  
  constructor(position: Position, bounds: Bounds) {
    super(`Block position ${JSON.stringify(position)} is out of bounds ${JSON.stringify(bounds)}`, {
      position,
      bounds
    })
  }
}

// Edge Errors
export class InvalidEdgeConnectionError extends ValidationError {
  readonly code = 'INVALID_EDGE_CONNECTION'
  
  constructor(sourceId: string, targetId: string, reason: string) {
    super(`Cannot connect ${sourceId} to ${targetId}: ${reason}`, {
      sourceId,
      targetId,
      reason
    })
  }
}

export class CircularEdgeError extends ValidationError {
  readonly code = 'CIRCULAR_EDGE'
  
  constructor(sourceId: string, targetId: string) {
    super(`Circular edge detected: ${sourceId} -> ${targetId}`, {
      sourceId,
      targetId
    })
  }
}
```

### Component System Domain

```typescript
// Component Errors
export class ComponentNotFoundError extends ApplicationError {
  readonly code = 'COMPONENT_NOT_FOUND'
  readonly statusCode = 404
  
  constructor(componentId: string) {
    super(`Component not found: ${componentId}`, { componentId })
  }
}

export class ComponentNameAlreadyExistsError extends ApplicationError {
  readonly code = 'COMPONENT_NAME_ALREADY_EXISTS'
  readonly statusCode = 409
  
  constructor(name: string, workspaceId: string) {
    super(`Component name '${name}' already exists in workspace`, {
      name,
      workspaceId
    })
  }
}

// Instance Errors
export class InstanceNotFoundError extends ApplicationError {
  readonly code = 'INSTANCE_NOT_FOUND'
  readonly statusCode = 404
  
  constructor(instanceId: string) {
    super(`Instance not found: ${instanceId}`, { instanceId })
  }
}

export class InstanceSyncFailedError extends ApplicationError {
  readonly code = 'INSTANCE_SYNC_FAILED'
  readonly statusCode = 500
  
  constructor(instanceId: string, componentId: string, reason: string) {
    super(`Failed to sync instance ${instanceId} with component ${componentId}: ${reason}`, {
      instanceId,
      componentId,
      reason
    })
  }
}

export class InstanceDetachFailedError extends ApplicationError {
  readonly code = 'INSTANCE_DETACH_FAILED'
  readonly statusCode = 500
  
  constructor(instanceId: string, reason: string) {
    super(`Failed to detach instance ${instanceId}: ${reason}`, {
      instanceId,
      reason
    })
  }
}

// Property Errors
export class InvalidPropertyTypeError extends ValidationError {
  readonly code = 'INVALID_PROPERTY_TYPE'
  
  constructor(propertyName: string, expectedType: string, actualType: string) {
    super(`Property '${propertyName}' has invalid type. Expected: ${expectedType}, Actual: ${actualType}`, {
      propertyName,
      expectedType,
      actualType
    })
  }
}

export class PropertyValueOutOfRangeError extends ValidationError {
  readonly code = 'PROPERTY_VALUE_OUT_OF_RANGE'
  
  constructor(propertyName: string, value: any, min?: number, max?: number) {
    super(`Property '${propertyName}' value ${value} is out of range [${min ?? '∞'}, ${max ?? '∞'}]`, {
      propertyName,
      value,
      min,
      max
    })
  }
}
```

### Workspace Structure Domain

```typescript
// Organization Errors
export class OrganizationNotFoundError extends ApplicationError {
  readonly code = 'ORGANIZATION_NOT_FOUND'
  readonly statusCode = 404
  
  constructor(organizationId: string) {
    super(`Organization not found: ${organizationId}`, { organizationId })
  }
}

export class OrganizationSyncFailedError extends ApplicationError {
  readonly code = 'ORGANIZATION_SYNC_FAILED'
  readonly statusCode = 500
  
  constructor(clerkOrgId: string, reason: string) {
    super(`Failed to sync organization ${clerkOrgId}: ${reason}`, {
      clerkOrgId,
      reason
    })
  }
}

// Workspace Errors
export class WorkspaceNotFoundError extends ApplicationError {
  readonly code = 'WORKSPACE_NOT_FOUND'
  readonly statusCode = 404
  
  constructor(workspaceId: string) {
    super(`Workspace not found: ${workspaceId}`, { workspaceId })
  }
}

export class WorkspaceLimitExceededError extends ValidationError {
  readonly code = 'WORKSPACE_LIMIT_EXCEEDED'
  
  constructor(organizationId: string, currentCount: number, limit: number) {
    super(`Workspace limit exceeded for organization. Current: ${currentCount}, Limit: ${limit}`, {
      organizationId,
      currentCount,
      limit
    })
  }
}

// Page Errors
export class PageNotFoundError extends ApplicationError {
  readonly code = 'PAGE_NOT_FOUND'
  readonly statusCode = 404
  
  constructor(pageId: string) {
    super(`Page not found: ${pageId}`, { pageId })
  }
}

export class CircularPageReferenceError extends ValidationError {
  readonly code = 'CIRCULAR_PAGE_REFERENCE'
  
  constructor(pageId: string, parentId: string) {
    super(`Circular reference detected: page ${pageId} cannot be parent of ${parentId}`, {
      pageId,
      parentId
    })
  }
}

export class PageHierarchyTooDeepError extends ValidationError {
  readonly code = 'PAGE_HIERARCHY_TOO_DEEP'
  
  constructor(pageId: string, currentDepth: number, maxDepth: number) {
    super(`Page hierarchy too deep. Current: ${currentDepth}, Max: ${maxDepth}`, {
      pageId,
      currentDepth,
      maxDepth
    })
  }
}
```

### Permission & Authorization Errors

```typescript
export class UnauthorizedError extends ApplicationError {
  readonly code = 'UNAUTHORIZED'
  readonly statusCode = 401
  
  constructor(action?: string) {
    super(`Unauthorized access${action ? ` for action: ${action}` : ''}`, { action })
  }
}

export class InsufficientPermissionError extends ApplicationError {
  readonly code = 'INSUFFICIENT_PERMISSION'
  readonly statusCode = 403
  
  constructor(
    userId: string,
    resource: string,
    requiredPermission: string,
    actualPermission?: string
  ) {
    super(`Insufficient permission for user ${userId} on ${resource}. Required: ${requiredPermission}${actualPermission ? `, Actual: ${actualPermission}` : ''}`, {
      userId,
      resource,
      requiredPermission,
      actualPermission
    })
  }
}

export class ResourceNotAccessibleError extends ApplicationError {
  readonly code = 'RESOURCE_NOT_ACCESSIBLE'
  readonly statusCode = 403
  
  constructor(userId: string, resourceId: string, resourceType: string) {
    super(`User ${userId} cannot access ${resourceType} ${resourceId}`, {
      userId,
      resourceId,
      resourceType
    })
  }
}
```

### Infrastructure Errors

```typescript
export class DatabaseConnectionError extends InfrastructureError {
  readonly code = 'DATABASE_CONNECTION_ERROR'
  readonly statusCode = 503
  
  constructor(operation: string, reason: string) {
    super(`Database connection failed during ${operation}: ${reason}`, {
      operation,
      reason
    })
  }
}

export class DatabaseTransactionError extends InfrastructureError {
  readonly code = 'DATABASE_TRANSACTION_ERROR'
  readonly statusCode = 500
  
  constructor(operation: string, reason: string) {
    super(`Database transaction failed during ${operation}: ${reason}`, {
      operation,
      reason
    })
  }
}

export class ExternalServiceError extends InfrastructureError {
  readonly code = 'EXTERNAL_SERVICE_ERROR'
  readonly statusCode = 502
  
  constructor(
    serviceName: string,
    operation: string,
    reason: string
  ) {
    super(`External service ${serviceName} failed during ${operation}: ${reason}`, {
      serviceName,
      operation,
      reason
    })
  }
}

export class ClerkWebhookError extends InfrastructureError {
  readonly code = 'CLERK_WEBHOOK_ERROR'
  readonly statusCode = 500
  
  constructor(webhookType: string, reason: string) {
    super(`Clerk webhook ${webhookType} failed: ${reason}`, {
      webhookType,
      reason
    })
  }
}
```

---

## 🛠️ Error Handling Implementation

### Error Handler Factory

```typescript
class ErrorHandler {
  private static instance: ErrorHandler
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }
  
  async handleError(
    error: unknown,
    context?: {
      operation: string
      userId?: string
      resourceId?: string
      additionalContext?: Record<string, any>
    }
  ): Promise<never> {
    // 1. Normalize error
    const normalizedError = this.normalizeError(error)
    
    // 2. Log error
    await this.logError(normalizedError, context)
    
    // 3. Track error
    await this.trackError(normalizedError, context)
    
    // 4. Re-throw or handle gracefully
    throw normalizedError
  }
  
  private normalizeError(error: unknown): DomainError {
    if (error instanceof DomainError) {
      return error
    }
    
    if (error instanceof Error) {
      return new InfrastructureError(
        error.message,
        { originalError: error.name, stack: error.stack }
      )
    }
    
    return new InfrastructureError(
      'Unknown error occurred',
      { originalError: String(error) }
    )
  }
  
  private async logError(
    error: DomainError,
    context?: Record<string, any>
  ): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        context: error.context,
        stack: error.stack
      },
      operation: context?.operation,
      userId: context?.userId,
      resourceId: context?.resourceId,
      additionalContext: context?.additionalContext
    }
    
    if (error.isOperational) {
      console.warn('Operational Error:', logData)
    } else {
      console.error('System Error:', logData)
    }
  }
  
  private async trackError(
    error: DomainError,
    context?: Record<string, any>
  ): Promise<void> {
    // Send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      await this.sendToErrorTracking(error, context)
    }
  }
  
  private async sendToErrorTracking(
    error: DomainError,
    context?: Record<string, any>
  ): Promise<void> {
    // Implementation for error tracking service
    // e.g., Sentry.captureException(error, { extra: context })
  }
}
```

### Server Action Error Handling

```typescript
// Error handling wrapper for Server Actions
export function withErrorHandling<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  operation: string
) {
  return async (...args: T): Promise<R> => {
    const errorHandler = ErrorHandler.getInstance()
    
    try {
      return await action(...args)
    } catch (error) {
      await errorHandler.handleError(error, {
        operation,
        additionalContext: { args: args.length }
      })
    }
  }
}

// Usage in Server Actions
export const createBlockAction = withErrorHandling(
  async (input: CreateBlockInput) => {
    'use server'
    
    // Validation
    const validated = createBlockSchema.parse(input)
    
    // Domain logic
    const command = new CreateBlockCommand(validated)
    const events = await blockService.execute(command)
    
    // Cross-domain processing
    await processBlockEvents(events)
    
    return { success: true, blockId: events[0].blockId }
  },
  'createBlock'
)
```

### Client-Side Error Handling

```typescript
// React Error Boundary
export class DomainErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: DomainError }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error: error instanceof DomainError ? error : undefined
    }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to client-side error tracking
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}

// Error Fallback Component
function ErrorFallback({ error }: { error?: DomainError }) {
  const handleRetry = () => {
    window.location.reload()
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          {error?.isOperational 
            ? error.message 
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <Button onClick={handleRetry}>
          Try Again
        </Button>
      </div>
    </div>
  )
}
```

### Validation Error Handling

```typescript
// Zod Error Mapper
export function mapZodError(error: ZodError): ValidationError[] {
  return error.errors.map(zodError => {
    const path = zodError.path.join('.')
    const message = zodError.message
    
    return new ValidationError(
      'VALIDATION_ERROR',
      `${path}: ${message}`,
      {
        path,
        code: zodError.code,
        message,
        received: zodError.received
      }
    )
  })
}

// Validation wrapper
export function withValidation<T>(
  schema: ZodSchema<T>,
  errorMessage?: string
) {
  return (input: unknown): T => {
    try {
      return schema.parse(input)
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = mapZodError(error)
        throw new ValidationError(
          'INPUT_VALIDATION_FAILED',
          errorMessage || 'Input validation failed',
          { errors: validationErrors }
        )
      }
      throw error
    }
  }
}
```

---

## 📊 Error Monitoring & Analytics

### Error Metrics

```typescript
interface ErrorMetrics {
  totalErrors: number
  errorRate: number
  errorsByType: Record<string, number>
  errorsByDomain: Record<string, number>
  topErrors: Array<{
    error: string
    count: number
    lastOccurred: Date
  }>
  resolutionTime: number // Average time to resolve
}

class ErrorMetricsCollector {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorRate: 0,
    errorsByType: {},
    errorsByDomain: {},
    topErrors: [],
    resolutionTime: 0
  }
  
  recordError(error: DomainError, context?: Record<string, any>): void {
    this.metrics.totalErrors++
    
    // Update error counts
    this.metrics.errorsByType[error.code] = 
      (this.metrics.errorsByType[error.code] || 0) + 1
    
    // Extract domain from error name
    const domain = this.extractDomain(error.name)
    this.metrics.errorsByDomain[domain] = 
      (this.metrics.errorsByDomain[domain] || 0) + 1
    
    // Update top errors
    this.updateTopErrors(error)
  }
  
  private extractDomain(errorName: string): string {
    // Extract domain from error class name
    // e.g., "CanvasNotFoundError" -> "VisualCanvas"
    if (errorName.includes('Canvas') || errorName.includes('Block') || errorName.includes('Edge')) {
      return 'VisualCanvas'
    }
    if (errorName.includes('Component') || errorName.includes('Instance')) {
      return 'ComponentSystem'
    }
    if (errorName.includes('Workspace') || errorName.includes('Page') || errorName.includes('Organization')) {
      return 'WorkspaceStructure'
    }
    return 'Infrastructure'
  }
  
  private updateTopErrors(error: DomainError): void {
    const existingError = this.metrics.topErrors.find(e => e.error === error.code)
    
    if (existingError) {
      existingError.count++
      existingError.lastOccurred = new Date()
    } else {
      this.metrics.topErrors.push({
        error: error.code,
        count: 1,
        lastOccurred: new Date()
      })
    }
    
    // Sort by count and keep top 10
    this.metrics.topErrors.sort((a, b) => b.count - a.count)
    this.metrics.topErrors = this.metrics.topErrors.slice(0, 10)
  }
  
  getMetrics(): ErrorMetrics {
    return { ...this.metrics }
  }
}
```

이 에러 처리 전략은 **도메인별 특화된 에러**, **구조화된 에러 처리**, **포괄적인 모니터링**을 통해 안정적이고 디버깅 가능한 시스템을 구축합니다.
