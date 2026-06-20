import { RJSON } from "@bepalo/rjson";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  DeleteQuery,
  GetQuery,
  InferQueryRelations,
  PatchQuery,
  PickTables,
  PostQuery,
  SelectorDelete,
  SelectorGet,
  SelectorPatch,
  SelectorPost,
  Table,
} from "./types.ts";

export type { PickTables } from "./types.ts";

type InferSelect<T extends Table | unknown> = T extends Table
  ? InferSelectModel<T>
  : never;

export type InferSelectModels<Schema extends Record<string, Table | unknown>> =
  {
    [K in keyof Schema as Schema[K] extends Table ? K : never]: InferSelect<
      Schema[K]
    >;
  };

type InferInsert<T extends Table | unknown> = T extends Table
  ? InferInsertModel<T>
  : never;

export type InferInsertModels<Schema extends Record<string, Table | unknown>> =
  {
    [K in keyof Schema as Schema[K] extends Table ? K : never]: InferInsert<
      Schema[K]
    >;
  };

export type ExtractQueryRelationsWithOnly<
  QueryParams extends true | { with?: any } | undefined,
> = QueryParams extends {
  with?: infer With extends Record<string, { with?: any } | unknown>;
}
  ? {
    [K in keyof With]?: With[K] extends true | undefined | { with?: any }
    ? ExtractQueryRelationsWithOnly<With[K]>
    : never;
  }
  : never;

export type InferQueryRelationsWithOnly<
  K extends keyof Database["query"],
  Database extends {
    query: Record<
      keyof Database["query"],
      { findFirst: (...args: any[]) => any }
    >;
  },
> = ExtractQueryRelationsWithOnly<
  Parameters<Database["query"][K]["findFirst"]>[0]
>;

type _ClientWithTables<
  Database extends { query: any },
  K extends keyof Database["query"] = keyof Database["query"],
> = InferQueryRelationsWithOnly<K, Database>;

export type ClientWithTables<
  Database extends { query: any },
  tableId extends keyof Database["query"],
> = _ClientWithTables<Database, tableId>;

export type ExtractQueryRelationsWithOnlySelect<
  QueryParams extends true | { with?: any } | undefined,
> = QueryParams extends {
  with?: infer With extends Record<string, { with?: any } | unknown>;
}
  ? {
    [K in keyof With]?: With[K] extends true | undefined | { with?: any }
    ? ExtractQueryRelationsWithOnlySelect<With[K]>
    : never;
  }
  : never;

export type InferQueryRelationsWithOnlySelect<
  K extends keyof Database["query"],
  Database extends {
    query: Record<
      keyof Database["query"],
      { findFirst: (...args: any[]) => any }
    >;
  },
> = ExtractQueryRelationsWithOnlySelect<
  Parameters<Database["query"][K]["findFirst"]>[0]
>;

export type _ClientWithSelect<
  Database extends { query: any },
  Schema extends Record<string, Table>,
  tableId extends keyof Database["query"],
  Select extends BepaloQueryWith<SelectorGet, Database, Schema, tableId>,
> = (tableId extends keyof Schema
  ? {
    [K in keyof InferSelectModel<
      Schema[tableId]
    > as K extends keyof NonNullable<Select["columns"]>
    ? K
    : never]: K extends keyof InferSelectModel<Schema[tableId]>
    ? K extends keyof NonNullable<Select["columns"]>
    ? InferSelectModel<Schema[tableId]>[K]
    : never
    : never;
  }
  : never) & {
    [K in keyof NonNullable<Select["with"]> as K extends keyof Schema
    ? K
    : never]: K extends keyof Schema
    ? NonNullable<Select["with"]>[K] extends BepaloQueryWith<
      SelectorGet,
      Database,
      Schema,
      K
    >
    ? _ClientWithSelect<Database, Schema, K, NonNullable<Select["with"]>[K]>
    : never
    : never;
  };

export type ClientWithSelect<
  Database extends { query: any },
  Schema extends Record<string, Table>,
  tableId extends keyof Database["query"],
  Select extends BepaloQueryWith<SelectorGet, Database, Schema, tableId>,
> = _ClientWithSelect<Database, Schema, tableId, Select>;

export type InferResponseType<
  resourceId extends string,
  Database extends { query: any },
  Schema extends Record<string, Table | unknown>,
  tableId extends keyof Database["query"],
  withTables extends ClientWithTables<Database, tableId> = ClientWithTables<
    Database,
    tableId
  >,
