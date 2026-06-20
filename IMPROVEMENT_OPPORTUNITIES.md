# Improvement Opportunities for @bepalo/query

## Executive Summary

The `@bepalo/query` project is well-architected with excellent type safety and feature completeness. However, there are **significant opportunities for enhancement**, particularly in the **client.ts** file and some areas of **query.ts**. These improvements would increase developer experience, reduce boilerplate, add missing functionality, and improve maintainability.

---

## 1. CLIENT.TS IMPROVEMENTS (HIGH PRIORITY)

### 1.1 **Method Overloading & Fluent API**

**Current Issue:**
- Each HTTP method (Get, Post, Patch, Delete) returns `Map<string, string>` for params
- Developers must manually construct URLs and handle params assembly
- No fluent/chainable API
- Repetitive boilerplate for common operations

**Proposed Improvements:**

```typescript
// CURRENT (verbose)
const params = queryClient.queryBuilder.Get({ where: {...} });
const url = `/query/posts?${new URLSearchParams(params)}`;
const result = await queryClient.Get(url, { where: {...} });

// PROPOSED (fluent)
const result = await queryClient
  .table('posts')
  .where({ userId: 123 })
  .select(['id', 'title', 'content'])
  .limit(10)
  .get();

// PROPOSED (with method variants)
const one = await queryClient.table('posts').findUnique({ id: 1 });
const many = await queryClient.table('posts').findMany({ where: {...} });
const first = await queryClient.table('posts').findFirst({ where: {...} });
```

**Benefits:**
- Reduces boilerplate significantly
- More intuitive DX (similar to Prisma/Drizzle)
- Easier to maintain parameter building
- Better IDE autocomplete
- Natural method chaining

**Implementation:**
- Create a `QueryFilter` or `QueryChain` class
- Implement builder pattern with method chaining
- Auto-handle URL construction
- Keep backward compatibility with current API

---

### 1.2 **Automatic URL Construction**

**Current Issue:**
- Developers must manually construct URLs like `/query/posts?...`
- URL path construction is error-prone
- No type safety for resource names

**Proposed Improvements:**

```typescript
// CURRENT (manual & error-prone)
const result = await queryClient.Get('/query/posts#?...');

// PROPOSED (type-safe)
const result = await queryClient.get('posts', { where: {...} });
const result = await queryClient.get('users', { where: {...} });

// Or using a resource registry
type MyResources = {
  posts: typeof postsTable;
  users: typeof usersTable;
};

const client = createQueryClient<MySchema, MyDatabase>({
  baseUrl: 'http://localhost:4000',
  resourcePath: '/query'  // auto-constructs URLs
});

const result = await client.posts.get({ where: {...} });
const result = await client.users.patch(1, { name: 'John' });
```

**Benefits:**
- Type-safe resource access
- Eliminates manual URL construction
- Automatic resource discovery
- IDE autocomplete for resources
- Less error-prone

---

### 1.3 **Response Type Safety Enhancements**

**Current Issue:**
- Response types require manual type inference
- No validation of response structure at runtime
- Response types could be more precise
- Lack of metadata in responses (pagination info, etc.)

**Proposed Improvements:**

```typescript
// CURRENT (basic typing)
type Result = InferResponseType<'posts', Schema, 'post'>;
const result = await queryClient.Get('/query/posts?...');

// PROPOSED (enhanced)
type Result = Awaited<ReturnType<typeof client.posts.get>>;

// With validation
const schema = z.object({
  posts: z.array(postSchema),
  total: z.number().optional(),
  count: z.number().optional(),
});

const result = await queryClient.posts.get({ where: {...} });
// result is guaranteed to match schema

// With pagination helpers
const paginated = await queryClient.posts.paginate({
  page: 1,
  pageSize: 10,
  where: {...}
});
// Returns: { data: [...], pagination: { page, pageSize, total, pages } }
```

**Benefits:**
- Better type inference
- Runtime validation option
- Pagination helpers built-in
- More predictable responses
- Easier debugging

---

### 1.4 **Request Interceptors & Middleware**

**Current Issue:**
- No way to intercept/modify requests (e.g., for auth headers, logging)
- No middleware support
- Every request goes through the same `_fetch` method
- Hard to add custom logic per-request

