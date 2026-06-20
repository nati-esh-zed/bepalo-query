import { ArkErrors } from "arktype";
import {
  type CTXACLCommon,
  type CTXACLResult,
  type CTXBody,
  type CTXDeleteQuery,
  type CTXGetQuery,
  type CTXOptionsQuery,
  type CTXPatchBody,
  type CTXPatchQuery,
  type CTXPostBody,
  type CTXPostQuery,
  type InferQuery,
  type InferTransaction,
  type PickTables,
  type RequestHandler,
  type Routes,
  type Table,
  type ACL,
  type ACLEntry,
  TOptionsQuery,
  TGetQuery,
  CTXTX,
  TPostQuery,
  TPatchQuery,
  TDeleteQuery,
} from "./types.ts";

import {
  json,
  status,
  Status,
  SurpassMaxLimit,
  HttpError,
  operators,
  parseBody,
} from "./utils.ts";

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
      const aclRule = aclEntry.control.POST;
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
            if (validateBody != null) {
              if (Array.isArray(body)) {
                for (let i = 0; i < body.length; i++) {
                  const vb = await validateBody(
                    body[i] as Record<string, unknown>,
                    ctx,
                  );
                  if (vb instanceof ArkErrors) {
                    throw new HttpError(vb.toString(), Status._400_BadRequest);
                  }
                  body[i] = vb;
                }
              } else {
                const vb = await validateBody(body, ctx);
                if (vb instanceof ArkErrors) {
                  throw new HttpError(vb.toString(), Status._400_BadRequest);
                  // throw vb;
                }
                body = vb;
              }
            }
            if (injectBody != null) {
              if (Array.isArray(body)) {
                for (let i = 0; i < body.length; i++) {
                  const vb = await injectBody(
                    body[i] as Record<string, unknown>,
                    ctx,
                  );
                  if (vb != null) body[i] = vb as Record<string, unknown>;
                }
              } else {
                const vb = await injectBody(body, ctx);
                if (vb != null) body = vb as Record<string, unknown>;
              }
            }
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
      const aclRule = aclEntry.control.PATCH;
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
            if (validateBody != null) {
              const vb = await validateBody(body, ctx);
              if (vb instanceof ArkErrors) {
                throw new HttpError(vb.toString(), Status._400_BadRequest);
              }
              body = vb;
            }
            if (injectBody != null) {
              const vb = await injectBody(body, ctx);
              if (vb != null) body = vb as Record<string, unknown>;
            }
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
