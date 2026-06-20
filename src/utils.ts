import { RJSON } from "@bepalo/rjson";
import { CTXBody, RequestHandler } from "./types.ts";
import { getOperators, type Operators } from "drizzle-orm";

export class HttpError extends Error {
  status: number = 500;
  constructor(message: string, status: number) {
    super(message);
    this.status = status || 500;
  }
}

export const operators: Operators = getOperators();

export enum SurpassMaxLimit {
  Limit = 0,
  Throw,
}

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
export const json = (payload: any, init?: ResponseInit) => {
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
      await _req.body?.cancel().catch(() => {});
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
        await _req.body?.cancel().catch(() => {});
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
      await _req.body?.cancel().catch(() => {});
      return json(
        { error: "Malformed Payload" },
        { status: Status._400_BadRequest },
      );
    }
  };
};