**Proposed Improvements:**

```typescript
// PROPOSED
const client = createQueryClient(baseUrl, {
  interceptors: {
    request: async (url, init) => {
      // Add auth token
      const token = getAuthToken();
      return {
        ...init,
        headers: {
          ...init?.headers,
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': crypto.randomUUID(),
        }
      };
    },
    response: async (response) => {
      if (!response.ok && response.status === 401) {
        // Handle token refresh
        await refreshToken();
        // Retry request
      }
      return response;
    },
    error: async (error) => {
      console.error('Query error:', error);
      // Could implement retry logic here
      throw error;
    }
  },
  middleware: [
    loggerMiddleware,
    retryMiddleware({ maxRetries: 3 }),
    cacheMiddleware({ ttl: 5 * 60 * 1000 }),
  ]
});
```

**Benefits:**
- Centralized request/response handling
- Authentication integration
- Error handling & retry logic
- Request/response logging
- Caching support
- Request correlation IDs

---

### 1.5 **Batch Operations**

**Current Issue:**
- No built-in batch query support
- Developers must make multiple requests
- No transaction support in client
- Inefficient for bulk operations

**Proposed Improvements:**

```typescript
// PROPOSED: Batch queries
const results = await queryClient.batch([
  queryClient.posts.get({ where: { userId: 1 } }),
  queryClient.users.get({ where: { id: 1 } }),
  queryClient.posts.post({ title: 'New', content: '...' }),
]);
// Results are in same order, single request

// PROPOSED: Bulk operations
const created = await queryClient.posts.bulkCreate([
  { title: 'Post 1', content: '...' },
  { title: 'Post 2', content: '...' },
  { title: 'Post 3', content: '...' },
]);

const updated = await queryClient.posts.bulkUpdate(
  [1, 2, 3],
  { status: 'published' }
);

const deleted = await queryClient.posts.bulkDelete([1, 2, 3]);
```

**Benefits:**
- Single network request for multiple operations
- Better performance
- Reduced latency
- Transaction-like semantics
- Cleaner code

---

### 1.6 **Caching Layer**

**Current Issue:**
- No client-side caching
- Repeated queries fetch fresh data every time
- No cache invalidation strategy
- Memory inefficiency for repeated queries

**Proposed Improvements:**

```typescript
// PROPOSED: Built-in caching
const client = createQueryClient(baseUrl, {
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000,  // 5 minutes
    strategy: 'memory', // or 'local-storage'
    invalidateOn: 'mutation', // auto-invalidate related caches
  }
});

// Uses cache (if fresh)
const posts1 = await queryClient.posts.get({ where: {...} });

// Uses cache (same query)
const posts2 = await queryClient.posts.get({ where: {...} });

// Manual cache control
const posts3 = await queryClient.posts.get(
  { where: {...} },
  { cache: false }  // Bypass cache
);

// Cache invalidation
queryClient.cache.invalidate('posts');
queryClient.cache.invalidate('posts:userId:123');
```

**Benefits:**
- Reduced network requests
- Faster repeated queries
- Better UX with instant responses
- Smart invalidation
- Configurable strategies

---

### 1.7 **TypeScript Type Builders**

**Current Issue:**
- `BepaloQueryBuilder` only returns `Map<string, string>`
- Type inference for query options is complex
- Developers need to manually construct complex nested types
- No intellisense for nested `with` clauses

**Proposed Improvements:**

```typescript
// CURRENT (manual, error-prone)
const params = queryClient.queryBuilder.Get({
  where: { userId: 123 },
  with: {
    posts: {
      select: { id: true, title: true },
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    }
  }
});

// PROPOSED (builder pattern with validation)
const result = await queryClient.posts
  .select('id', 'title', 'content')
  .where(and(
    eq(schema.posts.userId, 123),
    gt(schema.posts.createdAt, new Date('2024-01-01'))
  ))
  .with('author', (author) =>
    author
      .select('id', 'name', 'email')
      .where(eq(schema.users.role, 'admin'))
  )
  .orderBy(desc(schema.posts.createdAt))
  .limit(10)
  .get();

// Type-safe: TS ensures selected columns exist, with-relations are valid, etc.
```

