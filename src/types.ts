import { ArkErrors, scope, type } from "arktype";
import { RJSON } from "@bepalo/rjson";
import type { SQL, InferSelectModel, Operators } from "drizzle-orm";
import { HttpError } from "./utils.ts";

/**
 * Standard HTTP methods supported by the router.
 * These methods correspond to HTTP/1.1 request methods.
 *
 * @type {"HEAD"|"OPTIONS"|"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} HttpMethod
 *
 * @example
 * const method: HttpMethod = "GET";
 * const method: HttpMethod = "POST";
 */
type HttpMethod =
  | "HEAD"
  | "OPTIONS"
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

/**
 * Request handler type
 * @callback RequestHandler
 * @template Context
 * @param {Request} req - The incoming request
 * @param {Context} ctx - The request context
 * @returns {Response|void|Promise<Response|void>} A Response, or void to continue to next handler
 */
export interface RequestHandler<Context = any> {
  (req: Request, ctx: Context): Response | void | Promise<Response | void>;
}

export type Table = {
  _: any;
  $inferSelect: any;
  $inferInsert: any;
  getSQL: any;
};

export type BASIC_ROLES = "guest" | "mine" | "all";

export type InferTransaction<
  Database extends {
    transaction: any;
  },
> = Database extends {
  transaction: infer TransactionFn extends { (...args: any[]): any };
}
  ? Parameters<Parameters<TransactionFn>[0]>[0]
  : never;
export type InferQuery<Database extends { query: any }> = Database extends {
  query: infer TQuery;
}
  ? TQuery
  : never;

export type ColumnSetting<T extends Table> = {
  mode?: boolean | number;
  columns?: Set<keyof InferSelectModel<T>>;
};

export type CTXACLCommon<Role> = {
  resourceId: string;
  findFirst?: boolean;
  userRole?: Role;
};

export type CTXTX<Transaction> = {
  tx: Transaction;
};

export type CTXACLResult<
  Schema extends Record<string, Table | unknown>,
  K extends keyof Schema,
> = {
  result?: {
    rows?:
      | (Schema[K] extends Table
          ?
              | Partial<InferSelectModel<Schema[K]>>[]
              | (Partial<InferSelectModel<Schema[K]>> &
                  Record<string, Partial<InferSelectModel<Table>>>)[]
          : unknown[])
      | null;
    count?: number;
    total?: number;
    rowsAffected?: number;
  };
};

export type PickTables<Schema extends Record<string, Table | unknown>> = {
  [K in keyof Schema as Schema[K] extends Table
    ? K
    : never]: Schema[K] extends Table ? Schema[K] : never;
};

export type InferQueryRelationsWith<QueryParams extends { with: any }> =
  QueryParams extends { with?: infer With } ? With : never;

export type InferQueryRelations<
  K extends keyof Database["query"],
  Database extends {
    query: Record<
      keyof Database["query"],
      { findFirst: (...args: any[]) => any }
    >;
  },
> = InferQueryRelationsWith<
  NonNullable<Parameters<Database["query"][K]["findFirst"]>[0]>
>;

export type _ACLWith<
  Context,
  Schema extends Record<string, Table>,
  Database extends { transaction: any; query: any },
  Transaction extends InferTransaction<Database>,
  Query extends InferQuery<Database>,
  K extends keyof Schema,
  P extends keyof _ACLWith<
    Context,
    Schema,
    Database,
    Transaction,
    Query,
    K,
    | "forbidQuery"
    | "maxLimit"
    | "maxDepth"
    | "select"
    | "extras"
    | "where"
    | "orderBy"
    | "with"
    | "validateBody"
    | "injectBody"
    | "beforeQuery"
    | "afterQuery"
    | "onQueryError"
  >,
> = {
  forbidQuery?: {
    columns?: boolean;
    offset?: boolean;
    limit?: boolean;
    where?: boolean;
    orderBy?: boolean;
    with?: boolean;
  };

  maxLimit?: number | null;
  maxDepth?: number | null;

  select?: ColumnSetting<Schema[K]> | boolean;

  extras?: Record<string, SQL.Aliased>;

  where?: {
    (ctx: Context, table: Schema[K], ops: Operators): SQL | undefined;
  };

  orderBy?: Record<string, "asc" | "desc" | 1 | -1>;

  with?: {
    [N in keyof Schema as N extends keyof InferQueryRelations<K, Database>
      ? N
      : never]?: ACLWith<Context, Schema, Database, Transaction, Query, N, P>;
  };

  // used to do custom validation and parsing on body
  validateBody?: <B extends Record<string, unknown>>(
    body: B,
    ctx: Context,
  ) =>
    | Record<string, unknown>
    | ArkErrors
    | Promise<Record<string, unknown> | ArkErrors>;

  // used to do transform/edit on body
  injectBody?: <B extends Record<string, unknown>>(
    body: B,
    ctx: Context,
  ) =>
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | Promise<Record<string, unknown> | Array<Record<string, unknown>>>;

  // called before querying or inserting or updating in the database
  beforeQuery?: (ctx: Context & CTXTX<Transaction>) => void | Promise<void>;

  // called after querying or inserting or updating in the database
  afterQuery?: (ctx: Context & CTXTX<Transaction>) => void | Promise<void>;

  // called after an error occured while trying to execute query in the database
  onQueryError?: (
    error: HttpError | Error,
    ctx: Context &
      CTXTX<Transaction> & {
        dontThrow?: boolean;
      },
  ) => Response | void | Promise<Response | void>;
};

