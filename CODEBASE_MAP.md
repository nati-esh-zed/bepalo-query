# Bepalo Query - Codebase Map

## 📍 Navigation Guide

### Core Source Files

#### `src/query.ts` (2,442 lines) - **THE MAIN FILE**
The heart of the framework. Contains:

**Lines 1-84: Status Enum**
- HTTP status codes from 100 to 599
- Standard codes (200, 404, 500) and extended codes (418, 529)

**Lines 105-153: HTTP Types & Helpers**
- `HttpMethod` type union
- `RequestHandler<Context>` interface
- `json()` helper - creates JSON response
- `status()` helper - creates status response

**Lines 155-170: Core Classes & Types**
- `Table` type - Drizzle table interface
- `HttpError` class - extends Error with status code
- `operators` constant - Drizzle operators

**Lines 172-241: Type Inference**
- `BASIC_ROLES` - "guest" | "mine" | "all"
- `InferTransaction<Database>` - Extract transaction type
- `InferQuery<Database>` - Extract query type
- `ColumnSetting<T>` - Column selection config
- `CTXACLCommon<Role>` - Common context
- `CTXACLResult<Schema, K>` - Result context
- `PickTables<Schema>` - Extract only table entries
- `InferQueryRelations<K, Database>` - Extract relation types

**Lines 244-299: `_ACLWith` Type**
Defines ACL structure for WITH (relations):
- `forbidQuery` - disable specific query features
- `maxLimit` - max pagination size
- `maxDepth` - max nesting depth
- `select` - column selection
- `extras` - computed SQL fields
- `where` - row-level security filter
- `orderBy` - default sorting
- `with` - nested relations
- `validateBody` - input validation
- `injectBody` - body transformation
- `beforeQuery` / `afterQuery` / `onQueryError` - hooks

**Lines 300-500: ACL Control Types**
- `_ACLGet<...>` - GET method control (extends _ACLWith)
- `_ACLPost<...>` - POST method control
- `_ACLPatch<...>` - PATCH method control
- `_ACLDelete<...>` - DELETE method control
- `_ACL<...>` - Full ACL definition
- `ACLWith<...>` / `ACLGet<...>` / etc. - Public versions

**Lines 500-800: Query Types**
- `SelectQuery` - Query for SELECT operations
- `InsertQuery` - Query for INSERT operations
- `UpdateQuery` - Query for UPDATE operations
- `DeleteQuery` - Query for DELETE operations
- `SelectorGet` / `SelectorPost` / `SelectorPatch` / `SelectorDelete` - Parsed selector types

**Lines 800-1500: Route Creation Logic**
- `createQueryRoute<Roles, Context>()` - Main export function
- Route object setup (HEAD, OPTIONS, GET, POST, PATCH, DELETE)
- Request parsing and validation
- Query building and execution
- Result formatting

**Lines 1500-2000: GET Handler**
- Parse query parameters
- Validate column selection
- Build Drizzle query with filters, sorting, pagination
- Load relations recursively
- Handle transaction and hooks
- Format and return result

**Lines 2000-2200: POST Handler**
- Parse request body
- Validate body against schema
- Inject/transform body
- Execute INSERT with transaction
- Return created record or rowsAffected

**Lines 2200-2300: PATCH Handler**
- Parse request body and update selector
- Validate update schema
- Execute UPDATE with WHERE clause
- Handle column restrictions
- Return updated records or rowsAffected

**Lines 2300-2442: DELETE Handler**
- Parse delete selector
- Build WHERE clause from ACL
- Execute DELETE with transaction
- Return deleted records or rowsAffected count
- Handle hooks and error cases

---

#### `src/client.ts` (~100 lines)
Client-side type builders for frontend queries:

**Key Exports:**
- `InferSelectModels<Schema>` - Infer all select types from schema
- `InferInsertModels<Schema>` - Infer all insert types from schema
- `InferResponseType<resourceId, Schema, tableId>` - Full response type with count and total
- `InferResponseTypeFirst<...>` - Single record response type
- `InferResponseTypeMany<...>` - Array response type
- `BepaloQueryWith<T, Database, Schema, K>` - Typed query builder for relations