**Benefits:**
- Type-safe query building
- Better IDE support
- Easier to compose queries
- Validation at build time
- Cleaner syntax

---

## 2. QUERY.TS IMPROVEMENTS (MEDIUM PRIORITY)

### 2.1 **Error Handling & Messages**

**Current Issue:**
- Some error messages are generic
- No error codes for programmatic handling
- Inconsistent error response format
- Hard to distinguish between error types

**Proposed Improvements:**

```typescript
// PROPOSED: Structured error responses
export enum QueryErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  ACL_VIOLATION = 'ACL_VIOLATION',
  INVALID_QUERY = 'INVALID_QUERY',
}

// PROPOSED: Enhanced HttpError class
export class QueryError extends HttpError {
  code: QueryErrorCode;
  details?: Record<string, any>;
  
  constructor(
    message: string,
    code: QueryErrorCode,
    status: number,
    details?: Record<string, any>
  ) {
    super(message, status);
    this.code = code;
    this.details = details;
  }
  
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      status: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

// Usage in error responses
throw new QueryError(
  'Column access denied',
  QueryErrorCode.ACL_VIOLATION,
  Status._403_Forbidden,
  { column: 'password', reason: 'sensitive_data' }
);

// Response format:
// {
//   error: "Column access denied",
//   code: "ACL_VIOLATION",
//   status: 403,
//   details: { column: "password", reason: "sensitive_data" },
//   timestamp: "2024-01-15T10:30:00Z"
// }
```

**Benefits:**
- Programmatic error handling
- Better debugging
- Consistent error format
- Client-side error categorization
- Audit trail with timestamps

---

### 2.2 **Query Validation & Sanitization**

**Current Issue:**
- RJSON query validation is tied to arktype scope
- No schema validation for incoming queries
- Limited input sanitization
- Potential for abuse with deeply nested queries

**Proposed Improvements:**

```typescript
// PROPOSED: Query validation layer
export interface QueryValidationOptions {
  maxDepth?: number;      // Prevent excessive nesting
  maxLimit?: number;      // Cap pagination limit
  maxOffset?: number;     // Prevent offset abuse
  maxColumns?: number;    // Limit selected columns
  allowedOperators?: string[];  // Restrict which operators can be used
  sanitize?: boolean;     // Auto-sanitize string values
}

// PROPOSED: Validation middleware
export function createQueryValidator(options: QueryValidationOptions) {
  return (query: any) => {
    if (query.limit && query.limit > (options.maxLimit || 1000)) {
      throw new QueryError(
        `Limit exceeds maximum of ${options.maxLimit}`,
        QueryErrorCode.INVALID_QUERY,
        Status._400_BadRequest
      );
    }
    // ... more validation
    return query;
  };
}
```

**Benefits:**
- Prevent DOS/abuse attacks
- Consistent validation rules
- Performance protection
- Better input handling
- Security improvements

---

### 2.3 **Hooks & Lifecycle Events**

**Current Issue:**
- ACL has `beforeQuery`, `afterQuery`, `onQueryError` but inconsistently applied
- No global hooks
- Hard to add cross-cutting concerns
- Limited extensibility

**Proposed Improvements:**

```typescript
// PROPOSED: Global lifecycle hooks
export type QueryLifecycleHooks = {
  onBeforeQuery?: (ctx: { table: string; method: string; query: any }) => void | Promise<void>;
  onAfterQuery?: (ctx: { table: string; method: string; result: any; duration: number }) => void | Promise<void>;
  onQueryError?: (ctx: { table: string; method: string; error: Error }) => void | Promise<void>;
  onValidationError?: (ctx: { table: string; errors: ArkErrors }) => void | Promise<void>;
  onACLDenied?: (ctx: { table: string; method: string; reason: string }) => void | Promise<void>;
};

// Usage
createQueryRoute({
  acl: {...},
  hooks: {
    onBeforeQuery: async ({ table, method }) => {
      console.log(`[${table}] ${method} starting...`);
      startSpan(`query.${table}.${method}`);
    },
    onAfterQuery: async ({ table, method, duration }) => {
      console.log(`[${table}] ${method} completed in ${duration}ms`);
      recordMetric('query_duration', duration, { table, method });
    },
    onQueryError: async ({ table, error }) => {
      console.error(`[${table}] Error:`, error);
      captureException(error);
    }
  }
});
```

