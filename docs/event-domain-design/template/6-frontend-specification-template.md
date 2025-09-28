# [Domain Name] - Frontend Specification

Software Design을 기반으로 한 프론트엔드 구현 명세서입니다.

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: [도메인명] (예: User Management, Workspace Structure)
- **주요 기능**: [핵심 기능 목록]
- **UI 컴포넌트**: [주요 컴포넌트 목록]

### 개발 우선순위
1. **Phase 1**: 핵심 타입 및 Context 구현
2. **Phase 2**: Server Actions 및 Hook 구현  
3. **Phase 3**: 컴포넌트 구현 및 통합

---

### 1.1 기본 도메인 타입

**파일 위치**: `src/domains/[도메인명]/types.ts`

```typescript
// Software Design의 Aggregate 속성을 기반으로 정의
export interface [EntityName] {
  id: [EntityId];
  // Software Design에서 정의된 속성들을 그대로 interface로 정의
  [property1]: [Type1];
  [property2]: [Type2];
  // DB 스키마와 다른 부분은 주석으로 명시
  [computedProperty]?: [Type3]; // 런타임 계산 필드 (DB 저장 안함)
  createdAt: Date;
  updatedAt: Date;
}

// Value Objects를 type alias로 정의
export type [EntityId] = string;
export type [ValueObjectName] = string;
```

### 1.2 클라이언트 확장 타입

**파일 위치**: `src/domains/[도메인명]/client-types.ts`

```typescript
import { [EntityName] } from './types';

// UI에서 필요한 추가 필드들
export interface [EntityName]WithExtensions extends [EntityName] {
  // 여러 Aggregate를 조합한 필드들
  [relatedEntities]: [RelatedEntitySummary][];
  // UI 전용 필드들
  [uiSpecificField]?: [Type];
}

// 요약 타입들 (목록 표시용)
export interface [EntityName]Summary {
  id: [EntityId];
  [displayField]: string;
  [countField]: number;
  [statusField]: boolean;
}

// 폼 입력용 타입들
export interface [EntityName]FormInput {
  [inputField1]: string;
  [inputField2]?: string;
}

// Read Models 타입 활용 (Technical Specification에서 정의된 것을 import)
export interface [EntityName]View {
  // 복합 조회를 위한 Read Model 타입
  [mainEntity]: [EntityName];
  [relatedEntities]: [RelatedEntity][];
  [aggregatedData]: {
    [countField]: number;
    [statusSummary]: [StatusType][];
  };
}
```

## 🎛️ 2. React Context 구현

### 2.1 Context 타입 정의

**파일 위치**: `src/contexts/[도메인명]Context.tsx`

```typescript
import { createContext, useContext } from 'react';
import { [EntityName], [EntityName]WithExtensions } from '@/domains/[도메인명]/types';

// Context 상태 타입
interface [DomainName]State {
  // 도메인 엔티티들
  [entities]: [EntityName][];
  [currentEntity]: [EntityName]WithExtensions | null;
  
  // Read Models (복합 조회 데이터)
  [entityView]: [EntityName]View | null;
  [summaryViews]: [SummaryView][];
  
  // UI 상태
  isLoading: boolean;
  is[Action]ing: boolean;
  isLoadingView: boolean;
  
  // 에러 상태
  error: string | null;
}

// Context 액션 타입 (Software Design의 Command들 기반)
interface [DomainName]Actions {
  // 주요 액션들 (Command 이름 기반)
  [commandName]: ([params]) => Promise<void>;
  [anotherCommand]: ([params]) => Promise<void>;
  
  // 조회/새로고침 액션들
  refresh[Entities]: () => Promise<void>;
  refresh[EntityView]: () => Promise<void>;
  load[SummaryViews]: () => Promise<void>;
  
  // 에러 처리
  clearError: () => void;
}

// Context 타입
interface [DomainName]ContextType {
  state: [DomainName]State;
  actions: [DomainName]Actions;
}

const [DomainName]Context = createContext<[DomainName]ContextType | null>(null);

export { [DomainName]Context };
export type { [DomainName]State, [DomainName]Actions, [DomainName]ContextType };
```