**Used For:**
- Type-safe client queries in React/Vue/Svelte frontends
- Inferring response shapes
- Building query objects with full type checking

---

#### `src/index.ts` (1 line)
Simple barrel export:
```typescript
export * from "./query.ts";
```

---

### Test Files

#### `tests/create-query-route.test.ts` (~60 lines)
Tests the route creation and setup:
- Route object creation
- HTTP method handlers presence
- Router interface compatibility

**What's Tested:**
- Routes have GET, POST, PATCH, DELETE handlers
- Routes can be mounted to HTTP servers
- Error handling on invalid setup

---

#### `tests/http-error.test.ts` (~50 lines)
Tests error handling and status codes:
- HttpError class construction
- Error message propagation
- Status code handling
- Response error formatting

**What's Tested:**
- Different HTTP error scenarios
- Status code in responses
- Error message in response body

---

#### `tests/query-validation.test.ts` (~300 lines)
**MOST COMPREHENSIVE TEST**
Tests the core query validation and execution:

**Sections:**
1. Schema setup - Creates test Drizzle schema
2. ACL definition - Defines test access rules
3. Query route creation - Sets up route with ACL
4. GET requests - Tests filtering, selection, pagination, relations
5. POST requests - Tests insertion, validation, injection
6. PATCH requests - Tests updates
7. DELETE requests - Tests deletions
8. Error cases - Tests invalid queries, ACL violations

**Test Patterns:**
- Creates mock requests and contexts
- Invokes route handlers
- Validates response status and body
- Tests ACL enforcement (role-based access)
- Tests column selection and relation loading

**Key Test Cases:**
- Selecting specific columns
- WHERE filtering
- Pagination (limit, offset)
- ORDER BY sorting
- Nested relations loading
- Body validation
- Role-based access control
- RLS (row-level security) filters

---

#### `tests/rjson.test.ts` (~250 lines)
Tests RJSON (Rich JSON) serialization:

**Purpose:**
RJSON is a format that preserves type information in JSON:
- Dates as special format
- BigInt support
- Map/Set serialization
- Circular reference handling

**Test Cases:**
- Date serialization/deserialization
- BigInt handling
- Set/Map conversion
- Complex nested structures
- Round-trip serialization

---

### Configuration Files