export type ACLWith<
  Context,
  Schema extends Record<string, Table>,
  Database extends { transaction: any; query: any },
  Transaction extends InferTransaction<Database>,
  Query extends InferQuery<Database>,
  K extends keyof Schema,
  P extends keyof _ACLWith<
    Context,
    Schema,
    Database,
    Transaction,
    Query,
    K,
    | "forbidQuery"
    | "maxLimit"
    | "maxDepth"
    | "select"
    | "extras"
    | "where"
    | "orderBy"
    | "with"
    | "validateBody"
    | "injectBody"
    | "beforeQuery"
    | "afterQuery"
    | "onQueryError"
  >,
> = Pick<_ACLWith<Context, Schema, Database, Transaction, Query, K, P>, P> & {
  formatResult?: RequestHandler<Context>;
};

export type ACLEntry<
  Role extends string,
  Context,
  Schema extends Record<string, Table>,
  Database extends { transaction: any; query: any },
  Transaction extends InferTransaction<Database>,
  Query extends InferQuery<Database>,
  K extends keyof Schema,
> = {
  table: K;
  findFirst?: boolean;
  countTotal?: boolean;
  maxLimit?: number | null;
  maxDepth?: number | null;
  formatResult?: RequestHandler<Context>;
  control: {
    HEAD?: Partial<
      Record<
        BASIC_ROLES | Role,
        ACLWith<
          Context,
          Schema,
          Database,
          Transaction,
          Query,
          K,
          | "forbidQuery"
          | "maxLimit"
          | "maxDepth"
          | "select"
          | "where"
          | "with"
          | "beforeQuery"
          | "afterQuery"
          | "onQueryError"
        >
      >
    >;
    GET?: Partial<
      Record<
        BASIC_ROLES | Role,
        ACLWith<
          Context,
          Schema,
          Database,
          Transaction,
          Query,
          K,
          | "forbidQuery"
          | "maxLimit"
          | "maxDepth"
          | "select"
          | "where"
          | "with"
          | "beforeQuery"
          | "afterQuery"
          | "onQueryError"
        >
      >
    >;
    POST?: Partial<
      Record<
        BASIC_ROLES | Role,
        ACLWith<
          Context,
          Schema,
          Database,
          Transaction,
          Query,
          K,
          | "forbidQuery"
          | "select"
          | "where"
          | "validateBody"
          | "injectBody"
          | "beforeQuery"
          | "afterQuery"
          | "onQueryError"
        >
      >
    >;
    PATCH?: Partial<
      Record<
        BASIC_ROLES | Role,
        ACLWith<
          Context,
          Schema,
          Database,
          Transaction,
          Query,
          K,
          | "forbidQuery"
          | "select"
          | "where"
          | "validateBody"
          | "injectBody"
          | "beforeQuery"
          | "afterQuery"
          | "onQueryError"
        >
      >
    >;
    DELETE?: Partial<
      Record<
        BASIC_ROLES | Role,
        ACLWith<
          Context,
          Schema,
          Database,
          Transaction,
          Query,
          K,
          | "forbidQuery"
          | "select"
          | "where"
          | "beforeQuery"
          | "afterQuery"
          | "onQueryError"
        >
      >
    >;
  };
};

export type _ACL<
  Role extends string,
  CTXSession extends object,
  XContext,
  Schema extends Record<string, Table>,
  Database extends { transaction: any; query: any },
  Transaction extends InferTransaction<Database> = InferTransaction<Database>,
  Query extends InferQuery<Database> = InferQuery<Database>,
> = {
  [K in keyof Schema as Schema[K] extends Table ? string : never]?: ACLEntry<
    Role,
    CTXSession & XContext & CTXACLCommon<Role> & CTXACLResult<Schema, K>,
    Schema,
    Database,
    Transaction,
    Query,
    K
  >;
};

export type ACL<
  Role extends string,
  CTXSession extends object,
  XContext,
  Schema extends Record<string, Table | unknown>,
  Database extends { transaction: any; query: any },
  Transaction extends InferTransaction<Database> = InferTransaction<Database>,
  Query extends InferQuery<Database> = InferQuery<Database>,
