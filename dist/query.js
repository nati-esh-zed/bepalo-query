"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueryRoute = void 0;
const arktype_1 = require("arktype");
const types_ts_1 = require("./types.js");
const utils_ts_1 = require("./utils.js");
const createQueryRoute = ({ acl, schema, database, idParam, onSurpassMaxLimit = utils_ts_1.SurpassMaxLimit.Throw, session, defaults, onError, }) => {
    /////////////////////////////////////////////////////////
    const parseSession = session === null || session === void 0 ? void 0 : session.parser;
    const getRoleFromSession = session === null || session === void 0 ? void 0 : session.getRole;
    const defaultResultFormatter = (_req, { resourceId, findFirst, result }) => {
        var _a, _b, _c;
        const response = {};
        if (result) {
            if (result.total !== undefined) {
                response.total = result.total;
            }
            if (result.rowsAffected != null) {
                response.rowsAffected = result.rowsAffected;
            }
            if (findFirst) {
                response[resourceId] = result.rows;
            }
            else {
                response.count = (_c = (_a = result.count) !== null && _a !== void 0 ? _a : (_b = result.rows) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
                response[resourceId] = result.rows;
            }
        }
        return (0, utils_ts_1.json)(response);
    };
    const deepCombine = (result, resourceId, tableId, ctx, acl, query, aclEntry, maxDepth, depth = 0) => {
        var _a, _b, _c, _d, _e, _f;
        // Max Depth
        {
            if ((acl === null || acl === void 0 ? void 0 : acl.maxDepth) != null) {
                maxDepth = depth + acl.maxDepth;
            }
            if (maxDepth != null && depth > maxDepth) {
                throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Max depth surpassed for table '${tableId}'`, utils_ts_1.Status._400_BadRequest);
            }
        }
        const forbidQuery = acl === null || acl === void 0 ? void 0 : acl.forbidQuery;
        // OFFSET & LIMIT
        {
            if ((query === null || query === void 0 ? void 0 : query.offset) != null) {
                if (forbidQuery === null || forbidQuery === void 0 ? void 0 : forbidQuery.offset) {
                    throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) query 'select.offset' forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
                }
                result.offset = query.offset;
            }
            if ((query === null || query === void 0 ? void 0 : query.limit) && (forbidQuery === null || forbidQuery === void 0 ? void 0 : forbidQuery.limit)) {
                throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) query 'select.limit' forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
            }
            {
                const aclMaxLimit = acl === null || acl === void 0 ? void 0 : acl.maxLimit;
                const maxLimit = aclMaxLimit != null
                    ? aclMaxLimit
                    : aclMaxLimit === null
                        ? undefined
                        : aclEntry.maxLimit != null
                            ? aclEntry.maxLimit
                            : aclEntry.maxLimit === null
                                ? undefined
                                : defaults === null || defaults === void 0 ? void 0 : defaults.maxLimit;
                if ((query === null || query === void 0 ? void 0 : query.limit) > maxLimit &&
                    onSurpassMaxLimit === utils_ts_1.SurpassMaxLimit.Throw) {
                    throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Max limit surpassed for table '${tableId}'`, utils_ts_1.Status._400_BadRequest);
                }
                const limit = (query === null || query === void 0 ? void 0 : query.limit) != null
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
        if (acl === null || acl === void 0 ? void 0 : acl.select) {
            if ((query === null || query === void 0 ? void 0 : query.columns) != null && (forbidQuery === null || forbidQuery === void 0 ? void 0 : forbidQuery.columns)) {
                throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) query 'select.columns' forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
            }
            const queryColumns = typeof (query === null || query === void 0 ? void 0 : query.columns) === "object" && (query === null || query === void 0 ? void 0 : query.columns);
            const aclColumns = (_a = acl.select) === null || _a === void 0 ? void 0 : _a.columns;
            const aclMode = (_c = (_b = acl.select) === null || _b === void 0 ? void 0 : _b.mode) !== null && _c !== void 0 ? _c : true;
            const queryBoolean = typeof (query === null || query === void 0 ? void 0 : query.columns) === "boolean";
            const aclBoolean = typeof acl.select === "boolean";
            const queryObject = (query === null || query === void 0 ? void 0 : query.columns) && typeof query.columns === "object";
            const aclObject = ((_d = acl.select) === null || _d === void 0 ? void 0 : _d.columns) && typeof acl.select.columns === "object";
            if (queryBoolean && aclBoolean) {
                if ((query === null || query === void 0 ? void 0 : query.columns) && !acl.select) {
                    throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Column selection forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
                }
                result.columns = ((_e = acl.select) !== null && _e !== void 0 ? _e : true) && ((_f = query === null || query === void 0 ? void 0 : query.columns) !== null && _f !== void 0 ? _f : true);
            }
            else if (queryBoolean) {
                if (query.columns) {
                    if (aclObject) {
                        result.columns = {};
                        for (const k of aclColumns.keys()) {
                            result.columns[k] = aclMode;
                        }
                    }
                    else {
                        result.columns = true;
                    }
                }
                else {
                    result.columns = false;
                }
            }
            else if (aclBoolean) {
                if (acl.select) {
                    result.columns = queryObject ? Object.assign({}, queryColumns) : true;
                }
                else {
                    result.columns = false;
                }
            }
            else if (queryObject && aclObject) {
                result.columns = {};
                const entries = Object.entries(queryColumns);
                const mode = entries.length > 0 && entries[0][1];
                if (mode) {
                    for (const [k, v] of entries) {
                        if (v && (aclMode ? !aclColumns.has(k) : aclColumns.has(k))) {
                            throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) forbidden query field '${k}' of table '${tableId}'`, 400);
                        }
                        result.columns[k] = v;
                    }
                }
                else if (aclMode) {
                    for (const k of aclColumns.keys()) {
                        if (queryColumns[k]) {
                            result.columns[k] = true;
                        }
                    }
                }
                else {
                    for (const [k, v] of entries) {
                        if (!v) {
                            result.columns[k] = false;
                        }
                    }
                    for (const k of aclColumns.keys()) {
                        result.columns[k] = false;
                    }
                }
            }
            else if (queryColumns) {
                result.columns = queryObject ? Object.assign({}, queryColumns) : queryColumns;
            }
            else if (aclColumns) {
                if (aclObject) {
                    result.columns = {};
                    for (const k of aclColumns.keys()) {
                        result.columns[k] = aclMode;
                    }
                }
                else {
                    result.columns = true;
                }
            }
            if (result.columns === true) {
                result.columns = undefined;
            }
        }
        else {
            throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) query 'select.columns' disabled by ACL`, utils_ts_1.Status._400_BadRequest);
        }
        // EXTRAS
        if (acl === null || acl === void 0 ? void 0 : acl.extras) {
            result.extras = acl.extras;
        }
        // WHERE
        if (query === null || query === void 0 ? void 0 : query.where) {
            if (forbidQuery === null || forbidQuery === void 0 ? void 0 : forbidQuery.where) {
                throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) query 'select.where' forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
            }
            const isArray = Array.isArray(query.where);
            const sWhere = isArray
                ? [...query.where].map((e) => Object.entries(e))
                : Object.entries(Object.assign({}, query.where));
            result.where = (table, operators) => {
                let w = isArray
                    ? operators.or(...sWhere.map((orWhere) => operators.and(...orWhere.map(([key, value]) => {
                        let [field, operator] = key.split(".", 2);
                        if (!(field in table)) {
                            throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Invalid column in where condition '${field}' here '${key}'`, utils_ts_1.Status._400_BadRequest);
                        }
                        const fieldSel = table[field];
                        if (!operator)
                            operator = "eq";
                        const op = operators[operator];
                        if (!op) {
                            throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Invalid operator in where condition '${operator}' here '${key}'`, utils_ts_1.Status._400_BadRequest);
                        }
                        return op(fieldSel, fieldSel.dataType === "date" ? new Date(value) : value);
                    }))))
                    : operators.and((acl === null || acl === void 0 ? void 0 : acl.where) && acl.where(ctx, table, operators), ...sWhere.map(([key, value]) => {
                        let [field, operator] = key.split(".", 2);
                        if (!(field in table)) {
                            throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Invalid column in where condition '${field}' here '${key}'`, utils_ts_1.Status._400_BadRequest);
                        }
                        const fieldSel = table[field];
                        if (!operator)
                            operator = "eq";
                        const op = operators[operator];
                        if (!op) {
                            throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Invalid operator in where condition '${operator}' here '${key}'`, utils_ts_1.Status._400_BadRequest);
                        }
                        return op(fieldSel, fieldSel.dataType === "date" ? new Date(value) : value);
                    }));
                if (isArray && (acl === null || acl === void 0 ? void 0 : acl.where)) {
                    w = operators.and(acl.where(ctx, table, operators), w);
                }
                return w;
            };
        }
        else if (acl === null || acl === void 0 ? void 0 : acl.where) {
            result.where = (table, operators) => acl.where(ctx, table, operators);
        }
        //  ORDER BY
        if (query === null || query === void 0 ? void 0 : query.orderBy) {
            if (forbidQuery === null || forbidQuery === void 0 ? void 0 : forbidQuery.orderBy) {
                throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) query 'select.orderBy' forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
            }
            const orderBy = Object.entries(Object.assign({}, query.orderBy));
            result.orderBy = (table, operators) => orderBy.map(([field, opname]) => {
                const targetField = table[field];
                if (!targetField) {
                    throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) invalid column '${field}' of table '${tableId}'`, 400);
                }
                const op = opname === 1 || opname === "asc" ? operators.asc : operators.desc;
                return op(targetField);
            });
        }
        else if (acl === null || acl === void 0 ? void 0 : acl.orderBy) {
            const orderBy = Object.entries(Object.assign({}, acl.orderBy));
            result.orderBy = (table, operators) => orderBy.map(([field, opname]) => {
                const targetField = table[field];
                if (!targetField) {
                    throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) invalid column '${field}' of table '${tableId}'`, 400);
                }
                const op = opname.charAt(0) === "1" ||
                    opname.charAt(0) === "a"
                    ? operators.asc
                    : operators.desc;
                return op(targetField);
            });
        }
        if (query === null || query === void 0 ? void 0 : query.with) {
            if (forbidQuery === null || forbidQuery === void 0 ? void 0 : forbidQuery.with) {
                throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) query 'select.with' forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
            }
            result.with = {};
            for (const [joinedTableId, selector] of Object.entries(query.with)) {
                if (!selector) {
                    continue;
                }
                if ((acl === null || acl === void 0 ? void 0 : acl.with) && !acl.with[joinedTableId]) {
                    throw new utils_ts_1.HttpError(`(${resourceId}:${depth}) Join of '${joinedTableId}' forbidden by ACL`, utils_ts_1.Status._400_BadRequest);
                }
                result.with[joinedTableId] = {};
                deepCombine(result.with[joinedTableId], resourceId, joinedTableId, ctx, (acl === null || acl === void 0 ? void 0 : acl.with) && acl.with[joinedTableId], selector, aclEntry, maxDepth, depth + 1);
            }
        }
        return result;
    };
    const parseAuth = (req, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (parseSession) {
            const res = yield parseSession(req, ctx);
            if (res instanceof Response) {
                return res;
            }
            ctx.userRole = getRoleFromSession && getRoleFromSession(req, ctx);
        }
    });
    const routes = {};
    //
    ///// OPTIONS
    //
    routes.OPTIONS = (req) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const resourceId = req.params[idParam];
            const url = new URL(req.url);
            const queryParams = {};
            for (const [k, v] of url.searchParams.entries()) {
                queryParams[k] = v;
            }
            const query = (0, types_ts_1.TOptionsQuery)(queryParams);
            if (query instanceof arktype_1.ArkErrors) {
                return (0, utils_ts_1.json)({
                    error: query.toString() || "Something went wrong",
                }, {
                    status: utils_ts_1.Status._400_BadRequest,
                });
            }
            const ctx = {
                url,
                query,
                resourceId,
            };
            // PARSE SESSION AND AUTHENTICATE
            {
                const res = yield parseAuth(req, ctx);
                if (res instanceof Response) {
                    return res;
                }
            }
            const aclEntry = acl &&
                acl[resourceId];
            if (aclEntry == null) {
                return (0, utils_ts_1.status)(utils_ts_1.Status._404_NotFound, null);
            }
            const tableId = aclEntry.table;
            const table = schema[tableId];
            if (table == null) {
                return (0, utils_ts_1.status)(utils_ts_1.Status._404_NotFound, null);
            }
            const tablePermissions = aclEntry.control;
            const userRole = ctx.userRole;
            let allowedMethods;
            if (query["mine|guest"]) {
                allowedMethods = Object.entries(tablePermissions)
                    .filter(userRole
                    ? ([, perm]) => perm[userRole] || perm.mine || perm.all || perm.guest
                    : ([, perm]) => perm.guest)
                    .map(([method]) => method);
            }
            else if (query.guest) {
                allowedMethods = Object.entries(tablePermissions)
                    .filter(([, perm]) => perm.guest)
                    .map(([method]) => method);
            }
            else if (query.mine) {
                allowedMethods = Object.entries(tablePermissions)
                    .filter(([, perm]) => perm.mine)
                    .map(([method]) => method);
            }
            else if (userRole) {
                allowedMethods = Object.entries(tablePermissions)
                    .filter(([, perm]) => perm[userRole] || perm.mine || perm.all)
                    .map(([method]) => method);
            }
            else {
                allowedMethods = Object.entries(tablePermissions)
                    .filter(([, perm]) => perm.guest)
                    .map(([method]) => method);
            }
            const headers = new Headers();
            if (allowedMethods.length > 0) {
                if (allowedMethods.includes("GET")) {
                    headers.append("Allow", `OPTIONS,HEAD,${allowedMethods.join(",")}`);
                }
                else {
                    headers.append("Allow", `OPTIONS,${allowedMethods.join(",")}`);
                }
            }
            else {
                headers.append("Allow", `OPTIONS`);
            }
            return (0, utils_ts_1.status)(utils_ts_1.Status._204_NoContent, null, {
                headers,
            });
        }
        catch (error) {
            return (0, utils_ts_1.json)({
                error: error.cause ||
                    error.message ||
                    "Something went wrong",
            }, {
                status: error.status || utils_ts_1.Status._500_InternalServerError,
            });
        }
    });
    //
    ///// GET
    //
    routes.GET = (req) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            const resourceId = req.params[idParam];
            const url = new URL(req.url);
            const queryParams = {};
            for (const [k, v] of url.searchParams.entries()) {
                queryParams[k] = v;
            }
            const query = (0, types_ts_1.TGetQuery)(queryParams);
            if (query instanceof arktype_1.ArkErrors) {
                return (0, utils_ts_1.json)({
                    error: query.toString() || "Something went wrong",
                }, {
                    status: utils_ts_1.Status._400_BadRequest,
                });
            }
            const ctx = {
                url,
                query,
                resourceId,
            };
            // PARSE SESSION AND AUTHENTICATE
            {
                const res = yield parseAuth(req, ctx);
                if (res instanceof Response) {
                    return res;
                }
            }
            const { select } = query;
            const aclEntry = acl &&
                acl[resourceId];
            if (aclEntry == null) {
                return req.method === "HEAD"
                    ? (0, utils_ts_1.status)(utils_ts_1.Status._404_NotFound, null)
                    : (0, utils_ts_1.json)({
                        error: "Resource not found",
                    }, {
                        status: utils_ts_1.Status._404_NotFound,
                    });
                // throw new HttpError("Resource not found", Status._404_NotFound);
            }
            const aclRule = aclEntry.control.GET;
            if (aclRule == null) {
                return req.method === "HEAD"
                    ? (0, utils_ts_1.status)(utils_ts_1.Status._404_NotFound, null)
                    : (0, utils_ts_1.json)({
                        error: "ACL rule not defined for the method for the method",
                    }, {
                        status: utils_ts_1.Status._404_NotFound,
                    });
            }
            const aclSelector = (_d = (query["mine|guest"]
                ? ((_b = (ctx.userRole && ((_a = aclRule[ctx.userRole]) !== null && _a !== void 0 ? _a : aclRule.mine))) !== null && _b !== void 0 ? _b : aclRule.guest)
                : query.guest
                    ? aclRule.guest
                    : ctx.userRole
                        ? ((_c = aclRule[ctx.userRole]) !== null && _c !== void 0 ? _c : aclRule.mine)
                        : aclRule.guest)) !== null && _d !== void 0 ? _d : aclRule.all;
            if (!aclSelector) {
                return (0, utils_ts_1.json)({
                    error: "Resource forbidden",
                }, {
                    status: utils_ts_1.Status._403_Forbidden,
                });
            }
            if (query.findFirst != null &&
                aclEntry.findFirst != null &&
                query.findFirst !== aclEntry.findFirst) {
                return (0, utils_ts_1.json)({
                    error: query.findFirst
                        ? "find first forbidden by ACL"
                        : "find many forbidden by ACL",
                }, {
                    status: utils_ts_1.Status._403_Forbidden,
                });
            }
            ctx.findFirst = (_e = aclEntry.findFirst) !== null && _e !== void 0 ? _e : query.findFirst;
            const tableId = aclEntry.table || resourceId;
            const selector = {};
            try {
                deepCombine(selector, resourceId, tableId, ctx, aclSelector, select, aclEntry, aclEntry.maxDepth != null
                    ? aclEntry.maxDepth
                    : aclEntry.maxDepth === null
                        ? undefined
                        : defaults === null || defaults === void 0 ? void 0 : defaults.maxDepth);
            }
            catch (error) {
                return (0, utils_ts_1.json)({
                    error: error.message || "Something went wrong",
                }, {
                    status: error.status || utils_ts_1.Status._400_BadRequest,
                });
            }
            const formatResult = (_g = (_f = aclSelector.formatResult) !== null && _f !== void 0 ? _f : aclEntry.formatResult) !== null && _g !== void 0 ? _g : defaultResultFormatter;
            try {
                const result = yield database.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b;
                    ctx.tx = tx;
                    if (aclSelector.beforeQuery) {
                        yield aclSelector.beforeQuery(ctx);
                    }
                    const table = schema[tableId];
                    const columns = selector.columns;
                    const extras = selector.extras;
                    if (columns === true) {
                        selector.columns = undefined;
                    }
                    const selecting = columns !== false ||
                        typeof columns === "object" ||
                        typeof extras == "object";
                    const result = {
                        rows: null,
                    };
                    if (selecting) {
                        // selector.columns = undefined;
                        result.rows = ctx.findFirst
                            ? yield tx.query[tableId].findFirst(selector)
                            : yield tx.query[tableId].findMany(selector);
                    }
                    else {
                        const count = yield tx.$count(table, selector.where &&
                            selector.where(table, utils_ts_1.operators));
                        const offset = (_a = selector.offset) !== null && _a !== void 0 ? _a : 0;
                        const limit = selector.limit;
                        result.count = limit
                            ? Math.min(limit, count - offset)
                            : count - offset;
                    }
                    const countTotal = (_b = query.countTotal) !== null && _b !== void 0 ? _b : aclEntry.countTotal;
                    if (countTotal) {
                        const total = yield tx.$count(table, aclSelector.where && aclSelector.where(ctx, table, utils_ts_1.operators));
                        result.total = total;
                    }
                    if (aclSelector.afterQuery) {
                        yield aclSelector.afterQuery(ctx);
                    }
                    return result;
                }));
                ctx.result = result;
                const res = formatResult(req, ctx);
                return res instanceof Response ? res : (0, utils_ts_1.status)(utils_ts_1.Status._204_NoContent);
            }
            catch (error) {
                if (aclSelector.onQueryError) {
                    const res = yield aclSelector.onQueryError(error instanceof Error ? error : new Error(String(error)), ctx);
                    if (res instanceof Response) {
                        return res;
                    }
                }
                throw error;
            }
        }
        catch (error) {
            onError && onError(error);
            return (0, utils_ts_1.json)({
                error: error.cause ||
                    error.message ||
                    "Something went wrong",
            }, {
                status: error.status || utils_ts_1.Status._500_InternalServerError,
            });
        }
    });
    //
    ///// HEAD
    //
    routes.HEAD = routes.GET;
    //
    ///// POST
    //
    routes.POST = (req) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            const resourceId = req.params[idParam];
            const url = new URL(req.url);
            const queryParams = {};
            for (const [k, v] of url.searchParams.entries()) {
                queryParams[k] = v;
            }
            const query = (0, types_ts_1.TPostQuery)(queryParams);
            if (query instanceof arktype_1.ArkErrors) {
                return (0, utils_ts_1.json)({
                    error: query.toString() || "Something went wrong",
                }, {
                    status: utils_ts_1.Status._400_BadRequest,
                });
            }
            const ctx = {
                url,
                query,
                body: undefined,
                resourceId,
            };
            // PARSE SESSION AND AUTHENTICATE
            {
                const res = yield parseAuth(req, ctx);
                if (res instanceof Response) {
                    return res;
                }
            }
            const { select } = query;
            const aclEntry = acl &&
                acl[resourceId];
            if (aclEntry == null) {
                return (0, utils_ts_1.json)({
                    error: "Resource not found",
                }, {
                    status: utils_ts_1.Status._404_NotFound,
                });
            }
            const aclRule = aclEntry.control.POST;
            if (aclRule == null) {
                return (0, utils_ts_1.json)({
                    error: "ACL rule not defined for the method",
                }, {
                    status: utils_ts_1.Status._404_NotFound,
                });
            }
            const aclSelector = (_d = (query["mine|guest"]
                ? ((_b = (ctx.userRole && ((_a = aclRule[ctx.userRole]) !== null && _a !== void 0 ? _a : aclRule.mine))) !== null && _b !== void 0 ? _b : aclRule.guest)
                : query.guest
                    ? aclRule.guest
                    : ctx.userRole
                        ? ((_c = aclRule[ctx.userRole]) !== null && _c !== void 0 ? _c : aclRule.mine)
                        : aclRule.guest)) !== null && _d !== void 0 ? _d : aclRule.all;
            if (!aclSelector) {
                return (0, utils_ts_1.json)({
                    error: "Resource forbidden",
                }, {
                    status: utils_ts_1.Status._403_Forbidden,
                });
            }
            // Parse body
            {
                const res = yield (0, utils_ts_1.parseBody)({
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
            const tableId = aclEntry.table || resourceId;
            const selector = {};
            try {
                deepCombine(selector, resourceId, tableId, ctx, aclSelector, select, aclEntry, aclEntry.maxDepth != null
                    ? aclEntry.maxDepth
                    : aclEntry.maxDepth === null
                        ? undefined
                        : defaults === null || defaults === void 0 ? void 0 : defaults.maxDepth);
            }
            catch (error) {
                return (0, utils_ts_1.json)({
                    error: error.message || "Something went wrong",
                }, {
                    status: error.status || utils_ts_1.Status._400_BadRequest,
                });
            }
            const formatResult = (_e = aclEntry.formatResult) !== null && _e !== void 0 ? _e : defaultResultFormatter;
            try {
                const result = yield database.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a;
                    ctx.tx = tx;
                    let body = ctx.body;
                    const validateBody = aclSelector.validateBody;
                    const injectBody = aclSelector.injectBody;
                    if (validateBody != null) {
                        if (Array.isArray(body)) {
                            for (let i = 0; i < body.length; i++) {
                                const vb = yield validateBody(body[i], ctx);
                                if (vb instanceof arktype_1.ArkErrors) {
                                    throw new utils_ts_1.HttpError(vb.toString(), utils_ts_1.Status._400_BadRequest);
                                }
                                body[i] = vb;
                            }
                        }
                        else {
                            const vb = yield validateBody(body, ctx);
                            if (vb instanceof arktype_1.ArkErrors) {
                                throw new utils_ts_1.HttpError(vb.toString(), utils_ts_1.Status._400_BadRequest);
                                // throw vb;
                            }
                            body = vb;
                        }
                    }
                    if (injectBody != null) {
                        if (Array.isArray(body)) {
                            for (let i = 0; i < body.length; i++) {
                                const vb = yield injectBody(body[i], ctx);
                                if (vb != null)
                                    body[i] = vb;
                            }
                        }
                        else {
                            const vb = yield injectBody(body, ctx);
                            if (vb != null)
                                body = vb;
                        }
                    }
                    ctx.body = body;
                    if (aclSelector.beforeQuery) {
                        yield aclSelector.beforeQuery(ctx);
                    }
                    const table = schema[tableId];
                    const result = { rows: null };
                    if (selector.columns === undefined) {
                        selector.columns = true;
                    }
                    if (selector.columns) {
                        const columns = {};
                        if (selector.columns === true) {
                            for (const k in table) {
                                if (k[0] !== "_") {
                                    columns[k] = table[k];
                                }
                            }
                        }
                        else {
                            const columnEntries = Object.entries(selector.columns);
                            const mode = columnEntries.length > 0 && columnEntries[0][1];
                            if (mode) {
                                for (const [k, v] of columnEntries) {
                                    if (v && k[0] !== "_") {
                                        if (!Object.prototype.hasOwnProperty.call(table, k)) {
                                            throw new utils_ts_1.HttpError(`(${resourceId}) Invalid column '${k}' in select query of table '${tableId}'`, utils_ts_1.Status._400_BadRequest);
                                        }
                                        columns[k] = table[k];
                                    }
                                }
                            }
                            else {
                                for (const k in table) {
                                    if (k[0] !== "_" &&
                                        selector.columns[k] !== false) {
                                        columns[k] = table[k];
                                    }
                                }
                            }
                        }
                        result.rows = yield tx
                            .insert(table)
                            .values(ctx.body)
                            .returning(columns);
                        result.count = result.rows.length;
                    }
                    else {
                        const info = yield tx.insert(table).values(ctx.body);
                        result.rowsAffected = info.rowsAffected;
                    }
                    const countTotal = (_a = query.countTotal) !== null && _a !== void 0 ? _a : aclEntry.countTotal;
                    if (countTotal) {
                        const total = yield tx.$count(table, aclSelector.where && aclSelector.where(ctx, table, utils_ts_1.operators));
                        result.total = total;
                    }
                    if (aclSelector.afterQuery) {
                        yield aclSelector.afterQuery(ctx);
                    }
                    return result;
                }));
                ctx.result = result;
                const res = formatResult(req, ctx);
                return res instanceof Response ? res : (0, utils_ts_1.status)(utils_ts_1.Status._204_NoContent);
            }
            catch (error) {
                if (aclSelector.onQueryError) {
                    const res = yield aclSelector.onQueryError(error instanceof Error ? error : new Error(String(error)), ctx);
                    if (res instanceof Response) {
                        return res;
                    }
                }
                throw error;
            }
        }
        catch (error) {
            onError && onError(error);
            return (0, utils_ts_1.json)({
                error: error.cause ||
                    error.message ||
                    "Something went wrong",
            }, {
                status: error.status || utils_ts_1.Status._500_InternalServerError,
            });
        }
    });
    //
    ///// PATCH
    //
    routes.PATCH = (req) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            const resourceId = req.params[idParam];
            const url = new URL(req.url);
            const queryParams = {};
            for (const [k, v] of url.searchParams.entries()) {
                queryParams[k] = v;
            }
            const query = (0, types_ts_1.TPatchQuery)(queryParams);
            if (query instanceof arktype_1.ArkErrors) {
                return (0, utils_ts_1.json)({
                    error: query.toString() || "Something went wrong",
                }, {
                    status: utils_ts_1.Status._400_BadRequest,
                });
            }
            const ctx = {
                url,
                query,
                body: undefined,
                resourceId,
            };
            // PARSE SESSION AND AUTHENTICATE
            {
                const res = yield parseAuth(req, ctx);
                if (res instanceof Response) {
                    return res;
                }
            }
            const { select } = query;
            const aclEntry = acl &&
                acl[resourceId];
            if (aclEntry == null) {
                return (0, utils_ts_1.json)({
                    error: "Resource not found",
                }, {
                    status: utils_ts_1.Status._404_NotFound,
                });
            }
            const aclRule = aclEntry.control.PATCH;
            if (aclRule == null) {
                return (0, utils_ts_1.json)({
                    error: "ACL rule not defined for the method",
                }, {
                    status: utils_ts_1.Status._404_NotFound,
                });
            }
            const aclSelector = (_d = (query["mine|guest"]
                ? ((_b = (ctx.userRole && ((_a = aclRule[ctx.userRole]) !== null && _a !== void 0 ? _a : aclRule.mine))) !== null && _b !== void 0 ? _b : aclRule.guest)
                : query.guest
                    ? aclRule.guest
                    : ctx.userRole
                        ? ((_c = aclRule[ctx.userRole]) !== null && _c !== void 0 ? _c : aclRule.mine)
                        : aclRule.guest)) !== null && _d !== void 0 ? _d : aclRule.all;
            if (!aclSelector) {
                return (0, utils_ts_1.json)({
                    error: "Resource forbidden",
                }, {
                    status: utils_ts_1.Status._403_Forbidden,
                });
            }
            // Parse body
            {
                const res = yield (0, utils_ts_1.parseBody)({
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
            const tableId = aclEntry.table || resourceId;
            const selector = {};
            try {
                deepCombine(selector, resourceId, tableId, ctx, aclSelector, select, aclEntry, aclEntry.maxDepth != null
                    ? aclEntry.maxDepth
                    : aclEntry.maxDepth === null
                        ? undefined
                        : defaults === null || defaults === void 0 ? void 0 : defaults.maxDepth);
            }
            catch (error) {
                return (0, utils_ts_1.json)({
                    error: error.message || "Something went wrong",
                }, {
                    status: error.status || utils_ts_1.Status._400_BadRequest,
                });
            }
            const formatResult = (_e = aclEntry.formatResult) !== null && _e !== void 0 ? _e : defaultResultFormatter;
            try {
                const result = yield database.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a;
                    ctx.tx = tx;
                    let body = ctx.body;
                    const validateBody = aclSelector.validateBody;
                    const injectBody = aclSelector.injectBody;
                    if (validateBody != null) {
                        const vb = yield validateBody(body, ctx);
                        if (vb instanceof arktype_1.ArkErrors) {
                            throw new utils_ts_1.HttpError(vb.toString(), utils_ts_1.Status._400_BadRequest);
                        }
                        body = vb;
                    }
                    if (injectBody != null) {
                        const vb = yield injectBody(body, ctx);
                        if (vb != null)
                            body = vb;
                    }
                    ctx.body = body;
                    if (aclSelector.beforeQuery) {
                        yield aclSelector.beforeQuery(ctx);
                    }
                    const table = schema[tableId];
                    const result = { rows: null };
                    if (selector.columns === undefined) {
                        selector.columns = true;
                    }
                    if (selector.columns) {
                        const columns = {};
                        if (selector.columns === true) {
                            for (const k in table) {
                                if (k[0] !== "_") {
                                    columns[k] = table[k];
                                }
                            }
                        }
                        else {
                            const columnEntries = Object.entries(selector.columns);
                            const mode = columnEntries.length > 0 && columnEntries[0][1];
                            if (mode) {
                                for (const [k, v] of columnEntries) {
                                    if (v && k[0] !== "_") {
                                        if (!Object.prototype.hasOwnProperty.call(table, k)) {
                                            throw new utils_ts_1.HttpError(`(${resourceId}) Invalid column '${k}' in select query of table '${tableId}'`, utils_ts_1.Status._400_BadRequest);
                                        }
                                        columns[k] = table[k];
                                    }
                                }
                            }
                            else {
                                for (const k in table) {
                                    if (k[0] !== "_" &&
                                        selector.columns[k] !== false) {
                                        columns[k] = table[k];
                                    }
                                }
                            }
                        }
                        result.rows = yield tx
                            .update(table)
                            .set(ctx.body)
                            .where(selector.where &&
                            selector.where(table, utils_ts_1.operators))
                            .returning(columns);
                    }
                    else {
                        const info = yield tx
                            .update(table)
                            .set(ctx.body)
                            .where(selector.where &&
                            selector.where(table, utils_ts_1.operators));
                        result.rowsAffected = info.rowsAffected;
                    }
                    const countTotal = (_a = query.countTotal) !== null && _a !== void 0 ? _a : aclEntry.countTotal;
                    if (countTotal) {
                        const total = yield tx.$count(table, aclSelector.where && aclSelector.where(ctx, table, utils_ts_1.operators));
                        result.total = total;
                    }
                    if (aclSelector.afterQuery) {
                        yield aclSelector.afterQuery(ctx);
                    }
                    return result;
                }));
                ctx.result = result;
                const res = formatResult(req, ctx);
                return res instanceof Response ? res : (0, utils_ts_1.status)(utils_ts_1.Status._204_NoContent);
            }
            catch (error) {
                if (aclSelector.onQueryError) {
                    const res = yield aclSelector.onQueryError(error instanceof Error ? error : new Error(String(error)), ctx);
                    if (res instanceof Response) {
                        return res;
                    }
                }
                throw error;
            }
        }
        catch (error) {
            onError && onError(error);
            return (0, utils_ts_1.json)({
                error: error.cause ||
                    error.message ||
                    "Something went wrong",
            }, {
                status: error.status || utils_ts_1.Status._500_InternalServerError,
            });
        }
    });
    //
    ///// DELETE
    //
    routes.DELETE = (req) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            const resourceId = req.params[idParam];
            const url = new URL(req.url);
            const queryParams = {};
            for (const [k, v] of url.searchParams.entries()) {
                queryParams[k] = v;
            }
            const query = (0, types_ts_1.TDeleteQuery)(queryParams);
            if (query instanceof arktype_1.ArkErrors) {
                return (0, utils_ts_1.json)({
                    error: query.toString() || "Something went wrong",
                }, {
                    status: utils_ts_1.Status._400_BadRequest,
                });
            }
            const ctx = {
                url,
                query,
                resourceId,
            };
            // PARSE SESSION AND AUTHENTICATE
            {
                const res = yield parseAuth(req, ctx);
                if (res instanceof Response) {
                    return res;
                }
            }
            const { select } = query;
            const aclEntry = acl &&
                acl[resourceId];
            if (aclEntry == null) {
                return (0, utils_ts_1.json)({
                    error: "Resource not found",
                }, {
                    status: utils_ts_1.Status._404_NotFound,
                });
            }
            const aclRule = aclEntry.control.DELETE;
            if (aclRule == null) {
                return (0, utils_ts_1.json)({
                    error: "ACL rule not defined for the method",
                }, {
                    status: utils_ts_1.Status._404_NotFound,
                });
            }
            const aclSelector = (_d = (query["mine|guest"]
                ? ((_b = (ctx.userRole && ((_a = aclRule[ctx.userRole]) !== null && _a !== void 0 ? _a : aclRule.mine))) !== null && _b !== void 0 ? _b : aclRule.guest)
                : query.guest
                    ? aclRule.guest
                    : ctx.userRole
                        ? ((_c = aclRule[ctx.userRole]) !== null && _c !== void 0 ? _c : aclRule.mine)
                        : aclRule.guest)) !== null && _d !== void 0 ? _d : aclRule.all;
            if (!aclSelector) {
                return (0, utils_ts_1.json)({
                    error: "Resource forbidden",
                }, {
                    status: utils_ts_1.Status._403_Forbidden,
                });
            }
            const tableId = aclEntry.table || resourceId;
            const selector = {};
            try {
                deepCombine(selector, resourceId, tableId, ctx, aclSelector, select, aclEntry, aclEntry.maxDepth != null
                    ? aclEntry.maxDepth
                    : aclEntry.maxDepth === null
                        ? undefined
                        : defaults === null || defaults === void 0 ? void 0 : defaults.maxDepth);
            }
            catch (error) {
                return (0, utils_ts_1.json)({
                    error: error.message || "Something went wrong",
                }, {
                    status: error.status || utils_ts_1.Status._400_BadRequest,
                });
            }
            const formatResult = (_e = aclEntry.formatResult) !== null && _e !== void 0 ? _e : defaultResultFormatter;
            try {
                const result = yield database.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a;
                    ctx.tx = tx;
                    if (aclSelector.beforeQuery) {
                        yield aclSelector.beforeQuery(ctx);
                    }
                    const table = schema[tableId];
                    const result = { rows: null };
                    if (selector.columns === undefined) {
                        selector.columns = true;
                    }
                    if (selector.columns) {
                        const columns = {};
                        if (selector.columns === true) {
                            for (const k in table) {
                                if (k[0] !== "_") {
                                    columns[k] = table[k];
                                }
                            }
                        }
                        else {
                            const columnEntries = Object.entries(selector.columns);
                            const mode = columnEntries.length > 0 && columnEntries[0][1];
                            if (mode) {
                                for (const [k, v] of columnEntries) {
                                    if (v && k[0] !== "_") {
                                        if (!Object.prototype.hasOwnProperty.call(table, k)) {
                                            throw new utils_ts_1.HttpError(`(${resourceId}) Invalid column '${k}' in select query of table '${tableId}'`, utils_ts_1.Status._400_BadRequest);
                                        }
                                        columns[k] = table[k];
                                    }
                                }
                            }
                            else {
                                for (const k in table) {
                                    if (k[0] !== "_" &&
                                        selector.columns[k] !== false) {
                                        columns[k] = table[k];
                                    }
                                }
                            }
                        }
                        result.rows = yield tx
                            .delete(table)
                            .where(selector.where &&
                            selector.where(table, utils_ts_1.operators))
                            .returning(columns);
                    }
                    else {
                        const info = yield tx
                            .delete(table)
                            .where(selector.where &&
                            selector.where(table, utils_ts_1.operators));
                        result.rowsAffected = info.rowsAffected;
                    }
                    const countTotal = (_a = query.countTotal) !== null && _a !== void 0 ? _a : aclEntry.countTotal;
                    if (countTotal) {
                        const total = yield tx.$count(table, aclSelector.where && aclSelector.where(ctx, table, utils_ts_1.operators));
                        result.total = total;
                    }
                    if (aclSelector.afterQuery) {
                        yield aclSelector.afterQuery(ctx);
                    }
                    return result;
                }));
                ctx.result = result;
                const res = formatResult(req, ctx);
                return res instanceof Response ? res : (0, utils_ts_1.status)(utils_ts_1.Status._204_NoContent);
            }
            catch (error) {
                if (aclSelector.onQueryError) {
                    const res = yield aclSelector.onQueryError(error instanceof Error ? error : new Error(String(error)), ctx);
                    if (res instanceof Response) {
                        return res;
                    }
                }
                throw error;
            }
        }
        catch (error) {
            onError && onError(error);
            return (0, utils_ts_1.json)({
                error: error.cause ||
                    error.message ||
                    "Something went wrong",
            }, {
                status: error.status || utils_ts_1.Status._500_InternalServerError,
            });
        }
    });
    return routes;
};
exports.createQueryRoute = createQueryRoute;
//# sourceMappingURL=query.js.map