#### `package.json`
- **name**: @bepalo/query
- **version**: 2.3.12
- **main**: dist/cjs/index.js (CommonJS)
- **module**: dist/index.js (ESM)
- **exports**: Multiple entry points (., ./client, ./src, ./src/*)
- **scripts**: build, build:watch, build:esm, build:cjs, test, test:ci
- **dependencies**: arktype, drizzle-orm, @bepalo/rjson
- **devDeps**: TypeScript, Vitest, Concurrently, Type definitions

#### `tsconfig.json`
- **target**: ES2019
- **module**: NodeNext (dual CJS/ESM)
- **paths**: @/* alias support
- **strict**: true (strict type checking)
- **declaration**: true (generate .d.ts files)

#### `vitest.config.ts`
- Test framework configuration
- Reporter settings

---

### Build Outputs (Auto-Generated)

#### `dist/` Directory
**ESM Output:**
- `index.js` - Main export
- `index.d.ts` - Types
- `client.js` - Client builder
- `client.d.ts` - Client types
- `query.js` - Query implementation
- `query.d.ts` - Query types
- `*.map` - Source maps

**CJS Output (dist/cjs/):**
- Same files but CommonJS format

---

## 🔗 Key Connections

### How Types Flow

```
Drizzle Schema (user, post tables)
        ↓
    query.ts - Types infer from schema
        ↓
client.ts - Builds response/query types
        ↓
Frontend - Uses InferSelectModels, InferResponseType
```

### How Requests Flow

```
HTTP Request (GET /query/users)
        ↓
createQueryRoute() handler
        ↓
Parse params + Authenticate (session parser)
        ↓
Load ACL selector for resourceId + role
        ↓
Validate against ACL (column selection, where filter)
        ↓
Build Drizzle query
        ↓
Execute in transaction with hooks
        ↓
Format result
        ↓
HTTP Response (200 with JSON)
```

### ACL Validation Flow

```
User Role (from session)
        ↓
Query HTTP Method (GET, POST, PATCH, DELETE)
        ↓
Look up control[METHOD][role] in ACL
        ↓
If missing → 403 Forbidden
        ↓
Extract selector (select, where, with, etc.)
        ↓
Apply RLS where filter
        ↓
Restrict to allowed columns
        ↓
Execute query with restrictions
```

---

## 🎯 Where to Look For...

| Task | Location |
|------|----------|
| Add new HTTP method | `src/query.ts` - createQueryRoute function |
| Add column security | `src/query.ts` - column selection logic (line ~2340) |
| Add RLS support | `src/query.ts` - where filter application (line ~2374) |
| Add validation hook | `src/query.ts` - validateBody handling |
| Add computed field | `src/query.ts` - extras handling |
| Fix error handling | `src/query.ts` - error catch blocks |
| Add query type | `src/query.ts` - SelectQuery, InsertQuery types |
| Add client type | `src/client.ts` - InferResponseType |
| Test query parsing | `tests/query-validation.test.ts` |
| Test errors | `tests/http-error.test.ts` |
| Test serialization | `tests/rjson.test.ts` |

---

## 🚀 Understanding the Code

### Best Starting Points

1. **High-level overview:**
   - Read README.md (features, quick-start)
   - Skim QUICK_START.md (this file)

2. **Type system:**
   - Study `_ACLWith` type (line 244)
   - Study `_ACL` type (line ~300)
   - Look at control structure

3. **Request handling:**
   - Read `createQueryRoute` function signature (line ~1200)
   - Trace GET handler (line ~1500)
   - Trace POST handler (line ~2000)

4. **Tests for learning:**
   - Start with `query-validation.test.ts` first
   - Look at test setups and assertions
   - Understand how ACL is validated

5. **Implementation details:**
   - See how queries are built in GET handler
   - See how WHERE filters are applied
   - See how relations are loaded recursively

---

## 📊 Code Statistics

| Metric | Value |
|--------|-------|
| Total Source Lines | ~2,600 |
| Main File (query.ts) | 2,442 |
| Client Builder (client.ts) | ~100 |
| Total Test Lines | ~660 |
| Total Exports | 40+ |
| HTTP Methods | 6 (HEAD, OPTIONS, GET, POST, PATCH, DELETE) |
| Type Definitions | 60+ |
| Dependencies | 3 |
| Dev Dependencies | 5 |

---

## 🔄 Development Workflow

### To Understand a Feature
1. Read relevant section in README.md
2. Find examples in QUICK_START.md
3. Look for tests in `tests/query-validation.test.ts`
4. Trace implementation in `src/query.ts`
5. Check types in `src/client.ts` if frontend-related

### To Add a Feature
1. Write a test in `tests/query-validation.test.ts`
2. Add type in `src/query.ts`
3. Add implementation in route handlers
4. Update client types in `src/client.ts`
5. Run `pnpm test` to verify
6. Build: `pnpm run build`

### To Fix a Bug
1. Write a failing test
2. Locate bug in `src/query.ts`
3. Fix implementation
4. Verify test passes
5. Run full test suite

---

## 🎓 Important Concepts

**ACL (Access Control List)**
- Defines who can do what
- Per-role permissions
- Per-HTTP-method rules
- Column and row level security

**Selector**
- Parsed query/body
- Contains: select, where, orderBy, limit, offset, with
- Created from ACL config
- Validated before query execution

**RLS (Row-Level Security)**
- WHERE clause automatically applied
- Filters rows based on user/session
- Prevents unauthorized data access
- Applied on all CRUD operations

**Computed Fields**
- SQL expressions added to SELECT
- Not from database columns
- Defined in ACL via `extras`
- Added to response automatically

**Column-Level Security**
- Select specific columns per role
- Hide sensitive data from some roles
- Defined via `select: { columns: Set }`
- Enforced in all responses