> = {
  total?: number;
  rowsAffected?: number;
} & (
    | {
      [R in resourceId]:
      | (InferSelectModel<
        Schema[tableId] extends Table ? Schema[tableId] : never
      > &
        withTables)
      | null;
    }
    | ({ count: number } & {
      [R in resourceId]:
      | (InferSelectModel<
        Schema[tableId] extends Table ? Schema[tableId] : never
      > &
        withTables)[]
      | null;
    })
  );

export type InferResponseTypeFirst<
  resourceId extends string,
  Database extends { query: any },
  Schema extends Record<string, Table | unknown>,
  tableId extends keyof Database["query"],
  withTables extends ClientWithTables<Database, tableId> = ClientWithTables<
    Database,
    tableId
  >,
> = {
  total?: number;
} & {
    [R in resourceId]:
    | (InferSelectModel<
      Schema[tableId] extends Table ? Schema[tableId] : never
    > &
      withTables)
    | null;
  };

export type InferResponseTypeMany<
  resourceId extends string,
  Database extends { query: any },
  Schema extends Record<string, Table | unknown>,
  tableId extends keyof Database["query"],
  withTables extends ClientWithTables<Database, tableId> = ClientWithTables<
    Database,
    tableId
  >,
> = {
  total?: number;
  rowsAffected?: number;
} & ({ count: number } & {
  [R in resourceId]:
  | (InferSelectModel<
    Schema[tableId] extends Table ? Schema[tableId] : never
  > &
    withTables)[]
  | null;
});

export type InferResponseTypeManySelect<
  resourceId extends string,
  Database extends { query: any },
  Schema extends Record<string, Table>,
  tableId extends keyof Database["query"],
  Select extends BepaloQueryWith<SelectorGet, Database, Schema, tableId>,
> = {
  total?: number;
  rowsAffected?: number;
} & ({ count: number } & {
  [R in resourceId]:
  | ClientWithSelect<Database, Schema, tableId, Select>[]
  | null;
});

type BepaloQueryWith<
  T extends Record<string, unknown>,
  Database extends { query: any },
  Schema extends Record<string, any>,
  K extends keyof Schema,
> = Omit<T, "columns" | "with"> & {
  columns?: Partial<Record<keyof InferSelectModel<Schema[K]>, boolean>>;
} & {
    [W in keyof T as W extends "with" ? W : never]: {
      [N in keyof Schema as N extends keyof InferQueryRelations<K, Database>
      ? N
      : never]?: BepaloQueryWith<T, Database, Schema, N>;
    };
  };

const URI_CC0 = "&".charCodeAt(0);
const URI_CC1 = "=".charCodeAt(0);
const URI_CC2 = "#".charCodeAt(0);
const URI_CC3 = "%".charCodeAt(0);
const URI_CC4 = "+".charCodeAt(0);
const URI_CC5 = "?".charCodeAt(0);

const uriCodes = new Array<string>(64).fill("");
uriCodes[URI_CC0] = "%26";
uriCodes[URI_CC1] = "%3D";
uriCodes[URI_CC2] = "%23";
uriCodes[URI_CC3] = "%25";
uriCodes[URI_CC4] = "%2B";
uriCodes[URI_CC5] = "%3F";
Object.freeze(uriCodes);

export const encodeURIComponentRJSON = (uri: string): string => {
  if (uri === "") return uri;
  let parts: string[] | undefined = undefined;
  let left = 0;
  let right = 0;
  // first match to initialize 'parts'
  for (; !parts && right < uri.length; right++) {
    const charCode = uri.charCodeAt(right);
    switch (charCode) {
      case URI_CC0:
      case URI_CC1:
      case URI_CC2:
      case URI_CC3:
      case URI_CC4:
      case URI_CC5:
        parts = [];
        parts.push(uri.slice(left, right));
        parts.push(uriCodes[charCode] ?? "");
        left = right + 1;
        break;
    }
  }
  // second match: parts is already allocated.
  // no need to check every iteration.
  if (parts) {
    for (; right < uri.length; right++) {
      const charCode = uri.charCodeAt(right);
      switch (charCode) {
        case URI_CC0:
        case URI_CC1:
        case URI_CC2:
        case URI_CC3:
        case URI_CC4:
        case URI_CC5:
          parts.push(uri.slice(left, right));
          parts.push(uriCodes[charCode]);
          left = right + 1;
          break;
      }
    }
  }
  if (!parts) {
    return uri;
  }
  if (left < uri.length) {
    parts.push(uri.slice(left));
  }
  return parts.join("");
  // return uri.replace(/[&=#%+?]/g, (m) => uriCodes[m.charCodeAt(0)] ?? m);
};