### 2.2 Provider 구현

**파일 위치**: `src/contexts/[도메인명]Provider.tsx`

```typescript
"use client";

import { useState, useEffect, ReactNode } from 'react';
import { [DomainName]Context, [DomainName]State, [DomainName]Actions } from './[도메인명]Context';
import { 
  [actionName1]Action,
  [actionName2]Action,
  get[Entities]Action 
} from '@/server-actions/[도메인명]/';

interface [DomainName]ProviderProps {
  children: ReactNode;
}

export function [DomainName]Provider({ children }: [DomainName]ProviderProps) {
  const [state, setState] = useState<[DomainName]State>({
    [entities]: [],
    [currentEntity]: null,
    [entityView]: null,
    [summaryViews]: [],
    isLoading: true,
    is[Action]ing: false,
    isLoadingView: false,
    error: null,
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [entities] = await Promise.all([
        get[Entities]Action()
      ]);
      
      setState(prev => ({
        ...prev,
        [entities]: entities,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '데이터 로드에 실패했습니다',
        isLoading: false,
      }));
    }
  };

  const actions: [DomainName]Actions = {
    [commandName]: async ([params]) => {
      setState(prev => ({ ...prev, is[Action]ing: true, error: null }));
      
      try {
        // 1. 낙관적 업데이트 (필요한 경우)
        
        // 2. 서버 액션 호출
        const result = await [actionName]Action([params]);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // 3. 성공 시 상태 업데이트
        await actions.refresh[Entities]();
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '[액션] 실행에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, is[Action]ing: false }));
      }
    },

    refresh[Entities]: async () => {
      try {
        const [entities] = await get[Entities]Action();
        setState(prev => ({ ...prev, [entities]: entities }));
      } catch (error) {
        console.error('[엔티티] 목록 새로고침 실패:', error);
      }
    },

    refresh[EntityView]: async () => {
      try {
        setState(prev => ({ ...prev, isLoadingView: true }));
        const [entityView] = await get[EntityView]Action();
        setState(prev => ({ 
          ...prev, 
          [entityView]: entityView,
          isLoadingView: false 
        }));
      } catch (error) {
        setState(prev => ({ ...prev, isLoadingView: false }));
        console.error('[엔티티] View 새로고침 실패:', error);
      }
    },

    load[SummaryViews]: async () => {
      try {
        const [summaryViews] = await get[SummaryViews]Action();
        setState(prev => ({ ...prev, [summaryViews]: summaryViews }));
      } catch (error) {
        console.error('요약 View 로드 실패:', error);
      }
    },

    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
    },
  };

  return (
    <[DomainName]Context.Provider value={{ state, actions }}>
      {children}
    </[DomainName]Context.Provider>
  );
}
```

## ⚡ 3. Server Actions 구현

### 3.1 Server Actions 정의

**파일 위치**: `src/server-actions/[도메인명]/[액션명].action.ts`

