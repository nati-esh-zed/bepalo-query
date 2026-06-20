import { ArkErrors, scope, type } from "arktype";
import { RJSON } from "@bepalo/rjson";
import {
  getOperators,
  type SQL,
  type InferSelectModel,
  type Operators,
} from "drizzle-orm";
import {
  cancelRequestBody,
  validateAclEntry,
  validateTable,
  getAclRule,
  resolveAclSelector,
  applyBodyTransform,
} from "./utils";

export enum Status {
  _100_Continue = 100,
  _101_SwitchingProtocols = 101,
  _102_Processing = 102,
  _103_EarlyHints = 103,
  _200_OK = 200,
  _201_Created = 201,
  _202_Accepted = 202,
  _203_NonAuthoritativeInformation = 203,
  _204_NoContent = 204,
  _205_ResetContent = 205,
  _206_PartialContent = 206,
  _207_MultiStatus = 207,
  _208_AlreadyReported = 208,
  _226_IMUsed = 226,
  _300_MultipleChoices = 300,
  _301_MovedPermanently = 301,
  _302_Found = 302,
  _303_SeeOther = 303,
  _304_NotModified = 304,
  _305_UseProxy = 305,
  _307_TemporaryRedirect = 307,
  _308_PermanentRedirect = 308,
  _400_BadRequest = 400,
  _401_Unauthorized = 401,
  _402_PaymentRequired = 402,
  _403_Forbidden = 403,
  _404_NotFound = 404,
  _405_MethodNotAllowed = 405,
  _406_NotAcceptable = 406,
  _407_ProxyAuthenticationRequired = 407,
  _408_RequestTimeout = 408,
  _409_Conflict = 409,
  _410_Gone = 410,
  _411_LengthRequired = 411,
  _412_PreconditionFailed = 412,
  _413_PayloadTooLarge = 413,
  _414_URITooLong = 414,
  _415_UnsupportedMediaType = 415,
  _416_RangeNotSatisfiable = 416,
  _417_ExpectationFailed = 417,
  _418_IMATeapot = 418,
  _421_MisdirectedRequest = 421,
  _422_UnprocessableEntity = 422,
  _423_Locked = 423,
  _424_FailedDependency = 424,
  _425_TooEarly = 425,
  _426_UpgradeRequired = 426,
  _428_PreconditionRequired = 428,
  _429_TooManyRequests = 429,
  _431_RequestHeaderFieldsTooLarge = 431,
  _451_UnavailableForLegalReasons = 451,
  _500_InternalServerError = 500,
  _501_NotImplemented = 501,
  _502_BadGateway = 502,
  _503_ServiceUnavailable = 503,
  _504_GatewayTimeout = 504,
  _505_HTTPVersionNotSupported = 505,
  _506_VariantAlsoNegotiates = 506,
  _507_InsufficientStorage = 507,
  _508_LoopDetected = 508,
  _510_NotExtended = 510,
  _511_NetworkAuthenticationRequired = 511,
  _419_PageExpired = 419,
  _420_EnhanceYourCalm = 420,
  _450_BlockedbyWindowsParentalControls = 450,
  _498_InvalidToken = 498,
  _499_TokenRequired = 499,
  _509_BandwidthLimitExceeded = 509,
  _526_InvalidSSLCertificate = 526,
  _529_Siteisoverloaded = 529,
  _530_Siteisfrozen = 530,
  _598_NetworkReadTimeoutError = 598,
  _599_NetworkConnectTimeoutError = 599,
}

/**
 * Standard HTTP methods supported by the router.
 * These methods correspond to HTTP/1.1 request methods.
 *
 * @typedef {"HEAD"|"OPTIONS"|"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} HttpMethod
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

/**
 * Creates a JSON Response.
 * Defaults to status 200 and 'application/json; charset=utf-8' content-type if not specified.
 * Uses Response.json() internally which automatically serializes the body.
 * @param {any} body - The data to serialize as JSON
 * @param {ResponseInit} [init] - Additional response initialization options
 * @returns {Response} A Response object with application/json content-type
 * @example
 * json({ message: "Success" });
 * json({ error: "Not found" }, { status: 404 });
 */
const json = (payload: any, init?: ResponseInit) => {
  return Response.json(payload, init);
};

/**
 * Creates a Response with the specified status code.
 * Defaults to 'text/plain; charset=utf-8' content-type if not provided in init.headers.
 * @param {number} status - The HTTP status code
 * @param {string|null} [content] - The response body content
 * @param {ResponseInit} [init] - Additional response initialization options
 * @returns {Response} A Response object
 * @example
 * status(200, "Success");
 * status(404, "Not Found");
 * status(204, null); // No content response
 */
export const status = (
  status: number,
  content?: string | null,
  init?: ResponseInit,
): Response => {
  return new Response(content !== undefined ? content : null, {
    ...init,
    status,
  });
};

export type Table = {
  _: any;
  $inferSelect: any;
  $inferInsert: any;
  getSQL: any;
};

export class HttpError extends Error {
  status: number = 500;
  constructor(message: string, status: number) {
    super(message);
    this.status = status || 500;
  }
}

export const operators: Operators = getOperators();

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

