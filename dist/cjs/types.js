"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDeleteQuery = exports.TPatchBody = exports.TPatchQuery = exports.TPostBody = exports.TPostQuery = exports.TGetQuery = exports.TOptionsQuery = exports.TSelectorDelete = exports.TSelectorPatch = exports.TSelectorPost = exports.TSelectorGet = exports.QueryScope = void 0;
const arktype_1 = require("arktype");
const rjson_1 = require("@bepalo/rjson");
exports.QueryScope = (0, arktype_1.scope)({
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
exports.TSelectorGet = exports.QueryScope.type("GetSelector");
exports.TSelectorPost = exports.QueryScope.type("PostSelector");
exports.TSelectorPatch = exports.QueryScope.type("PatchSelector");
exports.TSelectorDelete = exports.QueryScope.type("DeleteSelector");
exports.TOptionsQuery = (0, arktype_1.type)((0, arktype_1.type)({
    "guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine|guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
}));
exports.TGetQuery = (0, arktype_1.type)({
    "findFirst?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine|guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "countTotal?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "select?": (0, arktype_1.type)("string")
        .pipe((args) => rjson_1.RJSON.parse(args))
        .to(exports.TSelectorGet),
});
exports.TPostQuery = (0, arktype_1.type)((0, arktype_1.type)({
    "guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine|guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "countTotal?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "select?": (0, arktype_1.type)("string")
        .pipe((args) => rjson_1.RJSON.parse(args))
        .to(exports.TSelectorPost),
}));
exports.TPostBody = (0, arktype_1.type)("Record<string, unknown>|Record<string, unknown>[]");
exports.TPatchQuery = (0, arktype_1.type)((0, arktype_1.type)({
    "guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine|guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "countTotal?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "select?": (0, arktype_1.type)("string")
        .pipe((args) => rjson_1.RJSON.parse(args))
        .to(exports.TSelectorPatch),
}));
exports.TPatchBody = (0, arktype_1.type)("Record<string, unknown>");
exports.TDeleteQuery = (0, arktype_1.type)((0, arktype_1.type)({
    "guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "mine|guest?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "countTotal?": (0, arktype_1.type)("'T'|'F'|''")
        .pipe((args) => args.charCodeAt(0) !== 70)
        .to("boolean"),
    "select?": (0, arktype_1.type)("string")
        .pipe((args) => rjson_1.RJSON.parse(args))
        .to(exports.TSelectorDelete),
}));
//# sourceMappingURL=types.js.map