export class BepaloQueryBuilder<
  Schema extends Record<string, Table | unknown>,
  Database extends { query: any },
  _Tables extends Record<string, Table> = PickTables<Schema>,
> {
  constructor() { }

  Get<N extends keyof _Tables>(
    options?: Omit<GetQuery, "select"> & {
      select?: BepaloQueryWith<SelectorGet, Database, _Tables, N>;
    },
  ): Map<string, string> {
    const params = new Map<string, string>();
    if (options) {
      for (const [k, v] of Object.entries(options)) {
        params.set(k, encodeURIComponentRJSON(RJSON.stringify(v)));
      }
    }
    return params;
  }

  Post<N extends keyof _Tables>(
    options?: Omit<PostQuery, "select"> & {
      select?: BepaloQueryWith<SelectorPost, Database, _Tables, N>;
    },
  ): Map<string, string> {
    const params = new Map<string, string>();
    if (options) {
      for (const [k, v] of Object.entries(options)) {
        params.set(k, encodeURIComponentRJSON(RJSON.stringify(v)));
      }
    }
    return params;
  }

  Patch<N extends keyof _Tables>(
    options?: Omit<PatchQuery, "select"> & {
      select?: BepaloQueryWith<SelectorPatch, Database, _Tables, N>;
    },
  ): Map<string, string> {
    const params = new Map<string, string>();
    if (options) {
      for (const [k, v] of Object.entries(options)) {
        params.set(k, encodeURIComponentRJSON(RJSON.stringify(v)));
      }
    }
    return params;
  }

  Delete<N extends keyof _Tables>(
    options?: Omit<DeleteQuery, "select"> & {
      select?: BepaloQueryWith<SelectorDelete, Database, _Tables, N>;
    },
  ): Map<string, string> {
    const params = new Map<string, string>();
    if (options) {
      for (const [k, v] of Object.entries(options)) {
        params.set(k, encodeURIComponentRJSON(RJSON.stringify(v)));
      }
    }
    return params;
  }
}

type QueryURL<
  QueryPath extends string,
  resourceId extends string,
> = `${string | ""}${QueryPath}/${resourceId}${"?" | "#" | ""}${string}`;

export const createQueryBuilder = <
  Schema extends Record<string, any>,
  Database extends { query: any },
  _Tables extends Record<string, Table> = PickTables<Schema>,
>(): BepaloQueryBuilder<Schema, Database, _Tables> => new BepaloQueryBuilder();

export class BepaloQueryClient<
  Schema extends Record<string, Table | unknown>,
  Database extends { query: any },
  QueryPath extends string = "/query",
  _Tables extends Record<string, Table> = PickTables<Schema>,