```typescript
"use server";

import { Result } from '@/lib/result';
import { [CommandName] } from '@/domains/[도메인명]/commands/[command-name].command';
import { [DomainName]Service } from '@/domains/[도메인명]/services/[domain-name].service';
import { [DomainName]Repository } from '@/domains/[도메인명]/repositories/[domain-name].repository';
import { AuthService } from '@/lib/auth.service';
import { createDbClient } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import { [DomainName]Error } from '@/domains/[도메인명]/errors/[domain-name].errors';

export async function [actionName]Action(
  [inputParams]: [InputType]
): Promise<Result<[SuccessType], [DomainName]Error>> {
  try {
    // 1. Input 검증
    if (![validation]) {
      return Result.fail([DomainName]Error.INVALID_INPUT);
    }

    // 2. 의존성 주입 (DI Container 패턴)
    const [domainName]Service = new [DomainName]Service(
      new [DomainName]Repository(await createDbClient()),
      new AuthService()
    );

    // 3. Command 생성
    const command = new [CommandName]([commandParams]);

    // 4. 도메인 로직 실행
    const events = await [domainName]Service.[methodName](command);

    // 5. 크로스-도메인 이벤트 처리
    await processCrossDomainEvents(events);

    // 6. 관련 페이지 재검증
    revalidatePath('/[relevant-path]');
    
    // 7. 성공 응답
    return Result.ok({ success: true, data: [resultData] });

  } catch (error) {
    // 8. 에러 분류 및 처리
    if (error instanceof AuthenticationError) {
      return Result.fail([DomainName]Error.UNAUTHORIZED);
    }
    if (error instanceof AuthorizationError) {
      return Result.fail([DomainName]Error.FORBIDDEN);
    }
    if (error instanceof BusinessRuleError) {
      return Result.fail([DomainName]Error.BUSINESS_RULE_VIOLATION);
    }

    // 시스템 에러 로깅
    console.error('Unexpected error in [actionName]Action:', error);
    return Result.fail([DomainName]Error.INTERNAL_ERROR);
  }
}
```

### 3.2 에러 타입 정의

**파일 위치**: `src/domains/[도메인명]/errors/[domain-name].errors.ts`

```typescript
export class [DomainName]Error extends Error {
  constructor(
    message: string,
    public readonly code: [DomainName]ErrorCode,
    public readonly details?: any
  ) {
    super(message);
    this.name = '[DomainName]Error';
  }
}

export enum [DomainName]ErrorCode {
  // Input Validation
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_[FIELD] = 'INVALID_[FIELD]',
  
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Business Rules
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  [ENTITY]_NOT_FOUND = '[ENTITY]_NOT_FOUND',
  DUPLICATE_[ENTITY] = 'DUPLICATE_[ENTITY]',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// 특화된 에러 클래스들
export class AuthenticationError extends [DomainName]Error {
  constructor(message: string) {
    super(message, [DomainName]ErrorCode.UNAUTHORIZED);
  }
}

export class AuthorizationError extends [DomainName]Error {
  constructor(message: string) {
    super(message, [DomainName]ErrorCode.FORBIDDEN);
  }
}

export class BusinessRuleError extends [DomainName]Error {
  constructor(message: string, details?: any) {
    super(message, [DomainName]ErrorCode.BUSINESS_RULE_VIOLATION, details);
  }
}

export class ValidationError extends [DomainName]Error {
  constructor(message: string, field?: string) {
    super(message, [DomainName]ErrorCode.INVALID_INPUT, { field });
  }
}
```

## 🎣 4. Custom Hook 구현

### 4.1 메인 Hook 정의

**파일 위치**: `src/domains/[도메인명]/hooks/use-[domain-name].ts`