> = _ACL<
  Role,
  CTXSession,
  XContext,
  PickTables<Schema>,
  Database,
  Transaction,
  Query
>;

export type Routes = {
  [M in HttpMethod]?: (
    req: Request & { params: Record<string, string> },
  ) => Promise<Response>;
};

export const QueryScope = scope({
  GetSelector: {
    "offset?": "number",
    "limit?": "number",
    "columns?": "Record<string,boolean> | boolean",
    "where?": "Record<string, unknown> | Record<string, unknown>[]",
    "orderBy?": "Record<string, 'asc' | 'desc' | 1 | -1>",
    "with?": {
      "[string]": "GetSelector|boolean",
    },
    "+": "reject",
  },
  PostSelector: {
    "columns?": "Record<string,boolean> | boolean",
    "+": "reject",
  },
  PatchSelector: {
    "columns?": "Record<string,boolean> | boolean",
    "where?": "Record<string, unknown> | Record<string, unknown>[]",
    "+": "reject",
  },
  DeleteSelector: {
    "columns?": "Record<string,boolean> | boolean",
    "where?": "Record<string, unknown> | Record<string, unknown>[]",
    "+": "reject",
  },
});

export const TSelectorGet = QueryScope.type("GetSelector");

export type SelectorGet = typeof TSelectorGet.infer;

export const TSelectorPost = QueryScope.type("PostSelector");

export type SelectorPost = typeof TSelectorPost.infer;

export const TSelectorPatch = QueryScope.type("PatchSelector");

export type SelectorPatch = typeof TSelectorPatch.infer;

export const TSelectorDelete = QueryScope.type("DeleteSelector");

export type SelectorDelete = typeof TSelectorDelete.infer;

export const TOptionsQuery = type(
  type({
    "guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine|guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
  }),
);

export type OptionsQuery = typeof TOptionsQuery.infer;

export type CTXOptionsQuery = {
  query: OptionsQuery;
};

export const TGetQuery = type({
  "findFirst?": type("'T'|'F'|''")
    .pipe((args: string) => args.charCodeAt(0) !== 70)
    .to("boolean"),
  "guest?": type("'T'|'F'|''")
    .pipe((args: string) => args.charCodeAt(0) !== 70)
    .to("boolean"),
  "mine?": type("'T'|'F'|''")
    .pipe((args: string) => args.charCodeAt(0) !== 70)
    .to("boolean"),
  "mine|guest?": type("'T'|'F'|''")
    .pipe((args: string) => args.charCodeAt(0) !== 70)
    .to("boolean"),
  "countTotal?": type("'T'|'F'|''")
    .pipe((args: string) => args.charCodeAt(0) !== 70)
    .to("boolean"),
  "select?": type("string")
    .pipe((args: string) => RJSON.parse(args))
    .to(TSelectorGet),
});

export type GetQuery = typeof TGetQuery.infer;

export type CTXGetQuery = {
  query: GetQuery;
};

export const TPostQuery = type(
  type({
    "guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine|guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "countTotal?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "select?": type("string")
      .pipe((args: string) => RJSON.parse(args))
      .to(TSelectorPost),
  }),
);

export type PostQuery = typeof TPostQuery.infer;

export type CTXPostQuery = {
  query: PostQuery;
};

export const TPostBody = type(
  "Record<string, unknown>|Record<string, unknown>[]",
);

export type PostBody = typeof TPostBody.infer;

export type CTXPostBody = {
  body: PostBody;
};

export const TPatchQuery = type(
  type({
    "guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine|guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "countTotal?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "select?": type("string")
      .pipe((args: string) => RJSON.parse(args))
      .to(TSelectorPatch),
  }),
);

export type PatchQuery = typeof TPatchQuery.infer;

export type CTXPatchQuery = {
  query: PatchQuery;
};

export const TPatchBody = type("Record<string, unknown>");

export type PatchBody = typeof TPatchBody.infer;

export type CTXPatchBody = {
  body: PatchBody;
};

export const TDeleteQuery = type(
  type({
    "guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "mine|guest?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "countTotal?": type("'T'|'F'|''")
      .pipe((args: string) => args.charCodeAt(0) !== 70)
      .to("boolean"),
    "select?": type("string")
      .pipe((args: string) => RJSON.parse(args))
      .to(TSelectorDelete),
  }),
);

export type DeleteQuery = typeof TDeleteQuery.infer;

export type CTXDeleteQuery = {
  query: DeleteQuery;
};

/**
 * Context object containing parsed request body.
 * @type {Object} CTXBody
 * @property {ParsedBody} body - Parsed request body data
 */
export type CTXBody = {
  body: any;
};
