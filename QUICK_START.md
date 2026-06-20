# Bepalo Query - Quick Reference

## 🎯 What Is This Project?

A TypeScript library that auto-generates type-safe REST API endpoints from:
1. **Drizzle ORM Schema** (database structure)
2. **ACL Configuration** (access control rules)

This eliminates boilerplate for CRUD operations, validation, auth, pagination, etc.

---

## 📁 Key Files at a Glance

| File | Lines | Purpose |
|------|-------|---------|
| `src/query.ts` | 2,442 | Core engine: routing, validation, query execution |
| `src/client.ts` | ~100 | Client type builder for frontend queries |
| `src/index.ts` | 1 | Export from query.ts |
| `tests/` | ~21KB | 4 test files (routes, errors, validation, RJSON) |

---

## 🛠️ Build & Test Commands

```bash
# Development
pnpm install
pnpm run build:watch      # Watch both ESM and CJS builds

# Production
pnpm run build            # Build both ESM and CJS

# Testing
pnpm test                 # Run all tests
pnpm test:ci             # Generate markdown report

# Publishing
pnpm publish             # Build + publish to npm
```

---

## 📦 What Gets Built

```
dist/
├── index.js             # ESM: Main export
├── index.d.ts           # Types for main
├── client.js            # ESM: Client builder
├── client.d.ts          # Types for client
├── query.js             # ESM: Query implementation
└── cjs/                 # CommonJS versions
    ├── index.js
    ├── client.js
    └── query.js
```

---

## 🏗️ Project Architecture

### Input: Schema + ACL
```typescript
// Drizzle schema
const user = sqliteTable("user", { id: text().primaryKey(), ... });

// ACL definition
export type ACL = IACL<UserRoles, CTXUserSession, {}, Schema, Database>;
const acl: ACL = {
  users: {
    table: "user",
    control: {
      GET: {
        admin: { select: true, where: isAdmin }
      }
    }
  }
};
```

### Output: Auto-Generated Endpoints
```
GET  /query/users         → List users (filtered by role)
POST /query/users         → Create user
PATCH /query/users/:id    → Update user
DELETE /query/users/:id   → Delete user
```

---

## 🔐 ACL Structure (Core Concept)

```typescript
{
  resourceId: "users",           // Endpoint name
  table: "user",                 // Drizzle table
  maxDepth: 1,                   // Max relation nesting
  maxLimit: 100,                 // Max pagination limit
  countTotal: true,              // Include total count
  
  control: {
    GET: {
      admin: {                   // Role
        select: true,            // Allow all columns (or specify Set)
        where: (ctx, table, ops) => ops.eq(table.role, "admin"),  // RLS filter
        with: {                  // Include relations
          posts: { select: true }
        }
      },
      mine: {
        select: { mode: false, columns: new Set(["id", "email"]) },
        where: (ctx, t, o) => o.eq(t.id, ctx.session.userId)
      }
    },
    POST: {
      mine: {
        validateBody: (b) => userSchema.assert(b),   // Validate input
        injectBody: (b, ctx) => ({ ...b, userId: ctx.session.userId }), // Auto-fill fields
        where: (ctx, t, o) => o.eq(t.id, ctx.session.userId)
      }
    },
    PATCH: { ... },
    DELETE: { ... }
  }
}
```

---

## 🔑 Key Exports from query.ts

### Enums & Classes
- `Status` - HTTP status codes (100-599)
- `HttpError` - Error class with status code

### Types
- `Table` - Base Drizzle table type
- `RequestHandler<Context>` - Function signature
- `ACL<Role, Context, XContext, Schema, Database>` - Access control definition
- `InferResponseType<resourceId, Schema, tableId>` - Response type inference
- `ColumnSetting<T>` - Column selection config

### Functions
- `status(code, content?, init?)` - Create status response
- `json(payload, init?)` - Create JSON response
- `createQueryRoute(config)` - Main: creates route handlers

---

## 📊 Query Language Support

### GET Request Query Parameters
```
?select=id,name,email
&where={"role":"admin"}
&orderBy={"createdAt":"desc"}
&limit=10
&offset=0
&with={"posts":true}
```

### POST/PATCH Request Body
```json
{
  "title": "New Post",
  "body": "Content here"
}
```

---

## 🧪 Test Coverage

| Test File | Focus |
|-----------|-------|
| `create-query-route.test.ts` | Route setup, HTTP method handling |
| `http-error.test.ts` | Error responses, status codes |
| `query-validation.test.ts` | Query parsing, validation, ACL rules |
| `rjson.test.ts` | RJSON serialization format |

---

## 🔗 Dependencies