const QueryScope = scope({
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

const TOptionsQuery = type(
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

type CTXOptionsQuery = {
  query: OptionsQuery;
};

const TGetQuery = type({
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

type CTXGetQuery = {
  query: GetQuery;
};

const TPostQuery = type(
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

type CTXPostQuery = {
  query: PostQuery;
};

export const TPostBody = type(
  "Record<string, unknown>|Record<string, unknown>[]",
);

export type PostBody = typeof TPostBody.infer;

export type CTXPostBody = {
  body: PostBody;
};

const TPatchQuery = type(
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

type CTXPatchQuery = {
  query: PatchQuery;
};

export const TPatchBody = type("Record<string, unknown>");

export type PatchBody = typeof TPatchBody.infer;

export type CTXPatchBody = {
  body: PatchBody;
};

const TDeleteQuery = type(
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

type CTXDeleteQuery = {
  query: DeleteQuery;
};

export enum SurpassMaxLimit {
  Limit = 0,
  Throw,
}

/**
 * Context object containing parsed request body.
 * @type {Object} CTXBody
 * @property {ParsedBody} body - Parsed request body data
 */
export type CTXBody = {
  body: any;
};

/**
 * Supported media types for request body parsing.
 * @type {"application/x-www-form-urlencoded"|"application/json"|"text/plain"} SupportedBodyMediaTypes
 */
export type SupportedBodyMediaTypes =
  | "application/x-www-form-urlencoded"
  | "application/json"
  | "application/rjson";

/**
 * Creates middleware that parses the request body based on Content-Type.
 * Supports url-encoded forms, JSON, and plain text.
 * @param {Object} [options] - Configuration options for body parsing
 * @param {SupportedBodyMediaTypes|SupportedBodyMediaTypes[]} [options.accept] - Media types to accept (defaults to all supported)
 * @param {number} [options.maxSize] - Maximum body size in bytes (defaults to 1MB)
 * @param {number} [options.once] - Do not parse if parsed already. checks `ctx.body`
 * @param {number} [options.clone] - Clone request before parsing it. Useful for forwarding.
 * @returns {Function} A middleware function that adds parsed body to context.body
 * @throws {Response} Returns a 415 response if content-type is not accepted
 * @throws {Response} Returns a 413 response if body exceeds maxSize
 * @throws {Response} Returns a 400 response if body is malformed
 */
export const parseBody = <XContext = Record<string, never>>(options?: {
  accept?: SupportedBodyMediaTypes | SupportedBodyMediaTypes[]; // defaults to all
  maxSize?: number; // in bytes
  once?: boolean;
  clone?: boolean;
}): RequestHandler<XContext & CTXBody> => {
  const accept = options?.accept
    ? Array.isArray(options.accept)
      ? options.accept
      : [options.accept]
    : ([
        "application/x-www-form-urlencoded",
        "application/json",
        "application/rjson",
      ] as string[]);
  const maxSize = options?.maxSize ?? 1024 * 1024; // Default 1MB
  const once = options?.once;
  const clone = options?.clone;
  return async (_req: Request, ctx: XContext & CTXBody) => {
    if (once && ctx.body) return;
    const contentType = _req.headers.get("content-type")?.split(";", 2)[0];
    if (!(contentType && accept.includes(contentType))) {
      await cancelRequestBody(_req);
      return json(
        { error: "Unsupported Media Type" },
        { status: Status._415_UnsupportedMediaType },
      );
    }
    const req = clone ? _req.clone() : _req;
    try {
      const contentLengthHeader = req.headers.get("content-length");
      const contentLength = contentLengthHeader
        ? parseInt(contentLengthHeader)
        : undefined;
      if (contentLength === 0) {
        ctx.body = undefined;
        return;
      }
      if (contentLength !== undefined && contentLength > maxSize) {
        await cancelRequestBody(_req);
        return json(
          { error: "Payload Too Large" },
          { status: Status._413_PayloadTooLarge },
        );
      }
      switch (contentType) {
        case "application/x-www-form-urlencoded": {
          const body = await req.formData();
          ctx.body = {};
          for (const [k, v] of body.entries()) {
            ctx.body[k] = v;
          }
          break;
        }
        case "application/json": {
          ctx.body = await req.json();
          break;
        }
        case "application/rjson":
          ctx.body = RJSON.parse(await req.text());
          break;
        default:
          ctx.body = undefined;
          break;
      }
    } catch {
      await cancelRequestBody(_req);
      return json(
        { error: "Malformed Payload" },
        { status: Status._400_BadRequest },
      );
    }
  };
};

export const createQueryRoute = <
  Role extends string,
  CTXSession extends object,
  XContext = Record<string, never>,
  _Schema extends Record<string, Table | unknown> = Record<
    string,
    Table | unknown
  >,
  Database extends { transaction: any; query: any } = {
    transaction: any;
    query: any;
  },
  Transaction extends InferTransaction<Database> = InferTransaction<Database>,
  Query extends InferQuery<Database> = InferQuery<Database>,
  Schema extends PickTables<_Schema> = PickTables<_Schema>,
>({
  acl,
  schema,
  database,
  idParam,
  onSurpassMaxLimit = SurpassMaxLimit.Throw,
  session,
  defaults,
  onError,
}: {
  acl?: ACL<Role, CTXSession, XContext, Schema, Database, Transaction, Query>;
  schema: _Schema;
  database: Database;
  idParam: string;
  onSurpassMaxLimit?: SurpassMaxLimit;
  session?: {
    parser: RequestHandler<CTXSession & XContext>;
    getRole: (
      req: Request,
      ctx: CTXSession & XContext & CTXACLCommon<Role>,
    ) => Role;
  };
  defaults?: {
    maxDepth?: number;
    maxLimit?: number;
  };
  onError?: { (error: HttpError | Error): void };
}): Routes => {
  /////////////////////////////////////////////////////////
  type CTXCommon = CTXSession &
    XContext &
    CTXACLCommon<Role> & { url: URL; resourceId: string };
  type CTXOptions = CTXCommon & CTXOptionsQuery;
  type CTXGet = CTXCommon &
    CTXGetQuery &
    CTXACLResult<Schema, keyof Schema> & {
      findFirst?: boolean;
    };
  type CTXPost = CTXCommon &
    CTXPostQuery &
    CTXPostBody &
    CTXACLResult<Schema, keyof Schema>;
  type CTXPatch = CTXCommon &
    CTXPatchQuery &
    CTXPatchBody &
    CTXACLResult<Schema, keyof Schema>;
  type CTXDelete = CTXCommon &
    CTXDeleteQuery &
    CTXACLResult<Schema, keyof Schema>;
  /////////////////////////////////////////////////////////
  const parseSession = session?.parser;
  const getRoleFromSession = session?.getRole;
  const defaultResultFormatter: RequestHandler<
    CTXSession &
      XContext &
      CTXACLCommon<Role> &
      CTXACLResult<Schema, keyof Schema>
  > = (_req, { resourceId, findFirst, result }) => {
    const response: any = {};
    if (result) {
      if (result.total !== undefined) {
        response.total = result.total;
      }
      if (result.rowsAffected != null) {
        response.rowsAffected = result.rowsAffected;
      }
      if (findFirst) {
        response[resourceId as string] = result.rows;
      } else {
        response.count = result.count ?? result.rows?.length ?? 0;
        response[resourceId] = result.rows;
      }
    }
    return json(response);
  };
  const deepCombine = (
    result: Record<string, any>,
    resourceId: string,
    tableId: string,
    ctx: CTXSession &
      XContext &
      CTXACLCommon<Role> &
      CTXACLResult<Schema, keyof Schema>,
    acl: any,
    query: any | undefined,
    aclEntry: ACLEntry<
      Role,
      CTXSession & XContext & CTXACLCommon<Role>,
      Schema,
      Database,
      Transaction,
      Query,
      keyof Schema
    >,
    maxDepth?: number,
    depth: number = 0,
  ) => {
    // Max Depth
    {
      if (acl?.maxDepth != null) {
        maxDepth = depth + acl.maxDepth;
      }
      if (maxDepth != null && depth > maxDepth) {
        throw new HttpError(
          `(${resourceId}:${depth}) Max depth surpassed for table '${tableId}'`,
          Status._400_BadRequest,
        );
      }
    }
    const forbidQuery = acl?.forbidQuery;
    // OFFSET & LIMIT
    {
      if (query?.offset != null) {
        if (forbidQuery?.offset) {
          throw new HttpError(
            `(${resourceId}:${depth}) query 'select.offset' forbidden by ACL`,
            Status._400_BadRequest,
          );
        }
        result.offset = query.offset;
      }
      if (query?.limit && forbidQuery?.limit) {
        throw new HttpError(
          `(${resourceId}:${depth}) query 'select.limit' forbidden by ACL`,
          Status._400_BadRequest,
        );
      }
      {
        const aclMaxLimit = acl?.maxLimit;
        const maxLimit =
          aclMaxLimit != null
            ? aclMaxLimit
            : aclMaxLimit === null
              ? undefined
              : aclEntry.maxLimit != null
                ? aclEntry.maxLimit
                : aclEntry.maxLimit === null
                  ? undefined
                  : defaults?.maxLimit;
        if (
          query?.limit > maxLimit &&
          onSurpassMaxLimit === SurpassMaxLimit.Throw
        ) {
          throw new HttpError(
            `(${resourceId}:${depth}) Max limit surpassed for table '${tableId}'`,
            Status._400_BadRequest,
          );
        }
        const limit =
          query?.limit != null
            ? maxLimit != null
              ? Math.min(query.limit, maxLimit)
              : query.limit
            : maxLimit;
        if (limit != null) {
          result.limit = limit;
        }
      }
    }
    // COLUMNS
    if (acl?.select) {
      if (query?.columns != null && forbidQuery?.columns) {
        throw new HttpError(
          `(${resourceId}:${depth}) query 'select.columns' forbidden by ACL`,
          Status._400_BadRequest,
        );
      }
      const queryColumns = typeof query?.columns === "object" && query?.columns;
      const aclColumns = acl.select?.columns;
      const aclMode = acl.select?.mode ?? true;
      const queryBoolean = typeof query?.columns === "boolean";
      const aclBoolean = typeof acl.select === "boolean";
      const queryObject = query?.columns && typeof query.columns === "object";
      const aclObject =
        acl.select?.columns && typeof acl.select.columns === "object";
      if (queryBoolean && aclBoolean) {
        if (query?.columns && !acl.select) {
          throw new HttpError(
            `(${resourceId}:${depth}) Column selection forbidden by ACL`,
            Status._400_BadRequest,
          );
        }
        result.columns = (acl.select ?? true) && (query?.columns ?? true);
      } else if (queryBoolean) {
        if (query.columns) {
          if (aclObject) {
            result.columns = {};
            for (const k of aclColumns.keys()) {
              result.columns[k] = aclMode;
            }
          } else {
            result.columns = true;
          }
        } else {
          result.columns = false;
        }
      } else if (aclBoolean) {
        if (acl.select) {
          result.columns = queryObject ? { ...queryColumns } : true;
        } else {
          result.columns = false;
        }
      } else if (queryObject && aclObject) {
        result.columns = {};
        const entries = Object.entries(queryColumns);
        const mode = entries.length > 0 && entries[0][1];
        if (mode) {
          for (const [k, v] of entries) {
            if (v && (aclMode ? !aclColumns.has(k) : aclColumns.has(k))) {
              throw new HttpError(
                `(${resourceId}:${depth}) forbidden query field '${k}' of table '${tableId}'`,
                400,
              );
            }
            result.columns[k] = v;
          }
        } else if (aclMode) {
          for (const k of aclColumns.keys()) {
            if (queryColumns[k]) {
              result.columns[k] = true;
            }
          }
        } else {
          for (const [k, v] of entries) {
            if (!v) {
              result.columns[k] = false;
            }
          }
          for (const k of aclColumns.keys()) {
            result.columns[k] = false;
          }
        }
      } else if (queryColumns) {
        result.columns = queryObject ? { ...queryColumns } : queryColumns;
      } else if (aclColumns) {
        if (aclObject) {
          result.columns = {};
          for (const k of aclColumns.keys()) {
            result.columns[k] = aclMode;
          }
        } else {
          result.columns = true;
        }
      }
      if (result.columns === true) {
        result.columns = undefined;
      }
    } else {
      throw new HttpError(
        `(${resourceId}:${depth}) query 'select.columns' disabled by ACL`,
        Status._400_BadRequest,
      );
    }
    // EXTRAS
    if (acl?.extras) {
      result.extras = acl.extras;
    }
    // WHERE
    if (query?.where) {
      if (forbidQuery?.where) {
        throw new HttpError(
          `(${resourceId}:${depth}) query 'select.where' forbidden by ACL`,
          Status._400_BadRequest,
        );
      }
      const isArray = Array.isArray(query.where);
      const sWhere = isArray
        ? ([...query.where].map((e) => Object.entries(e)) as [string, any][][])
        : (Object.entries({ ...query.where }) as [string, any][]);
      result.where = (table: any, operators: any) => {
        let w = isArray
          ? operators.or(
              ...sWhere.map((orWhere: [string, any][]) =>
                operators.and(
                  ...orWhere.map(([key, value]) => {
                    let [field, operator] = key.split(".", 2) as [
                      string,
                      string,
                    ];
                    if (!(field in table)) {
                      throw new HttpError(
                        `(${resourceId}:${depth}) Invalid column in where condition '${field}' here '${key}'`,
                        Status._400_BadRequest,
                      );
                    }
                    const fieldSel = table[field];
                    if (!operator) operator = "eq";
                    const op = operators[operator];
                    if (!op) {
                      throw new HttpError(
                        `(${resourceId}:${depth}) Invalid operator in where condition '${operator}' here '${key}'`,
                        Status._400_BadRequest,
                      );
                    }
                    return op(
                      fieldSel,
                      fieldSel.dataType === "date" ? new Date(value) : value,
                    );
                  }),
                ),
              ),
            )
          : operators.and(
              acl?.where && acl.where(ctx, table, operators),
              ...sWhere.map(([key, value]) => {
                let [field, operator] = (key as string).split(".", 2) as [
                  string,
                  string,
                ];
                if (!(field in table)) {
                  throw new HttpError(
                    `(${resourceId}:${depth}) Invalid column in where condition '${field}' here '${key}'`,
                    Status._400_BadRequest,
                  );
                }
                const fieldSel = table[field];
                if (!operator) operator = "eq";
                const op = operators[operator];
                if (!op) {
                  throw new HttpError(
                    `(${resourceId}:${depth}) Invalid operator in where condition '${operator}' here '${key}'`,
                    Status._400_BadRequest,
                  );
                }
                return op(
                  fieldSel,
                  fieldSel.dataType === "date" ? new Date(value) : value,
                );
              }),
            );
        if (isArray && acl?.where) {
          w = operators.and(acl.where(ctx, table, operators), w);
        }
        return w;
      };
    } else if (acl?.where) {
      result.where = (table: any, operators: any) =>
        acl.where(ctx, table, operators);
    }
    //  ORDER BY
    if (query?.orderBy) {
      if (forbidQuery?.orderBy) {
        throw new HttpError(
          `(${resourceId}:${depth}) query 'select.orderBy' forbidden by ACL`,
          Status._400_BadRequest,
        );
      }
      const orderBy = Object.entries({ ...query.orderBy });
      result.orderBy = (table: any, operators: any) =>
        orderBy.map(([field, opname]) => {
          const targetField = table[field as keyof typeof table];
          if (!targetField) {
            throw new HttpError(
              `(${resourceId}:${depth}) invalid column '${field}' of table '${tableId}'`,
              400,
            );
          }
          const op =
            opname === 1 || opname === "asc" ? operators.asc : operators.desc;
          return op(targetField);
        });
    } else if (acl?.orderBy) {
      const orderBy = Object.entries({ ...acl.orderBy });
      result.orderBy = (table: any, operators: any) =>
        orderBy.map(([field, opname]) => {
          const targetField = table[field as keyof typeof table];
          if (!targetField) {
            throw new HttpError(
              `(${resourceId}:${depth}) invalid column '${field}' of table '${tableId}'`,
              400,
            );
          }
          const op =
            (opname as string).charAt(0) === "1" ||
            (opname as string).charAt(0) === "a"
              ? operators.asc
              : operators.desc;
          return op(targetField);
        });
    }
    if (query?.with) {
      if (forbidQuery?.with) {
        throw new HttpError(
          `(${resourceId}:${depth}) query 'select.with' forbidden by ACL`,
          Status._400_BadRequest,
        );
      }
      result.with = {};
      for (const [joinedTableId, selector] of Object.entries(
        query.with as Record<string, any>,
      )) {
        if (!selector) {
          continue;
        }
        if (acl?.with && !acl.with[joinedTableId]) {
          throw new HttpError(
            `(${resourceId}:${depth}) Join of '${joinedTableId}' forbidden by ACL`,
            Status._400_BadRequest,
          );
        }
        result.with[joinedTableId] = {};
        deepCombine(
          result.with[joinedTableId],
          resourceId,
          joinedTableId,
          ctx,
          acl?.with && acl.with[joinedTableId],
          selector,
          aclEntry,
          maxDepth,
          depth + 1,
        );
      }
    }
    return result;
  };
  const parseAuth: RequestHandler<
    CTXSession & XContext & CTXACLCommon<Role>
  > = async (req, ctx) => {
    if (parseSession) {
      const res = await parseSession(req, ctx);
      if (res instanceof Response) {
        return res;
      }
      ctx.userRole = getRoleFromSession && getRoleFromSession(req, ctx);
    }
  };

  const routes: Routes = {};
  //
  ///// OPTIONS
  //
  routes.OPTIONS = async (req): Promise<Response> => {
    try {
      const resourceId = req.params[idParam] as keyof Query as string;
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};
      for (const [k, v] of url.searchParams.entries()) {
        queryParams[k] = v;
      }
      const query = TOptionsQuery(queryParams);
      if (query instanceof ArkErrors) {
        return json(
          {
            error: query.toString() || "Something went wrong",
          },
          {
            status: Status._400_BadRequest,
          },
        );
      }
      const ctx = {
        url,
        query,
        resourceId,
      } as NonNullable<CTXOptions>;
      // PARSE SESSION AND AUTHENTICATE
      {
        const res = await parseAuth(req, ctx);
        if (res instanceof Response) {
          return res;
        }
      }
      const aclEntry:
        | ACLEntry<
            Role,
            CTXSession & XContext & CTXACLCommon<Role>,
            Schema,
            Database,
            Transaction,
            Query,
            keyof Schema
          >
        | undefined =
        acl &&
        (acl[resourceId as keyof typeof acl] as ACLEntry<
          Role,
          CTXSession & XContext & CTXACLCommon<Role>,
          Schema,
          Database,
          Transaction,
          Query,
          keyof Schema
        >);
      if (aclEntry == null) {
        return status(Status._404_NotFound, null);
      }
      const tableId = aclEntry.table;
      const table = (schema as unknown as Schema)[tableId as keyof Schema];
      if (table == null) {
        return status(Status._404_NotFound, null);
      }
      const tablePermissions = aclEntry.control;
      const userRole = ctx.userRole;
      let allowedMethods;
      if (query["mine|guest"]) {
        allowedMethods = Object.entries(tablePermissions)
          .filter(
            userRole
              ? ([, perm]) =>
                  perm[userRole] || perm.mine || perm.all || perm.guest
              : ([, perm]) => perm.guest,
          )
          .map(([method]) => method);
      } else if (query.guest) {
        allowedMethods = Object.entries(tablePermissions)
          .filter(([, perm]) => perm.guest)
          .map(([method]) => method);
      } else if (query.mine) {
        allowedMethods = Object.entries(tablePermissions)
          .filter(([, perm]) => perm.mine)
          .map(([method]) => method);
      } else if (userRole) {
        allowedMethods = Object.entries(tablePermissions)
          .filter(([, perm]) => perm[userRole] || perm.mine || perm.all)
          .map(([method]) => method);
      } else {
        allowedMethods = Object.entries(tablePermissions)
          .filter(([, perm]) => perm.guest)
          .map(([method]) => method);
      }
      const headers = new Headers();
      if (allowedMethods.length > 0) {
        if (allowedMethods.includes("GET")) {
          headers.append("Allow", `OPTIONS,HEAD,${allowedMethods.join(",")}`);
        } else {
          headers.append("Allow", `OPTIONS,${allowedMethods.join(",")}`);
        }
      } else {
        headers.append("Allow", `OPTIONS`);
      }
      return status(Status._204_NoContent, null, {
        headers,
      });
    } catch (error) {
      return json(
        {
          error:
            (error as { cause: string }).cause ||
            (error as HttpError).message ||
            "Something went wrong",
        },
        {
          status:
            (error as HttpError).status || Status._500_InternalServerError,
        },
      );
    }
  };
  //
  ///// GET
  //
  routes.GET = async (req): Promise<Response> => {
    try {
      const resourceId = req.params[idParam] as keyof Query as string;
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};
      for (const [k, v] of url.searchParams.entries()) {
        queryParams[k] = v;
      }
      const query = TGetQuery(queryParams);
      if (query instanceof ArkErrors) {
        return json(
          {
            error: query.toString() || "Something went wrong",
          },
          {
            status: Status._400_BadRequest,
          },
        );
      }
      const ctx = {
        url,
        query,
        resourceId,
      } as NonNullable<CTXGet>;
      // PARSE SESSION AND AUTHENTICATE
      {
        const res = await parseAuth(req, ctx);
        if (res instanceof Response) {
          return res;
        }
      }
      const { select } = query;
      const aclEntry:
        | ACLEntry<
            Role,
            CTXSession & XContext & CTXACLCommon<Role>,
            Schema,
            Database,
            Transaction,
            Query,
            keyof Schema
          >
        | undefined =
        acl &&
        (acl[resourceId as keyof typeof acl] as ACLEntry<
          Role,
          CTXSession & XContext & CTXACLCommon<Role>,
          Schema,
          Database,
          Transaction,
          Query,
          keyof Schema
        >);
      if (aclEntry == null) {
        return req.method === "HEAD"
          ? status(Status._404_NotFound, null)
          : json(
              {
                error: "Resource not found",
              },
              {
                status: Status._404_NotFound,
              },
            );
        // throw new HttpError("Resource not found", Status._404_NotFound);
      }
      const aclRule = aclEntry.control.GET;
      if (aclRule == null) {
        return req.method === "HEAD"
          ? status(Status._404_NotFound, null)
          : json(
              {
                error: "ACL rule not defined for the method for the method",
              },
              {
                status: Status._404_NotFound,
              },
            );
      }
      const aclSelector =
        (query["mine|guest"]
          ? ((ctx.userRole && (aclRule[ctx.userRole] ?? aclRule.mine)) ??
            aclRule.guest)
          : query.guest
            ? aclRule.guest
            : ctx.userRole
              ? (aclRule[ctx.userRole] ?? aclRule.mine)
              : aclRule.guest) ?? aclRule.all;
      if (!aclSelector) {
        return json(
          {
            error: "Resource forbidden",
          },
          {
            status: Status._403_Forbidden,
          },
        );
      }
      if (
        query.findFirst != null &&
        aclEntry.findFirst != null &&
        query.findFirst !== aclEntry.findFirst
      ) {
        return json(
          {
            error: query.findFirst
              ? "find first forbidden by ACL"
              : "find many forbidden by ACL",
          },
          {
            status: Status._403_Forbidden,
          },
        );
      }
      ctx.findFirst = aclEntry.findFirst ?? query.findFirst;
      const tableId = (aclEntry.table as string) || resourceId;
      const selector: Record<string, unknown> = {};
      try {
        deepCombine(
          selector,
          resourceId,
          tableId,
          ctx,
          aclSelector,
          select,
          aclEntry,
          aclEntry.maxDepth != null
            ? aclEntry.maxDepth
            : aclEntry.maxDepth === null
              ? undefined
              : defaults?.maxDepth,
        );
      } catch (error) {
        return json(
          {
            error: (error as HttpError).message || "Something went wrong",
          },
          {
            status: (error as HttpError).status || Status._400_BadRequest,
          },
        );
      }
      const formatResult =
        aclSelector.formatResult ??
        aclEntry.formatResult ??
        defaultResultFormatter;
      try {
        const result = await database.transaction(
          async (tx: Transaction | any) => {
            (ctx as typeof ctx & CTXTX<Transaction>).tx = tx;
            if (aclSelector.beforeQuery) {
              await aclSelector.beforeQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            const table = (schema as unknown as Schema)[
              tableId as keyof Schema
            ];
            const columns = (selector as any).columns;
            const extras = (selector as any).extras;
            if (columns === true) {
              selector.columns = undefined;
            }
            const selecting =
              columns !== false ||
              typeof columns === "object" ||
              typeof extras == "object";
            const result: any = {
              rows: null,
            };
            if (selecting) {
              // selector.columns = undefined;
              result.rows = ctx.findFirst
                ? await tx.query[tableId].findFirst(selector)
                : await tx.query[tableId].findMany(selector);
            } else {
              const count = await tx.$count(
                table,
                selector.where &&
                  (selector.where as (...args: any[]) => any)(table, operators),
              );
              const offset = (selector as any).offset ?? 0;
              const limit = (selector as any).limit;
              result.count = limit
                ? Math.min(limit, count - offset)
                : count - offset;
            }
            const countTotal = query.countTotal ?? aclEntry.countTotal;
            if (countTotal) {
              const total = await tx.$count(
                table,
                aclSelector.where && aclSelector.where(ctx, table, operators),
              );
              result.total = total;
            }
            if (aclSelector.afterQuery) {
              await aclSelector.afterQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            return result;
          },
        );
        ctx.result = result;
        const res = formatResult(req, ctx);
        return res instanceof Response ? res : status(Status._204_NoContent);
      } catch (error) {
        if (aclSelector.onQueryError) {
          const res = await aclSelector.onQueryError(
            error instanceof Error ? error : new Error(String(error)),
            ctx as typeof ctx & CTXTX<Transaction>,
          );
          if (res instanceof Response) {
            return res;
          }
        }
        throw error;
      }
    } catch (error) {
      onError && onError(error as HttpError | Error);
      return json(
        {
          error:
            (error as { cause: string }).cause ||
            (error as HttpError).message ||
            "Something went wrong",
        },
        {
          status:
            (error as HttpError).status || Status._500_InternalServerError,
        },
      );
    }
  };
  //
  ///// HEAD
  //
  routes.HEAD = routes.GET;
  //
  ///// POST
  //
  routes.POST = async (req): Promise<Response> => {
    try {
      const resourceId = req.params[idParam] as keyof Query as string;
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};
      for (const [k, v] of url.searchParams.entries()) {
        queryParams[k] = v;
      }
      const query = TPostQuery(queryParams);
      if (query instanceof ArkErrors) {
        return json(
          {
            error: query.toString() || "Something went wrong",
          },
          {
            status: Status._400_BadRequest,
          },
        );
      }
      const ctx = {
        url,
        query,
        body: undefined,
        resourceId,
      } as NonNullable<CTXPost & CTXBody>;
      // PARSE SESSION AND AUTHENTICATE
      {
        const res = await parseAuth(req, ctx);
        if (res instanceof Response) {
          return res;
        }
      }
      const { select } = query;
      const aclEntry:
        | ACLEntry<
            Role,
            CTXSession & XContext & CTXACLCommon<Role>,
            Schema,
            Database,
            Transaction,
            Query,
            keyof Schema
          >
        | undefined =
        acl &&
        (acl[resourceId as keyof typeof acl] as ACLEntry<
          Role,
          CTXSession & XContext & CTXACLCommon<Role>,
          Schema,
          Database,
          Transaction,
          Query,
          keyof Schema
        >);
      if (!validateAclEntry(aclEntry)) {
        return json(
          {
            error: "Resource not found",
          },
          {
            status: Status._404_NotFound,
          },
        );
      }
      const aclRule = getAclRule(aclEntry, "POST");
      if (aclRule == null) {
        return json(
          {
            error: "ACL rule not defined for the method",
          },
          {
            status: Status._404_NotFound,
          },
        );
      }
      const aclSelector = resolveAclSelector(aclRule, ctx.userRole, query);
      if (!aclSelector) {
        return json(
          {
            error: "Resource forbidden",
          },
          {
            status: Status._403_Forbidden,
          },
        );
      }
      // Parse body
      {
        const res = await parseBody<CTXPost>({
          accept: [
            "application/json",
            "application/x-www-form-urlencoded",
            "application/rjson",
          ],
          maxSize: 4 * 1024 * 1024,
        })(req, ctx);
        if (res instanceof Response) {
          return res;
        }
      }
      const tableId = (aclEntry.table as string) || resourceId;
      const selector: Record<string, unknown> = {};
      try {
        deepCombine(
          selector,
          resourceId,
          tableId,
          ctx,
          aclSelector,
          select,
          aclEntry,
          aclEntry.maxDepth != null
            ? aclEntry.maxDepth
            : aclEntry.maxDepth === null
              ? undefined
              : defaults?.maxDepth,
        );
      } catch (error) {
        return json(
          {
            error: (error as HttpError).message || "Something went wrong",
          },
          {
            status: (error as HttpError).status || Status._400_BadRequest,
          },
        );
      }
      const formatResult = aclEntry.formatResult ?? defaultResultFormatter;
      try {
        const result = await database.transaction(
          async (tx: Transaction | any) => {
            (ctx as typeof ctx & CTXTX<Transaction>).tx = tx;
            let body: Record<string, unknown> | Record<string, unknown>[] =
              ctx.body;
            const validateBody = aclSelector.validateBody;
            const injectBody = aclSelector.injectBody;
            body = await applyBodyTransform(
              body,
              validateBody,
              injectBody,
              ctx,
              HttpError,
              Status._400_BadRequest,
            );
            ctx.body = body;
            if (aclSelector.beforeQuery) {
              await aclSelector.beforeQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            const table = (schema as unknown as Schema)[
              tableId as keyof Schema
            ];
            const result: any = { rows: null };
            if (selector.columns === undefined) {
              selector.columns = true;
            }
            if (selector.columns) {
              const columns: Record<string, Table[keyof Table]> = {};
              if (selector.columns === true) {
                for (const k in table) {
                  if (k[0] !== "_") {
                    columns[k] = table[k as keyof typeof table];
                  }
                }
              } else {
                const columnEntries = Object.entries(selector.columns);
                const mode = columnEntries.length > 0 && columnEntries[0][1];
                if (mode) {
                  for (const [k, v] of columnEntries) {
                    if (v && k[0] !== "_") {
                      if (!Object.prototype.hasOwnProperty.call(table, k)) {
                        throw new HttpError(
                          `(${resourceId}) Invalid column '${k}' in select query of table '${tableId}'`,
                          Status._400_BadRequest,
                        );
                      }
                      columns[k] = table[k as keyof typeof table];
                    }
                  }
                } else {
                  for (const k in table) {
                    if (
                      k[0] !== "_" &&
                      (selector.columns as any)[k] !== false
                    ) {
                      columns[k] = table[k as keyof typeof table];
                    }
                  }
                }
              }
              result.rows = await tx
                .insert(table)
                .values(ctx.body)
                .returning(columns);
              result.count = result.rows.length;
            } else {
              const info = await tx.insert(table).values(ctx.body);
              result.rowsAffected = info.rowsAffected;
            }
            const countTotal = query.countTotal ?? aclEntry.countTotal;
            if (countTotal) {
              const total = await tx.$count(
                table,
                aclSelector.where && aclSelector.where(ctx, table, operators),
              );
              result.total = total;
            }
            if (aclSelector.afterQuery) {
              await aclSelector.afterQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            return result;
          },
        );
        ctx.result = result;
        const res = formatResult(req, ctx as typeof ctx & CTXTX<Transaction>);
        return res instanceof Response ? res : status(Status._204_NoContent);
      } catch (error) {
        if (aclSelector.onQueryError) {
          const res = await aclSelector.onQueryError(
            error instanceof Error ? error : new Error(String(error)),
            ctx as typeof ctx & CTXTX<Transaction>,
          );
          if (res instanceof Response) {
            return res;
          }
        }
        throw error;
      }
    } catch (error) {
      onError && onError(error as HttpError | Error);
      return json(
        {
          error:
            (error as { cause: string }).cause ||
            (error as HttpError).message ||
            "Something went wrong",
        },
        {
          status:
            (error as HttpError).status || Status._500_InternalServerError,
        },
      );
    }
  };
  //
  ///// PATCH
  //
  routes.PATCH = async (req): Promise<Response> => {
    try {
      const resourceId = req.params[idParam] as keyof Query as string;
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};
      for (const [k, v] of url.searchParams.entries()) {
        queryParams[k] = v;
      }
      const query = TPatchQuery(queryParams);
      if (query instanceof ArkErrors) {
        return json(
          {
            error: query.toString() || "Something went wrong",
          },
          {
            status: Status._400_BadRequest,
          },
        );
      }
      const ctx = {
        url,
        query,
        body: undefined,
        resourceId,
      } as NonNullable<CTXPatch> & CTXBody;
      // PARSE SESSION AND AUTHENTICATE
      {
        const res = await parseAuth(req, ctx);
        if (res instanceof Response) {
          return res;
        }
      }
      const { select } = query;
      const aclEntry:
        | ACLEntry<
            Role,
            CTXSession & XContext & CTXACLCommon<Role>,
            Schema,
            Database,
            Transaction,
            Query,
            keyof Schema
          >
        | undefined =
        acl &&
        (acl[resourceId as keyof typeof acl] as ACLEntry<
          Role,
          CTXSession & XContext & CTXACLCommon<Role>,
          Schema,
          Database,
          Transaction,
          Query,
          keyof Schema
        >);
      if (!validateAclEntry(aclEntry)) {
        return json(
          {
            error: "Resource not found",
          },
          {
            status: Status._404_NotFound,
          },
        );
      }
      const aclRule = getAclRule(aclEntry, "PATCH");
      if (aclRule == null) {
        return json(
          {
            error: "ACL rule not defined for the method",
          },
          {
            status: Status._404_NotFound,
          },
        );
      }
      const aclSelector = resolveAclSelector(aclRule, ctx.userRole, query);
      if (!aclSelector) {
        return json(
          {
            error: "Resource forbidden",
          },
          {
            status: Status._403_Forbidden,
          },
        );
      }
      // Parse body
      {
        const res = await parseBody<CTXPatch>({
          accept: [
            "application/json",
            "application/x-www-form-urlencoded",
            "application/rjson",
          ],
          maxSize: 4 * 1024 * 1024,
        })(req, ctx);
        if (res instanceof Response) {
          return res;
        }
      }
      const tableId = (aclEntry.table as string) || resourceId;
      const selector: Record<string, unknown> = {};
      try {
        deepCombine(
          selector,
          resourceId,
          tableId,
          ctx,
          aclSelector,
          select,
          aclEntry,
          aclEntry.maxDepth != null
            ? aclEntry.maxDepth
            : aclEntry.maxDepth === null
              ? undefined
              : defaults?.maxDepth,
        );
      } catch (error) {
        return json(
          {
            error: (error as HttpError).message || "Something went wrong",
          },
          {
            status: (error as HttpError).status || Status._400_BadRequest,
          },
        );
      }
      const formatResult = aclEntry.formatResult ?? defaultResultFormatter;
      try {
        const result = await database.transaction(
          async (tx: Transaction | any) => {
            (ctx as typeof ctx & CTXTX<Transaction>).tx = tx;
            let body: Record<string, unknown> = ctx.body;
            const validateBody = aclSelector.validateBody;
            const injectBody = aclSelector.injectBody;
            body = await applyBodyTransform(
              body,
              validateBody,
              injectBody,
              ctx,
              HttpError,
              Status._400_BadRequest,
            );
            ctx.body = body;
            if (aclSelector.beforeQuery) {
              await aclSelector.beforeQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            const table = (schema as unknown as Schema)[
              tableId as keyof Schema
            ];
            const result: any = { rows: null };
            if (selector.columns === undefined) {
              selector.columns = true;
            }
            if (selector.columns) {
              const columns: Record<string, Table[keyof Table]> = {};
              if (selector.columns === true) {
                for (const k in table) {
                  if (k[0] !== "_") {
                    columns[k] = table[k as keyof typeof table];
                  }
                }
              } else {
                const columnEntries = Object.entries(selector.columns);
                const mode = columnEntries.length > 0 && columnEntries[0][1];
                if (mode) {
                  for (const [k, v] of columnEntries) {
                    if (v && k[0] !== "_") {
                      if (!Object.prototype.hasOwnProperty.call(table, k)) {
                        throw new HttpError(
                          `(${resourceId}) Invalid column '${k}' in select query of table '${tableId}'`,
                          Status._400_BadRequest,
                        );
                      }
                      columns[k] = table[k as keyof typeof table];
                    }
                  }
                } else {
                  for (const k in table) {
                    if (
                      k[0] !== "_" &&
                      (selector.columns as any)[k] !== false
                    ) {
                      columns[k] = table[k as keyof typeof table];
                    }
                  }
                }
              }
              result.rows = await tx
                .update(table)
                .set(ctx.body)
                .where(
                  selector.where &&
                    (selector.where as (...args: any[]) => any)(
                      table,
                      operators,
                    ),
                )
                .returning(columns);
            } else {
              const info = await tx
                .update(table)
                .set(ctx.body)
                .where(
                  selector.where &&
                    (selector.where as (...args: any[]) => any)(
                      table,
                      operators,
                    ),
                );
              result.rowsAffected = info.rowsAffected;
            }
            const countTotal = query.countTotal ?? aclEntry.countTotal;
            if (countTotal) {
              const total = await tx.$count(
                table,
                aclSelector.where && aclSelector.where(ctx, table, operators),
              );
              result.total = total;
            }
            if (aclSelector.afterQuery) {
              await aclSelector.afterQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            return result;
          },
        );
        ctx.result = result;
        const res = formatResult(req, ctx as typeof ctx & CTXTX<Transaction>);
        return res instanceof Response ? res : status(Status._204_NoContent);
      } catch (error) {
        if (aclSelector.onQueryError) {
          const res = await aclSelector.onQueryError(
            error instanceof Error ? error : new Error(String(error)),
            ctx as typeof ctx & CTXTX<Transaction>,
          );
          if (res instanceof Response) {
            return res;
          }
        }
        throw error;
      }
    } catch (error) {
      onError && onError(error as HttpError | Error);
      return json(
        {
          error:
            (error as { cause: string }).cause ||
            (error as HttpError).message ||
            "Something went wrong",
        },
        {
          status:
            (error as HttpError).status || Status._500_InternalServerError,
        },
      );
    }
  };
  //
  ///// DELETE
  //
  routes.DELETE = async (req): Promise<Response> => {
    try {
      const resourceId = req.params[idParam] as keyof Query as string;
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};
      for (const [k, v] of url.searchParams.entries()) {
        queryParams[k] = v;
      }
      const query = TDeleteQuery(queryParams);
      if (query instanceof ArkErrors) {
        return json(
          {
            error: query.toString() || "Something went wrong",
          },
          {
            status: Status._400_BadRequest,
          },
        );
      }
      const ctx = {
        url,
        query,
        resourceId,
      } as NonNullable<CTXDelete> & CTXBody;
      // PARSE SESSION AND AUTHENTICATE
      {
        const res = await parseAuth(req, ctx);
        if (res instanceof Response) {
          return res;
        }
      }
      const { select } = query;
      const aclEntry:
        | ACLEntry<
            Role,
            CTXSession & XContext & CTXACLCommon<Role>,
            Schema,
            Database,
            Transaction,
            Query,
            keyof Schema
          >
        | undefined =
        acl &&
        (acl[resourceId as keyof typeof acl] as ACLEntry<
          Role,
          CTXSession & XContext & CTXACLCommon<Role>,
          Schema,
          Database,
          Transaction,
          Query,
          keyof Schema
        >);
      if (aclEntry == null) {
        return json(
          {
            error: "Resource not found",
          },
          {
            status: Status._404_NotFound,
          },
        );
      }
      const aclRule = aclEntry.control.DELETE;
      if (aclRule == null) {
        return json(
          {
            error: "ACL rule not defined for the method",
          },
          {
            status: Status._404_NotFound,
          },
        );
      }
      const aclSelector =
        (query["mine|guest"]
          ? ((ctx.userRole && (aclRule[ctx.userRole] ?? aclRule.mine)) ??
            aclRule.guest)
          : query.guest
            ? aclRule.guest
            : ctx.userRole
              ? (aclRule[ctx.userRole] ?? aclRule.mine)
              : aclRule.guest) ?? aclRule.all;
      if (!aclSelector) {
        return json(
          {
            error: "Resource forbidden",
          },
          {
            status: Status._403_Forbidden,
          },
        );
      }
      const tableId = (aclEntry.table as string) || resourceId;
      const selector: Record<string, unknown> = {};
      try {
        deepCombine(
          selector,
          resourceId,
          tableId,
          ctx,
          aclSelector,
          select,
          aclEntry,
          aclEntry.maxDepth != null
            ? aclEntry.maxDepth
            : aclEntry.maxDepth === null
              ? undefined
              : defaults?.maxDepth,
        );
      } catch (error) {
        return json(
          {
            error: (error as HttpError).message || "Something went wrong",
          },
          {
            status: (error as HttpError).status || Status._400_BadRequest,
          },
        );
      }
      const formatResult = aclEntry.formatResult ?? defaultResultFormatter;
      try {
        const result = await database.transaction(
          async (tx: Transaction | any) => {
            (ctx as typeof ctx & CTXTX<Transaction>).tx = tx;
            if (aclSelector.beforeQuery) {
              await aclSelector.beforeQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            const table = (schema as unknown as Schema)[
              tableId as keyof Schema
            ];
            const result: any = { rows: null };
            if (selector.columns === undefined) {
              selector.columns = true;
            }
            if (selector.columns) {
              const columns: Record<string, Table[keyof Table]> = {};
              if (selector.columns === true) {
                for (const k in table) {
                  if (k[0] !== "_") {
                    columns[k] = table[k as keyof typeof table];
                  }
                }
              } else {
                const columnEntries = Object.entries(selector.columns);
                const mode = columnEntries.length > 0 && columnEntries[0][1];
                if (mode) {
                  for (const [k, v] of columnEntries) {
                    if (v && k[0] !== "_") {
                      if (!Object.prototype.hasOwnProperty.call(table, k)) {
                        throw new HttpError(
                          `(${resourceId}) Invalid column '${k}' in select query of table '${tableId}'`,
                          Status._400_BadRequest,
                        );
                      }
                      columns[k] = table[k as keyof typeof table];
                    }
                  }
                } else {
                  for (const k in table) {
                    if (
                      k[0] !== "_" &&
                      (selector.columns as any)[k] !== false
                    ) {
                      columns[k] = table[k as keyof typeof table];
                    }
                  }
                }
              }
              result.rows = await tx
                .delete(table)
                .where(
                  selector.where &&
                    (selector.where as (...args: any[]) => any)(
                      table,
                      operators,
                    ),
                )
                .returning(columns);
            } else {
              const info = await tx
                .delete(table)
                .where(
                  selector.where &&
                    (selector.where as (...args: any[]) => any)(
                      table,
                      operators,
                    ),
                );
              result.rowsAffected = info.rowsAffected;
            }
            const countTotal = query.countTotal ?? aclEntry.countTotal;
            if (countTotal) {
              const total = await tx.$count(
                table,
                aclSelector.where && aclSelector.where(ctx, table, operators),
              );
              result.total = total;
            }
            if (aclSelector.afterQuery) {
              await aclSelector.afterQuery(
                ctx as typeof ctx & CTXTX<Transaction>,
              );
            }
            return result;
          },
        );
        ctx.result = result;
        const res = formatResult(req, ctx as typeof ctx & CTXTX<Transaction>);
        return res instanceof Response ? res : status(Status._204_NoContent);
      } catch (error) {
        if (aclSelector.onQueryError) {
          const res = await aclSelector.onQueryError(
            error instanceof Error ? error : new Error(String(error)),
            ctx as typeof ctx & CTXTX<Transaction>,
          );
          if (res instanceof Response) {
            return res;
          }
        }
        throw error;
      }
    } catch (error) {
      onError && onError(error as HttpError | Error);
      return json(
        {
          error:
            (error as { cause: string }).cause ||
            (error as HttpError).message ||
            "Something went wrong",
        },
        {
          status:
            (error as HttpError).status || Status._500_InternalServerError,
        },
      );
    }
  };
  return routes;
};
