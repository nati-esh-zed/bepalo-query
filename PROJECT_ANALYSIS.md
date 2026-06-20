# Bepalo Query - Project Analysis

## 📋 Project Overview

**@bepalo/query** is a type-safe, access-control-driven unified RESTful database query engine for backend applications using Drizzle ORM.

### Key Concept
Instead of manually building CRUD endpoints with validation, authorization, role checks, pagination, filtering, relation loading, and result formatting, Bepalo Query auto-generates secure database-backed REST resources from:
1. **Drizzle ORM Schema** - Define your database structure
2. **ACL Definitions** - Define access control rules once
3. **Query API** - Let the framework generate the REST endpoints

### Version
**v2.3.12** - Published as npm package `@bepalo/query`

---

## 🏗️ Project Structure

```
bepalo-query/
├── src/
│   ├── index.ts          # Main entry point (exports from query.ts)
│   ├── query.ts          # Core query engine (HTTP routing, ACL, types)
│   ├── client.ts         # Client builder for type-safe queries
│   └── quwry.ts          # Internal utilities (if exists)
├── tests/
│   ├── create-query-route.test.ts    # Query route setup tests
│   ├── http-error.test.ts             # HTTP error handling tests
│   ├── query-validation.test.ts       # Query validation tests
│   └── rjson.test.ts                  # RJSON serialization tests
├── dist/
│   ├── cjs/              # CommonJS build output
│   └── (ESM files)       # ES Module build output
├── drizzle/              # Drizzle migration files (generated)
├── package.json          # Dependencies: arktype, @bepalo/rjson, drizzle-orm
├── tsconfig.json         # TypeScript config (ES2019, Node modules)
├── vitest.config.ts      # Test runner config
└── README.md             # Comprehensive documentation

```

---

## 🔑 Core Technologies

| Dependency | Purpose | Version |
|-----------|---------|---------|
| **drizzle-orm** | SQL query builder & ORM | ^0.45.2 |
| **arktype** | Runtime type validation | ^2.2.0 |
| **@bepalo/rjson** | JSON serialization (RJSON format) | ^2.1.11 |
| **TypeScript** | Language & tooling | ^5.9.3 |
| **Vitest** | Test framework | ^3.2.6 |

### Build System
- **ESM Build**: `tsconfig.esm.json` → TypeScript compiled to `dist/*.js`
- **CJS Build**: `tsconfig.cjs.json` → TypeScript compiled to `dist/cjs/*.js`
- **Commands**: `pnpm run build`, `pnpm run build:watch`

### Exports
```
"." → Main: dist/index.js (ESM), dist/cjs/index.js (CJS)
"./client" → dist/client.js (ESM), dist/cjs/client.js (CJS)
"./src" → Direct source import (TypeScript)
"./src/*" → Direct source import (wildcard)
```

---

## 🎯 Core Features

### 1. **Access Control (ACL)**
- Role-based access control (RBAC)
- Column-level security (select specific columns per role)
- Row-level security (RLS) - filter rows based on user/session
- Control structure defines what each role can do

### 2. **HTTP Methods Supported**
- `GET` - Fetch resources (supports filtering, pagination, sorting, relations)
- `POST` - Create resources (with body validation & injection)
- `PATCH` - Update resources (partial updates)
- `DELETE` - Remove resources
- `HEAD` & `OPTIONS` - Standard HTTP methods

### 3. **Query Language Features**
- **Pagination** - `limit`, `offset`
- **Column Selection** - Choose which fields to return
- **Filtering** - Single & multiple filter conditions
- **Sorting** - Order by columns ascending/descending
- **Relations** - Join nested related tables
- **Validation** - Request body validation using arktype schemas
- **Injection** - Transform request body (e.g., auto-inject userId)

### 4. **Advanced Features**
- Computed SQL fields
- Transaction support
- Query depth limits
- Query size limits
- Query hooks (before, after, on-error)
- Result formatting/transformation
- Request body injection and transformation
- Restricted queries (disable specific operations)

---

## 📚 Key Types & Concepts

### **ACL Structure**
```typescript
export type ACL<XContext = {}> = {
  [resourceId: string]: {
    table: string                    // Drizzle table name
    maxDepth?: number                // Max relation nesting depth
    maxLimit?: number                // Max pagination limit
    countTotal?: boolean              // Include total count in response
    findFirst?: boolean              // Get single record instead of list
    formatResult?: (req, data) => Response  // Custom result formatting
    control: {
      GET?: { [role: string]: ControlRule }
      POST?: { [role: string]: ControlRule }
      PATCH?: { [role: string]: ControlRule }
      DELETE?: { [role: string]: ControlRule }
    }
  }
}
```