| Package | Version | Use |
|---------|---------|-----|
| arktype | ^2.2.0 | Runtime type validation |
| drizzle-orm | ^0.45.2 | Query builder & ORM |
| @bepalo/rjson | ^2.1.11 | JSON serialization |

---

## 🚀 Common Development Tasks

### Add a New Feature
1. Add types to `src/query.ts` (in `_ACLWith`, `_ACLDelete`, etc.)
2. Implement logic in route handlers (GET, POST, PATCH, DELETE)
3. Add tests in `tests/` folder
4. Build: `pnpm run build`

### Fix a Bug
1. Locate issue in `src/query.ts` (query execution, validation, ACL)
2. Write a failing test in appropriate test file
3. Fix the implementation
4. Verify test passes: `pnpm test`

### Add Test Coverage
1. Add test to appropriate file in `tests/`
2. Run: `pnpm test`
3. Generate report: `pnpm test:ci`

---

## 📋 Resource Definition Example

```typescript
const acl: ACL = {
  "posts": {
    table: "post",
    maxDepth: 1,
    maxLimit: 10,
    countTotal: true,
    
    control: {
      GET: {
        "mine": {
          select: true,
          where: ({ session }, post, { eq }) => eq(post.userId, session.userId),
          with: {
            user: {
              select: { mode: false, columns: new Set(["name", "email"]) }
            }
          }
        },
        "admin": {
          select: true,
          where: ({ user }, post, { gte }) => gte(user.role, "admin")
        }
      },
      
      POST: {
        "mine": {
          validateBody: (b) => createInsertSchema(tables.post).assert(b),
          injectBody: (b, { session }) => ({ ...b, userId: session.userId }),
          where: ({ session }, post, { eq }) => eq(post.userId, session.userId)
        }
      },
      
      PATCH: {
        "mine": {
          select: true,
          validateBody: (b) => createUpdateSchema(tables.post).assert(b),
          where: ({ session }, post, { eq }) => eq(post.userId, session.userId)
        }
      },
      
      DELETE: {
        "mine": {
          select: true,
          where: ({ session }, post, { eq }) => eq(post.userId, session.userId)
        }
      }
    }
  }
};
```

---

## 🎓 Understanding the Flow

```
1. Request arrives at /query/posts?select=id,title&limit=10

2. createQueryRoute handler intercepts:
   - Extracts resourceId: "posts"
   - Parses query params
   - Authenticates user via session parser

3. Validates ACL:
   - Check if user role has access to POST resource
   - Check if GET method is allowed
   - Extract the correct control rule

4. Executes query:
   - Build Drizzle query from selector config
   - Apply column selection, where filter, sorting
   - Load relations if requested
   - Handle pagination

5. Returns response:
   - Format result via formatResult function
   - Include total count if countTotal: true
   - Return JSON with status 200/201/204 or error
```

---

## 🔍 What Each HTTP Method Does

| Method | Purpose | Needs |
|--------|---------|-------|
| **GET** | Fetch records | select, where, orderBy, limit, offset, with |
| **POST** | Create record | validateBody, injectBody, where (RLS on write) |
| **PATCH** | Update record | select, validateBody, where (RLS on update) |
| **DELETE** | Remove records | select, where (RLS on delete) |
| **HEAD** | Check if exists | (returns headers only) |
| **OPTIONS** | List methods | (returns allowed methods) |

---

## 💡 Pro Tips

- **Column-Level Security**: Use `select: { mode: false, columns: Set }` to hide sensitive columns per role
- **Row-Level Security**: Define `where` function to automatically filter rows by user
- **Computed Fields**: Use `extras` to add SQL computed fields to response
- **Body Injection**: `injectBody` auto-fills userId, timestamps, etc. from context
- **Query Hooks**: `beforeQuery` and `afterQuery` for side effects
- **Error Handling**: `onQueryError` hook for custom error handling

---

## 🚨 Important Implementation Details

1. **No Runtime Reflection** - All schema info is compile-time
2. **Transaction Support** - Each query runs in `db.transaction()` for consistency
3. **Type Safety** - Full TypeScript inference from Drizzle schema
4. **Performance** - Built directly on Drizzle, no query translation overhead
5. **ACL First** - All security rules defined upfront in single file

---

## 🎯 Ready for Development!

This guide covers:
- ✅ Project structure
- ✅ Build/test commands
- ✅ Architecture overview
- ✅ ACL configuration
- ✅ Query language
- ✅ Common tasks
- ✅ Development workflow

**Start by:**
1. Understanding a test case in `tests/query-validation.test.ts`
2. Tracing how `createQueryRoute()` processes a request
3. Looking at the ACL types in `src/query.ts` (lines 244+)
