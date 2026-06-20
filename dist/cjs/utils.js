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
exports.parseBody = exports.status = exports.json = exports.Status = exports.SurpassMaxLimit = exports.operators = exports.HttpError = void 0;
const rjson_1 = require("@bepalo/rjson");
const drizzle_orm_1 = require("drizzle-orm");
class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.status = 500;
        this.status = status || 500;
    }
}
exports.HttpError = HttpError;
exports.operators = (0, drizzle_orm_1.getOperators)();
var SurpassMaxLimit;
(function (SurpassMaxLimit) {
    SurpassMaxLimit[SurpassMaxLimit["Limit"] = 0] = "Limit";
    SurpassMaxLimit[SurpassMaxLimit["Throw"] = 1] = "Throw";
})(SurpassMaxLimit || (exports.SurpassMaxLimit = SurpassMaxLimit = {}));
var Status;
(function (Status) {
    Status[Status["_100_Continue"] = 100] = "_100_Continue";
    Status[Status["_101_SwitchingProtocols"] = 101] = "_101_SwitchingProtocols";
    Status[Status["_102_Processing"] = 102] = "_102_Processing";
    Status[Status["_103_EarlyHints"] = 103] = "_103_EarlyHints";
    Status[Status["_200_OK"] = 200] = "_200_OK";
    Status[Status["_201_Created"] = 201] = "_201_Created";
    Status[Status["_202_Accepted"] = 202] = "_202_Accepted";
    Status[Status["_203_NonAuthoritativeInformation"] = 203] = "_203_NonAuthoritativeInformation";
    Status[Status["_204_NoContent"] = 204] = "_204_NoContent";
    Status[Status["_205_ResetContent"] = 205] = "_205_ResetContent";
    Status[Status["_206_PartialContent"] = 206] = "_206_PartialContent";
    Status[Status["_207_MultiStatus"] = 207] = "_207_MultiStatus";
    Status[Status["_208_AlreadyReported"] = 208] = "_208_AlreadyReported";
    Status[Status["_226_IMUsed"] = 226] = "_226_IMUsed";
    Status[Status["_300_MultipleChoices"] = 300] = "_300_MultipleChoices";
    Status[Status["_301_MovedPermanently"] = 301] = "_301_MovedPermanently";
    Status[Status["_302_Found"] = 302] = "_302_Found";
    Status[Status["_303_SeeOther"] = 303] = "_303_SeeOther";
    Status[Status["_304_NotModified"] = 304] = "_304_NotModified";
    Status[Status["_305_UseProxy"] = 305] = "_305_UseProxy";
    Status[Status["_307_TemporaryRedirect"] = 307] = "_307_TemporaryRedirect";
    Status[Status["_308_PermanentRedirect"] = 308] = "_308_PermanentRedirect";
    Status[Status["_400_BadRequest"] = 400] = "_400_BadRequest";
    Status[Status["_401_Unauthorized"] = 401] = "_401_Unauthorized";
    Status[Status["_402_PaymentRequired"] = 402] = "_402_PaymentRequired";
    Status[Status["_403_Forbidden"] = 403] = "_403_Forbidden";
    Status[Status["_404_NotFound"] = 404] = "_404_NotFound";
    Status[Status["_405_MethodNotAllowed"] = 405] = "_405_MethodNotAllowed";
    Status[Status["_406_NotAcceptable"] = 406] = "_406_NotAcceptable";
    Status[Status["_407_ProxyAuthenticationRequired"] = 407] = "_407_ProxyAuthenticationRequired";
    Status[Status["_408_RequestTimeout"] = 408] = "_408_RequestTimeout";
    Status[Status["_409_Conflict"] = 409] = "_409_Conflict";
    Status[Status["_410_Gone"] = 410] = "_410_Gone";
    Status[Status["_411_LengthRequired"] = 411] = "_411_LengthRequired";
    Status[Status["_412_PreconditionFailed"] = 412] = "_412_PreconditionFailed";
    Status[Status["_413_PayloadTooLarge"] = 413] = "_413_PayloadTooLarge";
    Status[Status["_414_URITooLong"] = 414] = "_414_URITooLong";
    Status[Status["_415_UnsupportedMediaType"] = 415] = "_415_UnsupportedMediaType";
    Status[Status["_416_RangeNotSatisfiable"] = 416] = "_416_RangeNotSatisfiable";
    Status[Status["_417_ExpectationFailed"] = 417] = "_417_ExpectationFailed";
    Status[Status["_418_IMATeapot"] = 418] = "_418_IMATeapot";
    Status[Status["_421_MisdirectedRequest"] = 421] = "_421_MisdirectedRequest";
    Status[Status["_422_UnprocessableEntity"] = 422] = "_422_UnprocessableEntity";
    Status[Status["_423_Locked"] = 423] = "_423_Locked";
    Status[Status["_424_FailedDependency"] = 424] = "_424_FailedDependency";
    Status[Status["_425_TooEarly"] = 425] = "_425_TooEarly";
    Status[Status["_426_UpgradeRequired"] = 426] = "_426_UpgradeRequired";
    Status[Status["_428_PreconditionRequired"] = 428] = "_428_PreconditionRequired";
    Status[Status["_429_TooManyRequests"] = 429] = "_429_TooManyRequests";
    Status[Status["_431_RequestHeaderFieldsTooLarge"] = 431] = "_431_RequestHeaderFieldsTooLarge";
    Status[Status["_451_UnavailableForLegalReasons"] = 451] = "_451_UnavailableForLegalReasons";
    Status[Status["_500_InternalServerError"] = 500] = "_500_InternalServerError";
    Status[Status["_501_NotImplemented"] = 501] = "_501_NotImplemented";
    Status[Status["_502_BadGateway"] = 502] = "_502_BadGateway";
    Status[Status["_503_ServiceUnavailable"] = 503] = "_503_ServiceUnavailable";
    Status[Status["_504_GatewayTimeout"] = 504] = "_504_GatewayTimeout";
    Status[Status["_505_HTTPVersionNotSupported"] = 505] = "_505_HTTPVersionNotSupported";
    Status[Status["_506_VariantAlsoNegotiates"] = 506] = "_506_VariantAlsoNegotiates";
    Status[Status["_507_InsufficientStorage"] = 507] = "_507_InsufficientStorage";
    Status[Status["_508_LoopDetected"] = 508] = "_508_LoopDetected";
    Status[Status["_510_NotExtended"] = 510] = "_510_NotExtended";
    Status[Status["_511_NetworkAuthenticationRequired"] = 511] = "_511_NetworkAuthenticationRequired";
    Status[Status["_419_PageExpired"] = 419] = "_419_PageExpired";
    Status[Status["_420_EnhanceYourCalm"] = 420] = "_420_EnhanceYourCalm";
    Status[Status["_450_BlockedbyWindowsParentalControls"] = 450] = "_450_BlockedbyWindowsParentalControls";
    Status[Status["_498_InvalidToken"] = 498] = "_498_InvalidToken";
    Status[Status["_499_TokenRequired"] = 499] = "_499_TokenRequired";
    Status[Status["_509_BandwidthLimitExceeded"] = 509] = "_509_BandwidthLimitExceeded";
    Status[Status["_526_InvalidSSLCertificate"] = 526] = "_526_InvalidSSLCertificate";
    Status[Status["_529_Siteisoverloaded"] = 529] = "_529_Siteisoverloaded";
    Status[Status["_530_Siteisfrozen"] = 530] = "_530_Siteisfrozen";
    Status[Status["_598_NetworkReadTimeoutError"] = 598] = "_598_NetworkReadTimeoutError";
    Status[Status["_599_NetworkConnectTimeoutError"] = 599] = "_599_NetworkConnectTimeoutError";
})(Status || (exports.Status = Status = {}));
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
const json = (payload, init) => {
    return Response.json(payload, init);
};
exports.json = json;
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
const status = (status, content, init) => {
    return new Response(content !== undefined ? content : null, Object.assign(Object.assign({}, init), { status }));
};
exports.status = status;
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
const parseBody = (options) => {
    var _a;
    const accept = (options === null || options === void 0 ? void 0 : options.accept)
        ? Array.isArray(options.accept)
            ? options.accept
            : [options.accept]
        : [
            "application/x-www-form-urlencoded",
            "application/json",
            "application/rjson",
        ];
    const maxSize = (_a = options === null || options === void 0 ? void 0 : options.maxSize) !== null && _a !== void 0 ? _a : 1024 * 1024; // Default 1MB
    const once = options === null || options === void 0 ? void 0 : options.once;
    const clone = options === null || options === void 0 ? void 0 : options.clone;
    return (_req, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (once && ctx.body)
            return;
        const contentType = (_a = _req.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.split(";", 2)[0];
        if (!(contentType && accept.includes(contentType))) {
            yield ((_b = _req.body) === null || _b === void 0 ? void 0 : _b.cancel().catch(() => { }));
            return (0, exports.json)({ error: "Unsupported Media Type" }, { status: Status._415_UnsupportedMediaType });
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
                yield ((_c = _req.body) === null || _c === void 0 ? void 0 : _c.cancel().catch(() => { }));
                return (0, exports.json)({ error: "Payload Too Large" }, { status: Status._413_PayloadTooLarge });
            }
            switch (contentType) {
                case "application/x-www-form-urlencoded": {
                    const body = yield req.formData();
                    ctx.body = {};
                    for (const [k, v] of body.entries()) {
                        ctx.body[k] = v;
                    }
                    break;
                }
                case "application/json": {
                    ctx.body = yield req.json();
                    break;
                }
                case "application/rjson":
                    ctx.body = rjson_1.RJSON.parse(yield req.text());
                    break;
                default:
                    ctx.body = undefined;
                    break;
            }
        }
        catch (_e) {
            yield ((_d = _req.body) === null || _d === void 0 ? void 0 : _d.cancel().catch(() => { }));
            return (0, exports.json)({ error: "Malformed Payload" }, { status: Status._400_BadRequest });
        }
    });
};
exports.parseBody = parseBody;
//# sourceMappingURL=utils.js.map