> {
  public queryBuilder: BepaloQueryBuilder<Schema, Database, _Tables> =
    createQueryBuilder<Schema, Database, _Tables>();
  baseUrl: string;

  constructor(
    baseUrl: string = typeof location !== "undefined" ? location.origin : "",
  ) {
    try {
      new URL("/", baseUrl);
    } catch {
      throw new Error(`[QueryClient] Invalid baseUrl '${baseUrl}'`);
    }
    this.baseUrl = baseUrl;
  }

  private _fetch<R>(url: string, init?: RequestInit): Promise<R> {
    return fetch(url, init).then(async (response) => {
      if (response.ok) {
        const res = await response.json();
        return res;
      } else {
        const res = await response.json();
        throw new Error(
          `(${response.status}: ${response.statusText}) ${res?.error || "Query Server Error"}`,
        );
      }
    }) as Promise<R>;
  }

  private _appendSearchAndGetURL(
    _url: string,
    params: Map<string, string>,
  ): string {
    const queryParams: string[] = [];
    for (const [k, v] of params) {
      queryParams.push(`${k}=${v}`);
    }
    const url = new URL(_url, this.baseUrl);
    const query = queryParams.join("&");
    const search = `${url.search ? url.search + "&" : "?"}${query}`;
    const murl = `${url.origin}${url.pathname}${search}${url.hash}`;
    return murl;
  }

  /////////////////////////////////////////////////////////////////////////k
  async Get<
    N extends keyof Database["query"],
    resourceId extends string,
    ReturnType = InferResponseType<resourceId, Database, Schema, N>,
  >(
    url: QueryURL<QueryPath, resourceId>,
    options?: Omit<GetQuery, "select"> & {
      select?: BepaloQueryWith<SelectorGet, Database, _Tables, N>;
    },
    init?: RequestInit,
  ): Promise<ReturnType> {
    const params = this.queryBuilder.Get<N>(options);
    const murl = this._appendSearchAndGetURL(url, params);
    return await this._fetch(murl, { ...init, method: "get" });
  }

  async GetFirst<
    N extends keyof Database["query"],
    resourceId extends string,
    ReturnType = InferResponseTypeFirst<resourceId, Database, Schema, N>,
  >(
    url: QueryURL<QueryPath, resourceId>,
    options?: Omit<GetQuery, "select" | "findFirst"> & {
      select?: BepaloQueryWith<SelectorGet, Database, _Tables, N>;
    },
    init?: RequestInit,
  ): Promise<ReturnType> {
    const params = this.queryBuilder.Get<N>({ ...options, findFirst: true });
    const murl = this._appendSearchAndGetURL(url, params);
    return await this._fetch(murl, { ...init, method: "get" });
  }

  async GetMany<
    resourceId extends string,
    N extends keyof Database["query"],
    Options extends Omit<GetQuery, "select"> & {
      select?: BepaloQueryWith<SelectorGet, Database, _Tables, N>;
    } = Omit<GetQuery, "select"> & {
      select?: BepaloQueryWith<SelectorGet, Database, _Tables, N>;
    },
    ReturnType = InferResponseTypeManySelect<
      resourceId,
      Database,
      _Tables,
      N,
      NonNullable<Options["select"]>
    >,
  >(
    url: QueryURL<QueryPath, resourceId>,
    options?: Options,
    init?: RequestInit,
  ): Promise<ReturnType> {
    const params = this.queryBuilder.Get<N>(options);
    const murl = this._appendSearchAndGetURL(url, params);
    return await this._fetch(murl, { ...init, method: "get" });
  }

  async Post<
    N extends keyof Database["query"],
    resourceId extends string,
    ReturnType = InferResponseTypeMany<resourceId, Database, Schema, N>,
  >(
    url: QueryURL<QueryPath, resourceId>,
    options?: Omit<PostQuery, "select"> & {
      select?: BepaloQueryWith<SelectorPost, Database, _Tables, N>;
    },
    init?: RequestInit,
  ): Promise<ReturnType> {
    const params = this.queryBuilder.Post<N>(options);
    const murl = this._appendSearchAndGetURL(url, params);
    return await this._fetch(murl, { ...init, method: "post" });
  }

  async Patch<
    N extends keyof Database["query"],
    resourceId extends string,
    ReturnType = InferResponseTypeMany<resourceId, Database, Schema, N>,
  >(
    url: `${string | ""}${QueryPath}/${resourceId}${`#${string}` | ""}${`?${string}` | ""}`,
    options?: Omit<PatchQuery, "select"> & {
      select?: BepaloQueryWith<SelectorPatch, Database, _Tables, N>;
    },
    init?: RequestInit,
  ): Promise<ReturnType> {
    const params = this.queryBuilder.Patch<N>(options);
    const murl = this._appendSearchAndGetURL(url, params);
    return await this._fetch(murl, { ...init, method: "patch" });
  }

  async Delete<
    N extends keyof Database["query"],
    resourceId extends string,
    ReturnType = InferResponseTypeMany<resourceId, Database, Schema, N>,
  >(
    url: QueryURL<QueryPath, resourceId>,
    options?: Omit<DeleteQuery, "select"> & {
      select?: BepaloQueryWith<SelectorDelete, Database, _Tables, N>;
    },
    init?: RequestInit,
  ): Promise<ReturnType> {
    const params = this.queryBuilder.Delete<N>(options);
    const murl = this._appendSearchAndGetURL(url, params);
    return await this._fetch(murl, { ...init, method: "delete" });
  }
}

export const createQueryClient = <
  Schema extends Record<string, Table | unknown>,
  Database extends { query: any },
  QueryPath extends string = "/query",
>(
  baseUrl: string = typeof location !== "undefined" ? location.origin : "",
): BepaloQueryClient<Schema, Database, QueryPath> =>
  new BepaloQueryClient(baseUrl);