```typescript
"use client";

import { useContext } from 'react';
import { useOptimistic, useTransition } from 'react';
import { [DomainName]Context } from '@/contexts/[도메인명]Context';
import { [actionName]Action } from '@/server-actions/[도메인명]/[action-name].action';
import { [DomainName]Error } from '@/domains/[도메인명]/errors/[domain-name].errors';

export function use[DomainName]() {
  const context = useContext([DomainName]Context);
  
  if (!context) {
    throw new Error('use[DomainName] must be used within a [DomainName]Provider');
  }

  const [isPending, startTransition] = useTransition();
  const [optimisticEntities, setOptimisticEntities] = useOptimistic<[EntityName][]>(
    context.state.[entities]
  );

  const [actionName] = async ([params]: [ParamType]) => {
    // 1. 낙관적 업데이트할 엔티티 준비 (필요한 경우)
    const optimisticEntity: [EntityName] = {
      id: `temp-${Date.now()}`,
      [property]: [value],
      // ... 기타 속성들
    };

    // 2. 즉시 UI 업데이트
    setOptimisticEntities(prev => [...prev, optimisticEntity]);

    // 3. 실제 서버 액션 호출
    startTransition(async () => {
      try {
        const result = await [actionName]Action([params]);

        if (!result.success) {
          // 4. 실패 시 이전 상태로 롤백
          setOptimisticEntities(context.state.[entities]);
          
          // 에러 타입별 처리
          switch (result.error) {
            case [DomainName]Error.UNAUTHORIZED:
              throw new Error('로그인이 필요합니다');
            case [DomainName]Error.FORBIDDEN:
              throw new Error('권한이 없습니다');
            case [DomainName]Error.BUSINESS_RULE_VIOLATION:
              throw new Error('비즈니스 규칙 위반입니다');
            default:
              throw new Error('[액션] 실행에 실패했습니다');
          }
        }

        // 5. 성공 시 관련 데이터 새로고침
        await context.actions.refresh[Entities]();

      } catch (error) {
        // 6. 에러 시 이전 상태로 롤백
        setOptimisticEntities(context.state.[entities]);
        throw error;
      }
    });
  };

  return { 
    ...context.state,
    [entities]: optimisticEntities,
    [actionName], 
    isPending 
  };
}
```

### 4.2 특화된 Hook들

**파일 위치**: `src/domains/[도메인명]/hooks/use-[specific-feature].ts`

```typescript
// 현재 엔티티만 필요한 경우
export function useCurrent[EntityName]() {
  const { [currentEntity] } = use[DomainName]();
  return [currentEntity];
}

// 액션만 필요한 경우
export function use[DomainName]Actions() {
  const context = useContext([DomainName]Context);
  if (!context) {
    throw new Error('use[DomainName]Actions must be used within a [DomainName]Provider');
  }
  return context.actions;
}

// 특정 엔티티 목록만 필요한 경우
export function use[Entities]() {
  const { [entities] } = use[DomainName]();
  return [entities];
}
```

## 🧩 5. 컴포넌트 구현

### 5.1 주요 컴포넌트 구조

**파일 위치**: `src/components/[도메인명]/`

```typescript
// [EntityName]List.tsx - 목록 컴포넌트
"use client";

import { use[DomainName] } from '@/domains/[도메인명]/hooks/use-[domain-name]';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function [EntityName]List() {
  const { [entities], isLoading, error } = use[DomainName]();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        로딩 중...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">오류: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">[엔티티] 목록</h3>
      
      {[entities].length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          [엔티티]가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {[entities].map((entity) => (
            <div key={entity.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{entity.[displayField]}</div>
                  <div className="text-sm text-gray-500">{entity.[subField]}</div>
                </div>
                <Badge variant={entity.[statusField] ? 'default' : 'secondary'}>
                  {entity.[statusField] ? '활성' : '비활성'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  편집
                </Button>
                <Button variant="outline" size="sm">
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5.2 폼 컴포넌트

```typescript
// [EntityName]Form.tsx - 생성/편집 폼
"use client";

import { useState } from 'react';
import { use[DomainName] } from '@/domains/[도메인명]/hooks/use-[domain-name]';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface [EntityName]FormProps {
  [entity]?: [EntityName]; // 편집 모드인 경우
  onSuccess?: () => void;
}

