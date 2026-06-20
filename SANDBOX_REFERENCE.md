# Testing Sandbox Reference Guide

## Overview

The `.sandbox` directory contains a live testing environment for **@bepalo/query** with Better Auth integration.

### Live Server
- **URL**: `http://localhost:4000`
- **Runtime**: Bun (with hot reload)
- **Database**: SQLite (`.dev.db`)
- **Auth**: Better Auth at `/api/auth`
- **Query API**: `POST /query/:id` or `GET /query/:id`

---

## Database Schema

### Tables

#### `user`
- Better Auth generated table
- Columns: `id`, `name`, `email`, `emailVerified`, `image`, `role`, `createdAt`, `updatedAt`
- Roles: `"user"` (default) or `"admin"`
- Relations: `session`, `account`, `post`

#### `post`
- User-generated content
- Columns: `id`, `userId`, `title` (50 chars), `body` (512 chars), `createdAt`, `updatedAt`
- Relations: belongs to `user`
- Unique constraint: none (multiple posts per user allowed)

#### `basket`
- Container for fruits
- Columns: `id`, `name` (30 chars), `capacity` (default: 20), `createdAt`, `updatedAt`
- Relations: has many `fruit`
- Unique constraint: `uk_basket_name` on `name`

#### `fruit`
- Items in baskets
- Columns: `id`, `name` (30 chars), `sweetness` (default: 0), `sourness` (default: 0), `bitterness` (default: 0), `basketId`, `createdAt`, `updatedAt`
- Relations: belongs to `basket`
- Unique constraint: `uk_fruit_name` on `name`

#### Support Tables
- `session` - Better Auth
- `account` - Better Auth OAuth
- `verification` - Better Auth email verification

---

## API Endpoints

### Authentication (`/api/auth/*`)

#### Sign Up
```http
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "Password@123",
  "role": "user"  // optional, defaults to "user"
}
```

#### Sign In
```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password@123"
}
```

#### Sign Out
```http
POST /api/auth/sign-out
```

---

### Query API (`/query/:table`)

#### Available Resources
- `/query/posts` - User-generated posts
- `/query/post` - Single post (findFirst)
- `/query/users` - All users (admin only)
- `/query/user` - Current user (findFirst)
- `/query/fruits` - All fruits
- `/query/baskets` - All baskets

#### HTTP Methods
- `GET` - Read/query data
- `POST` - Create records
- `PATCH` - Update records
- `DELETE` - Delete records
- `OPTIONS` - Check permissions

#### Query String Parameters

**Modifiers** (query flags):
- `mine` - Row-level security filter (posts of current user)
- `guest` - Public/guest access
- `countTotal` - Return total count after query

**Selection** (complex query):
- `select=(...)` - Specify columns, relationships, filters, sorting, pagination

#### Query Language: RJSON

RJSON is a compact syntax for complex queries. Examples:

```
?select=(columns:~T(id,title,body)~)
- Select specific columns: id, title, body

?select=(columns:F)
- Select no columns (useful for DELETE to check syntax)

?select=(columns:T)
- Select all columns

?select=(limit:5,offset:10)
- Paginate: 5 items starting at position 10

?select=(orderBy:(createdAt:'asc'))
- Sort by createdAt ascending

?select=(where:(id.eq:'abc-123'),columns:T)
- Filter: where id equals 'abc-123'

?select=(where:(body.like:'Bye%%'),columns:T)
- Filter: where body contains 'Bye'

?select=(where:(createdAt.gte:1718000000000),columns:T)
- Filter: where createdAt >= timestamp (milliseconds)

?select=(with:(user:(columns:~T(name)~)),columns:T)
- Include related data (user with only name column)

?select=(with:(user:(with:(posts:(columns:~T(title)~)))))
- Nested relations (user with related posts)
```

---

## Access Control (ACL)

### Resources Defined

#### `posts` (Table: `post`)
- **GET**: 
  - `mine` - Only own posts, all columns, can include user relations
- **POST**: 
  - `mine` - Create posts, auto-inject `userId`, validates title/body
- **PATCH**: 
  - `mine` - Update own posts only, validates title/body
- **DELETE**: 
  - `mine` - Delete own posts only
- **Limits**: maxDepth=1, maxLimit=10

#### `post` (Single, Table: `post`)
- **GET**:
  - `mine` - Get current user's single post, excludes createdAt/updatedAt
- No modifications allowed