**Benefits:**
- Observability/monitoring
- Centralized cross-cutting concerns
- Easier debugging
- Metrics collection
- Audit logging

---

### 2.4 **Documentation & Self-Describing API**

**Current Issue:**
- Large monolithic query.ts file (2,442 lines)
- Limited JSDoc documentation
- Type signatures are complex and hard to understand
- No schema introspection API

**Proposed Improvements:**

```typescript
// PROPOSED: Schema introspection
export interface SchemaIntrospection {
  tables: {
    [key: string]: {
      name: string;
      columns: {
        [key: string]: {
          type: string;
          nullable: boolean;
          primaryKey: boolean;
          foreignKey?: string;
        };
      };
      relations: {
        [key: string]: {
          targetTable: string;
          type: 'one' | 'many';
        };
      };
    };
  };
}

// Endpoint: OPTIONS /query/:resource - returns schema
// Usage in client
const schema = await queryClient.introspect();
const postColumns = schema.tables.posts.columns;
// Use for dynamic form generation, validation, UI hints, etc.
```

**Proposed file split:**
- `query-types.ts` - All type definitions
- `query-errors.ts` - Error classes and codes
- `query-validation.ts` - Input validation
- `query-acl.ts` - ACL/authorization logic
- `query-handlers.ts` - HTTP handlers (GET, POST, etc.)
- `query-core.ts` - Main entry points

**Benefits:**
- Better code organization
- Easier to maintain
- Clearer separation of concerns
- Discoverable API surface
- Dynamic schema for introspection

---

## 3. BUILD & TOOLING IMPROVEMENTS

### 3.1 **Package Exports**

**Proposed Improvements:**

```typescript
// package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./client": {
      "types": "./dist/client.d.ts",
      "import": "./dist/client.mjs",
      "require": "./dist/client.cjs"
    },
    "./server": {
      "types": "./dist/query.d.ts",
      "import": "./dist/query.mjs",
      "require": "./dist/query.cjs"
    }
  }
}

// Usage
import { createQueryClient } from '@bepalo/query/client';
import { createQueryRoute } from '@bepalo/query/server';
```

**Benefits:**
- Better tree-shaking
- Smaller bundle sizes
- Clear API boundaries
- Easier integration

---

## 4. TESTING IMPROVEMENTS

### 4.1 **Test Utilities**

**Proposed:** Create testing utilities for easier test writing:

```typescript
// Proposed: query-testing.ts
export function createMockContext<T>(overrides?: Partial<T>): T { ... }
export function createMockACL<T>(options: ACLOptions): T { ... }
export function createTestQueryRoute(config: TestConfig): {...} { ... }
```

---

## 5. PERFORMANCE IMPROVEMENTS

### 5.1 **Query Optimization**

- **Lazy evaluation** for complex queries
- **Query result caching** at handler level
- **Connection pooling** recommendations for database
- **Batch query aggregation** to reduce N+1 queries

### 5.2 **Memory Optimization**

- **Stream large result sets** instead of loading all into memory
- **Pagination by default** for large tables
- **Lazy column loading** for wide tables

---

## Implementation Priority

**Phase 1 (High Value, Medium Effort):**
1. Fluent API for query building in client
2. Structured error responses with codes
3. Request interceptors & middleware

**Phase 2 (Medium Value, Low Effort):**
1. Automatic URL construction
2. Batch operations
3. Better error messages

**Phase 3 (Nice-to-Have, Higher Effort):**
1. Client-side caching
2. File split and organization
3. Schema introspection

---

## Backward Compatibility

All improvements should maintain backward compatibility with the current API or provide a clear migration path.

---

## Summary

The most impactful improvements would be:

1. **Client fluent API** - Dramatically improves DX
2. **Structured errors** - Makes integration easier
3. **Request interceptors** - Enables auth, logging, retry
4. **Batch operations** - Improves performance
5. **File organization** - Improves maintainability

These would transform `@bepalo/query` from an excellent technical implementation into an truly ergonomic and user-friendly API framework.