export function [EntityName]Form({ [entity], onSuccess }: [EntityName]FormProps) {
  const { [actionName], is[Action]ing } = use[DomainName]();
  const [[field1], set[Field1]] = useState([entity]?.[field1] || '');
  const [[field2], set[Field2]] = useState([entity]?.[field2] || '');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (![field1].trim()) {
      toast.error('[필드1]을 입력해주세요');
      return;
    }

    try {
      await [actionName]([field1], [field2]);
      toast.success(`[엔티티]가 ${[entity] ? '수정' : '생성'}되었습니다`);
      
      // 폼 초기화 (생성 모드인 경우)
      if (![entity]) {
        set[Field1]('');
        set[Field2]('');
      }
      
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '[액션] 실행에 실패했습니다');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="[field1]">[필드1 라벨]</Label>
        <Input
          id="[field1]"
          type="text"
          value={[field1]}
          onChange={(e) => set[Field1](e.target.value)}
          placeholder="[필드1 플레이스홀더]"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="[field2]">[필드2 라벨]</Label>
        <Input
          id="[field2]"
          type="text"
          value={[field2]}
          onChange={(e) => set[Field2](e.target.value)}
          placeholder="[필드2 플레이스홀더]"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={is[Action]ing}
        className="w-full"
      >
        {is[Action]ing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {[entity] ? '수정' : '생성'} 중...
          </>
        ) : (
          [entity] ? '[엔티티] 수정' : '[엔티티] 생성'
        )}
      </Button>
    </form>
  );
}
```

### 5.3 선택기 컴포넌트

```typescript
// [EntityName]Selector.tsx - 선택 드롭다운
"use client";