### **Control Rule (Per HTTP Method)**
```typescript
{
  select: boolean | { mode: boolean, columns: Set<string> }  // Column selection
  with?: RelationControl                  // Include relations
  where?: (ctx, table, helpers) => SQL    // Row-level security filter
  validateBody?: (body) => void           // Request validation
  injectBody?: (body, ctx) => object      // Modify request body
  forbidQuery?: { with, offset, limit, orderBy, where, columns } // Restrictions
}
```

### **Status Codes**
Comprehensive enum of HTTP status codes from 100-599 range, including:
- Standard: 200, 201, 204, 400, 401, 403, 404, 500, etc.
- Extended: 418 (IMATeapot), 498 (InvalidToken), 529 (SiteOverloaded), etc.

---

## 🔄 Request/Response Flow

### **Request**
```
POST /query/<resourceId>
Content-Type: application/json

{
  "select": ["id", "name", "email"],
  "where": { "role": "admin" },
  "orderBy": "createdAt:desc",
  "limit": 10,
  "offset": 0,
  "with": { "posts": true }
}
```

### **Response**
```json
{
  "total": 42,
  "count": 10,
  "resourceId": [
    { "id": "123", "name": "John", "email": "john@example.com", ... },
    ...
  ]
}
```

---

## 🧪 Testing

### Test Files Overview
1. **create-query-route.test.ts** - Tests route creation, HTTP method handling
2. **http-error.test.ts** - Tests error responses and status codes
3. **query-validation.test.ts** - Tests query parsing, validation, ACL enforcement
4. **rjson.test.ts** - Tests RJSON serialization format

### Test Commands
```bash
pnpm test               # Run all tests with dot reporter
pnpm test:ci           # Generate markdown test report
```

---

## 🚀 Workflow After Setup

1. **Add/Update Database Schema** → Define tables in Drizzle
2. **Add/Update ACL** → Define access rules in ACL config
3. **Query Resource** → Call REST endpoint with query

---

## 📦 Package Distribution

### Files Included in NPM
- `dist/` - Compiled JavaScript
- `src/` - Original TypeScript source
- `LICENSE` - MIT License
- `README.md` - Full documentation

### Entry Points
- **Node CommonJS**: `package.json:main` → `dist/cjs/index.js`
- **Node ESM**: `package.json:module` → `dist/index.js`
- **TypeScript**: `package.json:types` → `dist/index.d.ts`

---

## 🔗 Related Packages

- **@bepalo/router** - HTTP routing utilities (imported in examples)
- **@bepalo/rjson** - Rich JSON serialization format
- **better-auth** - Authentication library (example integration)
- **drizzle-kit** - Drizzle CLI for migrations

---

## 💡 Key Design Principles

1. **Type-Safe** - Full TypeScript support with inferred types
2. **Access-Control First** - Security defined upfront in ACL
3. **Zero Boilerplate** - Auto-generate endpoints from schema + ACL
4. **Performance** - No runtime reflection, built on Drizzle ORM
5. **Flexible** - Hooks, custom formatting, injection middleware
6. **Role-Based** - Different rules per user role/status

---

## 🎓 Common Usage Patterns

### Example Resource Definition
```typescript
export type ACL = IACL<UserRoles, CTXUserSession, {}, Schema, Database>;

const acl: ACL = {
  posts: {
    table: "post",
    maxDepth: 1,
    maxLimit: 10,
    countTotal: true,
    control: {
      GET: {
        mine: {
          select: true,
          where: ({ session }, post, { eq }) => eq(post.userId, session.userId),
          with: {
            user: { select: true }
          }
        }
      },
      POST: {
        mine: {
          validateBody: (b) => postSchema.assert(b),
          injectBody: (b, { session: { userId } }) => ({ ...b, userId }),
          where: ({ session }, post, { eq }) => eq(post.userId, session.userId)
        }
      }
    }
  }
};
```

---

## 📝 Documentation Quality

The README is **comprehensive** including:
- Feature matrix with 20+ features
- Performance benchmarking details
- Complete quick-start guide
- Schema and ACL setup examples
- Query language documentation
- HTTP method specifications
- Client builder guidance
- Production recommendations

---

## 🎯 Ready for Tasks

This analysis covers:
- ✅ Project purpose and architecture
- ✅ Technology stack and dependencies
- ✅ Core types and interfaces
- ✅ Build system and distribution
- ✅ Testing setup
- ✅ Common patterns and workflows

**Ready to assist with:**
- Feature implementation or enhancements
- Bug fixes or debugging
- Documentation improvements
- Test additions or refactoring
- Build/release tasks
- Performance optimizations
