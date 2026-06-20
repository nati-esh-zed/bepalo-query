import { ArkErrors } from "arktype";
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
type HttpMethod = "HEAD" | "OPTIONS" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
export type InferTransaction<Database extends {
    transaction: any;
}> = Database extends {
    transaction: infer TransactionFn extends {
        (...args: any[]): any;
    };
} ? Parameters<Parameters<TransactionFn>[0]>[0] : never;
export type InferQuery<Database extends {
    query: any;
}> = Database extends {
    query: infer TQuery;
} ? TQuery : never;
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
export type CTXACLResult<Schema extends Record<string, Table | unknown>, K extends keyof Schema> = {
    result?: {
        rows?: (Schema[K] extends Table ? Partial<InferSelectModel<Schema[K]>>[] | (Partial<InferSelectModel<Schema[K]>> & Record<string, Partial<InferSelectModel<Table>>>)[] : unknown[]) | null;
        count?: number;
        total?: number;
        rowsAffected?: number;
    };
};
export type PickTables<Schema extends Record<string, Table | unknown>> = {
    [K in keyof Schema as Schema[K] extends Table ? K : never]: Schema[K] extends Table ? Schema[K] : never;
};
export type InferQueryRelationsWith<QueryParams extends {
    with: any;
}> = QueryParams extends {
    with?: infer With;
} ? With : never;
export type InferQueryRelations<K extends keyof Database["query"], Database extends {
    query: Record<keyof Database["query"], {
        findFirst: (...args: any[]) => any;
    }>;
}> = InferQueryRelationsWith<NonNullable<Parameters<Database["query"][K]["findFirst"]>[0]>>;
export type _ACLWith<Context, Schema extends Record<string, Table>, Database extends {
    transaction: any;
    query: any;
}, Transaction extends InferTransaction<Database>, Query extends InferQuery<Database>, K extends keyof Schema, P extends keyof _ACLWith<Context, Schema, Database, Transaction, Query, K, "forbidQuery" | "maxLimit" | "maxDepth" | "select" | "extras" | "where" | "orderBy" | "with" | "validateBody" | "injectBody" | "beforeQuery" | "afterQuery" | "onQueryError">> = {
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
        [N in keyof Schema as N extends keyof InferQueryRelations<K, Database> ? N : never]?: ACLWith<Context, Schema, Database, Transaction, Query, N, P>;
    };
    validateBody?: <B extends Record<string, unknown>>(body: B, ctx: Context) => Record<string, unknown> | ArkErrors | Promise<Record<string, unknown> | ArkErrors>;
    injectBody?: <B extends Record<string, unknown>>(body: B, ctx: Context) => Record<string, unknown> | Array<Record<string, unknown>> | Promise<Record<string, unknown> | Array<Record<string, unknown>>>;
    beforeQuery?: (ctx: Context & CTXTX<Transaction>) => void | Promise<void>;
    afterQuery?: (ctx: Context & CTXTX<Transaction>) => void | Promise<void>;
    onQueryError?: (error: HttpError | Error, ctx: Context & CTXTX<Transaction> & {
        dontThrow?: boolean;
    }) => Response | void | Promise<Response | void>;
};
export type ACLWith<Context, Schema extends Record<string, Table>, Database extends {
    transaction: any;
    query: any;
}, Transaction extends InferTransaction<Database>, Query extends InferQuery<Database>, K extends keyof Schema, P extends keyof _ACLWith<Context, Schema, Database, Transaction, Query, K, "forbidQuery" | "maxLimit" | "maxDepth" | "select" | "extras" | "where" | "orderBy" | "with" | "validateBody" | "injectBody" | "beforeQuery" | "afterQuery" | "onQueryError">> = Pick<_ACLWith<Context, Schema, Database, Transaction, Query, K, P>, P> & {
    formatResult?: RequestHandler<Context>;
};
export type ACLEntry<Role extends string, Context, Schema extends Record<string, Table>, Database extends {
    transaction: any;
    query: any;
}, Transaction extends InferTransaction<Database>, Query extends InferQuery<Database>, K extends keyof Schema> = {
    table: K;
    findFirst?: boolean;
    countTotal?: boolean;
    maxLimit?: number | null;
    maxDepth?: number | null;
    formatResult?: RequestHandler<Context>;
    control: {
        HEAD?: Partial<Record<BASIC_ROLES | Role, ACLWith<Context, Schema, Database, Transaction, Query, K, "forbidQuery" | "maxLimit" | "maxDepth" | "select" | "where" | "with" | "beforeQuery" | "afterQuery" | "onQueryError">>>;
        GET?: Partial<Record<BASIC_ROLES | Role, ACLWith<Context, Schema, Database, Transaction, Query, K, "forbidQuery" | "maxLimit" | "maxDepth" | "select" | "where" | "with" | "beforeQuery" | "afterQuery" | "onQueryError">>>;
        POST?: Partial<Record<BASIC_ROLES | Role, ACLWith<Context, Schema, Database, Transaction, Query, K, "forbidQuery" | "select" | "where" | "validateBody" | "injectBody" | "beforeQuery" | "afterQuery" | "onQueryError">>>;
        PATCH?: Partial<Record<BASIC_ROLES | Role, ACLWith<Context, Schema, Database, Transaction, Query, K, "forbidQuery" | "select" | "where" | "validateBody" | "injectBody" | "beforeQuery" | "afterQuery" | "onQueryError">>>;
        DELETE?: Partial<Record<BASIC_ROLES | Role, ACLWith<Context, Schema, Database, Transaction, Query, K, "forbidQuery" | "select" | "where" | "beforeQuery" | "afterQuery" | "onQueryError">>>;
    };
};
export type _ACL<Role extends string, CTXSession extends object, XContext, Schema extends Record<string, Table>, Database extends {
    transaction: any;
    query: any;
}, Transaction extends InferTransaction<Database> = InferTransaction<Database>, Query extends InferQuery<Database> = InferQuery<Database>> = {
    [K in keyof Schema as Schema[K] extends Table ? string : never]?: ACLEntry<Role, CTXSession & XContext & CTXACLCommon<Role> & CTXACLResult<Schema, K>, Schema, Database, Transaction, Query, K>;
};
export type ACL<Role extends string, CTXSession extends object, XContext, Schema extends Record<string, Table | unknown>, Database extends {
    transaction: any;
    query: any;
}, Transaction extends InferTransaction<Database> = InferTransaction<Database>, Query extends InferQuery<Database> = InferQuery<Database>> = _ACL<Role, CTXSession, XContext, PickTables<Schema>, Database, Transaction, Query>;
export type Routes = {
    [M in HttpMethod]?: (req: Request & {
        params: Record<string, string>;
    }) => Promise<Response>;
};
export declare const QueryScope: import("arktype").Scope<{
    GetSelector: {
        offset?: number | undefined;
        limit?: number | undefined;
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
        orderBy?: Record<string, 1 | "asc" | "desc" | -1> | undefined;
        with?: {
            [x: string]: boolean | /*elided*/ any;
        } | undefined;
    };
    PostSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
    };
    PatchSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
    DeleteSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
}>;
export declare const TSelectorGet: import("arktype/out/variants/object").ObjectType<{
    offset?: number | undefined;
    limit?: number | undefined;
    columns?: boolean | Record<string, boolean> | undefined;
    where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    orderBy?: Record<string, 1 | "asc" | "desc" | -1> | undefined;
    with?: {
        [x: string]: boolean | /*elided*/ any;
    } | undefined;
}, {
    GetSelector: {
        offset?: number | undefined;
        limit?: number | undefined;
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
        orderBy?: Record<string, 1 | "asc" | "desc" | -1> | undefined;
        with?: {
            [x: string]: boolean | /*elided*/ any;
        } | undefined;
    };
    PostSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
    };
    PatchSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
    DeleteSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
}>;
export type SelectorGet = typeof TSelectorGet.infer;
export declare const TSelectorPost: import("arktype/out/variants/object").ObjectType<{
    columns?: boolean | Record<string, boolean> | undefined;
}, {
    GetSelector: {
        offset?: number | undefined;
        limit?: number | undefined;
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
        orderBy?: Record<string, 1 | "asc" | "desc" | -1> | undefined;
        with?: {
            [x: string]: boolean | /*elided*/ any;
        } | undefined;
    };
    PostSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
    };
    PatchSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
    DeleteSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
}>;
export type SelectorPost = typeof TSelectorPost.infer;
export declare const TSelectorPatch: import("arktype/out/variants/object").ObjectType<{
    columns?: boolean | Record<string, boolean> | undefined;
    where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
}, {
    GetSelector: {
        offset?: number | undefined;
        limit?: number | undefined;
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
        orderBy?: Record<string, 1 | "asc" | "desc" | -1> | undefined;
        with?: {
            [x: string]: boolean | /*elided*/ any;
        } | undefined;
    };
    PostSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
    };
    PatchSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
    DeleteSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
}>;
export type SelectorPatch = typeof TSelectorPatch.infer;
export declare const TSelectorDelete: import("arktype/out/variants/object").ObjectType<{
    columns?: boolean | Record<string, boolean> | undefined;
    where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
}, {
    GetSelector: {
        offset?: number | undefined;
        limit?: number | undefined;
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
        orderBy?: Record<string, 1 | "asc" | "desc" | -1> | undefined;
        with?: {
            [x: string]: boolean | /*elided*/ any;
        } | undefined;
    };
    PostSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
    };
    PatchSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
    DeleteSelector: {
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    };
}>;
export type SelectorDelete = typeof TSelectorDelete.infer;
export declare const TOptionsQuery: import("arktype/out/variants/object").ObjectType<{
    guest?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    mine?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    "mine|guest"?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
}, {}>;
export type OptionsQuery = typeof TOptionsQuery.infer;
export type CTXOptionsQuery = {
    query: OptionsQuery;
};
export declare const TGetQuery: import("arktype/out/variants/object").ObjectType<{
    findFirst?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    guest?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    mine?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    "mine|guest"?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    countTotal?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    select?: ((In: string) => import("arktype/out/attributes").To<{
        offset?: number | undefined;
        limit?: number | undefined;
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
        orderBy?: Record<string, 1 | "asc" | "desc" | -1> | undefined;
        with?: {
            [x: string]: boolean | /*elided*/ any;
        } | undefined;
    }>) | undefined;
}, {}>;
export type GetQuery = typeof TGetQuery.infer;
export type CTXGetQuery = {
    query: GetQuery;
};
export declare const TPostQuery: import("arktype/out/variants/object").ObjectType<{
    guest?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    mine?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    "mine|guest"?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    countTotal?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    select?: ((In: string) => import("arktype/out/attributes").To<{
        columns?: boolean | Record<string, boolean> | undefined;
    }>) | undefined;
}, {}>;
export type PostQuery = typeof TPostQuery.infer;
export type CTXPostQuery = {
    query: PostQuery;
};
export declare const TPostBody: import("arktype/out/variants/object").ObjectType<Record<string, unknown> | Record<string, unknown>[], {}>;
export type PostBody = typeof TPostBody.infer;
export type CTXPostBody = {
    body: PostBody;
};
export declare const TPatchQuery: import("arktype/out/variants/object").ObjectType<{
    guest?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    mine?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    "mine|guest"?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    countTotal?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    select?: ((In: string) => import("arktype/out/attributes").To<{
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    }>) | undefined;
}, {}>;
export type PatchQuery = typeof TPatchQuery.infer;
export type CTXPatchQuery = {
    query: PatchQuery;
};
export declare const TPatchBody: import("arktype/out/variants/object").ObjectType<Record<string, unknown>, {}>;
export type PatchBody = typeof TPatchBody.infer;
export type CTXPatchBody = {
    body: PatchBody;
};
export declare const TDeleteQuery: import("arktype/out/variants/object").ObjectType<{
    guest?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    mine?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    "mine|guest"?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    countTotal?: ((In: "" | "T" | "F") => import("arktype/out/attributes").To<false> | import("arktype/out/attributes").To<true>) | undefined;
    select?: ((In: string) => import("arktype/out/attributes").To<{
        columns?: boolean | Record<string, boolean> | undefined;
        where?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    }>) | undefined;
}, {}>;
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
export {};
//# sourceMappingURL=types.d.ts.map