import { use[DomainName] } from '@/domains/[도메인명]/hooks/use-[domain-name]';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface [EntityName]SelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function [EntityName]Selector({ value, onValueChange, placeholder }: [EntityName]SelectorProps) {
  const { [entities], isLoading } = use[DomainName]();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        로딩 중...
      </div>
    );
  }

  return (
    <Select value={value || ''} onValueChange={onValueChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder || "[엔티티] 선택"} />
      </SelectTrigger>
      <SelectContent>
        {[entities].map(entity => (
          <SelectItem key={entity.id} value={entity.id}>
            {entity.[displayField]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## 🔗 6. 앱 레벨 통합

### 6.1 Provider 설정

**파일 위치**: `src/app/layout.tsx`

```typescript
import { [DomainName]Provider } from '@/contexts/[도메인명]Provider';
// 다른 도메인 Provider들도 import

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 의존성 순서에 따라 Provider 중첩 배치 */}
        <AuthProvider>
          <[DomainName]Provider>
            <[OtherDomain]Provider>
              {children}
            </[OtherDomain]Provider>
          </[DomainName]Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 6.2 페이지에서 사용

**파일 위치**: `src/app/[page-name]/page.tsx`

```typescript
"use client";

import { use[DomainName] } from '@/domains/[도메인명]/hooks/use-[domain-name]';
import { [EntityName]List } from '@/components/[도메인명]/[EntityName]List';
import { [EntityName]Form } from '@/components/[도메인명]/[EntityName]Form';
import { [EntityName]Selector } from '@/components/[도메인명]/[EntityName]Selector';

export default function [PageName]Page() {
  const { isLoading, error } = use[DomainName]();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">[페이지 제목]</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">[섹션1 제목]</h2>
          <[EntityName]Selector onValueChange={(value) => console.log(value)} />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">[섹션2 제목]</h2>
          <[EntityName]Form />
        </div>
      </div>
      
      <div className="mt-8">
        <[EntityName]List />
      </div>
    </div>
  );
}
```

## 📊 7. 구현 완료 체크리스트

### 7.1 타입 정의 완료 확인
- [ ] Software Design의 모든 Aggregate 타입이 정확히 재현되었는가?
- [ ] 클라이언트 전용 타입이 별도 파일로 분리되었는가?
- [ ] Value Object들이 적절한 타입으로 정의되었는가?
- [ ] DB 스키마와 다른 부분이 주석으로 명시되었는가?

### 7.2 Context 구현 완료 확인
- [ ] 도메인별로 독립적인 Context가 생성되었는가?
- [ ] State와 Actions가 명확히 분리되었는가?
- [ ] 초기 데이터 로드 로직이 구현되었는가?
- [ ] 에러 상태 관리가 포함되었는가?

### 7.3 Server Actions 구현 완료 확인
- [ ] Technical Specification의 Result 패턴을 사용하는가?
- [ ] Command 객체를 활용하여 입력을 구조화했는가?
- [ ] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [ ] 에러 분류가 체계적으로 이루어지는가?
- [ ] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### 7.4 Hook 구현 완료 확인
- [ ] Context를 적절히 추상화한 Hook이 구현되었는가?
- [ ] 낙관적 업데이트 로직이 포함되었는가?
- [ ] Result 패턴 기반 에러 처리가 구현되었는가?
- [ ] 특화된 Hook들이 필요에 따라 제공되는가?

### 7.5 컴포넌트 구현 완료 확인
- [ ] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [ ] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [ ] 사용자 친화적인 피드백이 제공되는가?
- [ ] 목록, 폼, 선택기 등 주요 컴포넌트가 구현되었는가?

### 7.6 앱 통합 완료 확인
- [ ] Provider가 적절한 순서로 중첩 배치되었는가?
- [ ] 페이지별로 필요한 Hook만 선택적으로 사용하는가?
- [ ] 권한에 따른 조건부 렌더링이 적용되었는가?

## 📚 8. 관련 문서 및 참조

### 8.1 필수 선행 문서
- **Software Design 문서**: `../domains/[도메인명]/software-design.md`
  - Aggregate, Command, Event 정의 확인
  - 비즈니스 규칙 및 정책 참조
  - Read Models 및 Context Map 확인

- **Technical Specification 템플릿**: `../template/4-technical-specification-template.md`
  - Result 패턴 구현 방법
  - Service Layer 패턴 참조
  - 에러 처리 및 의존성 주입 패턴

### 8.2 기술 스택 참조
- **Next.js 14**: App Router, Server Actions, revalidatePath
- **React 18**: Context API, useOptimistic, useTransition, useState, useEffect
- **TypeScript**: 인터페이스, 타입 정의, 제네릭
- **UI 라이브러리**: shadcn/ui 컴포넌트 (Button, Input, Select, Badge 등)
- **상태 관리**: React Context + Custom Hooks 패턴

### 8.3 폴더 구조 요약
```
src/
├── domains/[도메인명]/
│   ├── types.ts                    # 기본 도메인 타입
│   ├── client-types.ts             # 클라이언트 확장 타입
│   ├── hooks/
│   │   ├── use-[domain-name].ts    # 메인 Hook
│   │   └── use-[feature].ts        # 특화 Hook들
│   └── errors/
│       └── [domain-name].errors.ts # 에러 타입 정의
├── contexts/
│   ├── [도메인명]Context.tsx       # Context 타입 정의
│   └── [도메인명]Provider.tsx      # Provider 구현
├── server-actions/[도메인명]/
│   └── [action-name].action.ts     # Server Actions
├── components/[도메인명]/
│   ├── [Entity]List.tsx            # 목록 컴포넌트
│   ├── [Entity]Form.tsx            # 폼 컴포넌트
│   └── [Entity]Selector.tsx        # 선택기 컴포넌트
└── app/
    ├── layout.tsx                  # Provider 설정
    └── [page]/page.tsx             # 페이지에서 Hook 사용
```

### 8.4 개발 순서 권장사항
1. **Software Design 완료 확인** → Aggregate, Command, Event 정의 완료
2. **타입 정의** → `types.ts`, `client-types.ts` 작성
3. **Context 구현** → Context 타입 정의 → Provider 구현
4. **Server Actions** → Result 패턴 + Service Layer 연동
5. **Hook 구현** → Context 연결 + 낙관적 업데이트
6. **컴포넌트** → Hook 사용 + UI 구현
7. **앱 통합** → Provider 설정 + 페이지 연결
8. **테스트** → 각 레이어별 단위 테스트 및 통합 테스트

이 Frontend Specification은 **[Domain Name] 도메인**의 완전한 프론트엔드 구현 명세서입니다.
