import { type CTXACLCommon, type InferQuery, type InferTransaction, type PickTables, type RequestHandler, type Routes, type Table, type ACL } from "./types.ts";
import { SurpassMaxLimit, HttpError } from "./utils.ts";
export declare const createQueryRoute: <Role extends string, CTXSession extends object, XContext = Record<string, never>, _Schema extends Record<string, Table | unknown> = Record<string, Table | unknown>, Database extends {
    transaction: any;
    query: any;
} = {
    transaction: any;
    query: any;
}, Transaction extends InferTransaction<Database> = InferTransaction<Database>, Query extends InferQuery<Database> = InferQuery<Database>, Schema extends PickTables<_Schema> = PickTables<_Schema>>({ acl, schema, database, idParam, onSurpassMaxLimit, session, defaults, onError, }: {
    acl?: ACL<Role, CTXSession, XContext, Schema, Database, Transaction, Query>;
    schema: _Schema;
    database: Database;
    idParam: string;
    onSurpassMaxLimit?: SurpassMaxLimit;
    session?: {
        parser: RequestHandler<CTXSession & XContext>;
        getRole: (req: Request, ctx: CTXSession & XContext & CTXACLCommon<Role>) => Role;
    };
    defaults?: {
        maxDepth?: number;
        maxLimit?: number;
    };
    onError?: {
        (error: HttpError | Error): void;
    };
}) => Routes;
//# sourceMappingURL=query.d.ts.map