#### `users` (All users, Table: `user`)
- **GET**:
  - `admin` - Only admin can view all users
- maxDepth=0 (no relations)
- findFirst=false (returns list)

#### `user` (Current user, Table: `user`)
- **GET**:
  - `mine` - Get own profile, excludes createdAt/updatedAt, no nested account data

#### `fruits` (Table: `fruit`)
- **GET**:
  - `all` - Public read, all columns, maxDepth=1 for basket relation
- **POST**:
  - `all` - Public create
- **DELETE**:
  - `all` - Public delete
- **Custom Response**: Includes `total`, `rowsAffected`, `count`

#### `baskets` (Table: `basket`)
- **GET**:
  - `all` - Public read, excludes createdAt/updatedAt, includes fruit with limited columns
- **POST**:
  - `all` - Public create
- **DELETE**:
  - `all` - Public delete

---

## REST Client Examples

The `.http` file provides ready-to-run examples using VSCode REST Client extension.

### Test Flow

1. **Sign up as user and admin**
   - Creates two test accounts
   - Saves auth session

2. **Create posts**
   - Single post creation
   - Batch create 10 posts
   - Uses POST method with RJSON body format

3. **Query posts**
   - Get own posts with pagination
   - Filter by created time and text
   - Include user relations
   - Count total results

4. **Update posts**
   - PATCH to modify post body
   - Only own posts (mine filter)

5. **Delete posts**
   - DELETE with various select configurations

6. **Create baskets & fruits**
   - Batch create containers
   - Add items with specific properties
   - Test custom response formatting

7. **OPTIONS method**
   - Test permissions on resources

---

## Development Commands

```bash
# Start dev server (with hot reload)
bun dev
# or
bun --watch src/index.ts

# View live database
# .sandbox/.dev.db (SQLite file)

# Run migrations
# drizzle-kit push
```

---

## Environment Variables

Located in `.sandbox/.env`:

```env
BETTER_AUTH_URL=http://localhost:4000/api/auth
PORT=4000
```

---

## Key Features Demonstrated

### 1. Role-Based Access Control (RBAC)
- Admin can see all users
- Users can only see their own posts
- All can access fruits

### 2. Row-Level Security (RLS)
- Posts filtered by userId when using `mine` modifier
- DELETE on posts only affects user's own records

### 3. Column-Level Security
- User posts exclude createdAt/updatedAt
- User profile hides account details

### 4. Type Validation
- Post creation validates title/body fields
- Uses arktype + Drizzle schemas

### 5. Nested Relations
- Can query posts with user details
- Can query users with all their posts
- Configurable depth limits

### 6. Batch Operations
- Create multiple records with RJSON format
- Uses `_( ... )_` syntax for arrays

### 7. Complex Filtering
- Like operators: `body.like:'pattern%%'`
- Comparison: `createdAt.gte:timestamp`
- Multiple conditions with AND logic

---

## Testing Workflow

### Using REST Client (VSCode)

1. Install "REST Client" extension
2. Open `.sandbox/.http`
3. Click "Send Request" above each request
4. View response in side panel
5. Variables are auto-extracted for chaining requests

### Manual Testing with curl

```bash
# Sign up
curl -X POST http://localhost:4000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@local.dev","password":"Test@123"}'

# Get posts
curl -X GET 'http://localhost:4000/query/posts?mine&select=(columns:T)'
```

---

## Debugging

### View Response Headers
REST Client shows:
- `content-type` (usually `application/json`)
- `set-cookie` (auth session)
- Custom headers

### Test Variables
The .http file uses variables that auto-populate:
- `@hostname` - Base URL
- `@query` - Query endpoint
- `@newPostId` - ID from last created post
- `@basket0Id` - ID from first created basket

### Console Output
Check server logs for:
- Query validation errors
- ACL violations
- Database errors

---

## Architecture Summary

```
Request Flow:
  1. HTTP request to /query/:resourceId?params
  2. Authenticate via better-auth session
  3. Parse query parameters (RJSON format)
  4. Load ACL rules for resource
  5. Check permissions (role + resource + method)
  6. Validate body (if POST/PATCH)
  7. Apply row-level security filters
  8. Execute Drizzle query
  9. Format response
  10. Return JSON
```

---

## Next Steps

- Modify ACL to test access control
- Add new table to schema
- Test with custom columns/filters
- Explore nested relation queries
- Check error handling
