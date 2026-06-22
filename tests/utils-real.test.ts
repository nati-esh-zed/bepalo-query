import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  HttpError,
  json,
  status,
  Status,
  SurpassMaxLimit,
  parseBody,
  operators,
} from "../src/utils";
import { RJSON } from "@bepalo/rjson";

describe("HttpError", () => {
  it("should create an HttpError with message and status", () => {
    const error = new HttpError("Not found", 404);
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
    expect(error instanceof Error).toBe(true);
  });

  it("should default status to 500 if not provided", () => {
    const error = new HttpError("Server error", undefined as any);
    expect(error.status).toBe(500);
  });

  it("should preserve error message through stack", () => {
    const error = new HttpError("Test error", 400);
    expect(error.message).toBe("Test error");
    expect(error.stack).toBeDefined();
  });
});

describe("Status Enum", () => {
  it("should have 2xx success codes", () => {
    expect(Status._200_OK).toBe(200);
    expect(Status._201_Created).toBe(201);
    expect(Status._204_NoContent).toBe(204);
  });

  it("should have 4xx client error codes", () => {
    expect(Status._400_BadRequest).toBe(400);
    expect(Status._401_Unauthorized).toBe(401);
    expect(Status._403_Forbidden).toBe(403);
    expect(Status._404_NotFound).toBe(404);
  });

  it("should have 5xx server error codes", () => {
    expect(Status._500_InternalServerError).toBe(500);
    expect(Status._503_ServiceUnavailable).toBe(503);
  });
});

describe("json() helper", () => {
  it("should create JSON response with default 200 status", () => {
    const response = json({ message: "ok" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should accept custom status code", () => {
    const response = json({ error: "not found" }, { status: 404 });
    expect(response.status).toBe(404);
  });

  it("should serialize complex objects", async () => {
    const response = json({ user: { id: 1, name: "John" } });
    const body = await response.json();
    expect(body.user.id).toBe(1);
    expect(body.user.name).toBe("John");
  });

  it("should handle arrays", async () => {
    const response = json([1, 2, 3]);
    const body = await response.json();
    expect(body).toEqual([1, 2, 3]);
  });

  it("should handle null values", async () => {
    const response = json(null);
    const body = await response.json();
    expect(body).toBeNull();
  });
});

describe("status() helper", () => {
  it("should create response with specified status", () => {
    const response = status(200, "OK");
    expect(response.status).toBe(200);
  });

  it("should handle null content", () => {
    const response = status(204, null);
    expect(response.status).toBe(204);
  });

  it("should handle undefined content", () => {
    const response = status(304);
    expect(response.status).toBe(304);
  });

  it("should support custom headers via init", () => {
    const response = status(201, "Created", {
      headers: { "X-Custom": "value" },
    });
    expect(response.headers.get("X-Custom")).toBe("value");
  });

  it("should set status code in init correctly", () => {
    const response = status(500, "Internal Server Error");
    expect(response.status).toBe(500);
  });
});

describe("SurpassMaxLimit enum", () => {
  it("should have Limit value", () => {
    expect(SurpassMaxLimit.Limit).toBe(0);
  });

  it("should have Throw value", () => {
    expect(SurpassMaxLimit.Throw).toBe(1);
  });
});

describe("operators", () => {
  it("should be defined", () => {
    expect(operators).toBeDefined();
  });

  it("should have standard comparison operators", () => {
    expect(operators).toHaveProperty("eq");
    expect(operators).toHaveProperty("ne");
    expect(operators).toHaveProperty("lt");
    expect(operators).toHaveProperty("lte");
    expect(operators).toHaveProperty("gt");
    expect(operators).toHaveProperty("gte");
  });

  it("should have like operators", () => {
    expect(operators).toHaveProperty("like");
    expect(operators).toHaveProperty("notLike");
    expect(operators).toHaveProperty("ilike");
  });

  it("should have array operators", () => {
    expect(operators).toHaveProperty("inArray");
    expect(operators).toHaveProperty("notInArray");
  });
});

describe("parseBody middleware", () => {
  it("should accept application/json by default", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "value" }),
    });

    const ctx: any = {};
    const handler = parseBody();
    const result = await handler(request, ctx);

    expect(result).toBeUndefined(); // No error response
    expect(ctx.body).toEqual({ key: "value" });
  });

  it("should accept application/rjson by default", async () => {
    const body = { test: 123 };
    const rjsonContent = RJSON.stringify(body);

    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/rjson" },
      body: rjsonContent,
    });

    const ctx: any = {};
    const handler = parseBody();
    const result = await handler(request, ctx);

    expect(result).toBeUndefined();
    expect(ctx.body).toEqual(body);
  });

  it("should reject unsupported media type", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/xml" },
      body: "<xml></xml>",
    });

    const ctx: any = {};
    const handler = parseBody();
    const result = await handler(request, ctx);

    expect(result?.status).toBe(Status._415_UnsupportedMediaType);
  });

  it("should respect accept option", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const ctx: any = {};
    const handler = parseBody({ accept: "application/rjson" });
    const result = await handler(request, ctx);

    expect(result?.status).toBe(Status._415_UnsupportedMediaType);
  });

  it("should handle payload too large", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "2000000",
      },
      body: null as any,
    });

    vi.spyOn(request.body!, "cancel");

    const ctx: any = {};
    const handler = parseBody({ maxSize: 1024 });
    const result = await handler(request, ctx);

    expect(result?.status).toBe(Status._413_PayloadTooLarge);
  });

  it("should handle empty payload", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "0",
      },
      body: null as any,
    });

    const ctx: any = {};
    const handler = parseBody();
    const result = await handler(request, ctx);

    expect(result).toBeUndefined();
    expect(ctx.body).toBeUndefined();
  });

  it("should handle malformed JSON", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid json}",
    });

    const ctx: any = {};
    const handler = parseBody();
    const result = await handler(request, ctx);

    expect(result?.status).toBe(Status._400_BadRequest);
  });

  it("should skip parsing if once=true and body exists", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ new: "data" }),
    });

    const ctx: any = { body: { existing: "data" } };
    const handler = parseBody({ once: true });
    const result = await handler(request, ctx);

    expect(result).toBeUndefined();
    expect(ctx.body).toEqual({ existing: "data" });
  });

  it("should handle form-urlencoded data", async () => {
    const params = new URLSearchParams();
    params.append("name", "John");
    params.append("age", "30");

    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const ctx: any = {};
    const handler = parseBody();
    const result = await handler(request, ctx);

    expect(result).toBeUndefined();
    expect(ctx.body.name).toBe("John");
    expect(ctx.body.age).toBe("30");
  });

  it("should clone request if clone=true", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: "test" }),
    });

    const ctx: any = {};
    const handler = parseBody({ clone: true });
    const result = await handler(request, ctx);

    expect(result).toBeUndefined();
    expect(ctx.body).toEqual({ data: "test" });
  });

  it("should handle multiple accept types", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/rjson" },
      body: RJSON.stringify({ test: 1 }),
    });

    const ctx: any = {};
    const handler = parseBody({
      accept: ["application/json", "application/rjson"],
    });
    const result = await handler(request, ctx);

    expect(result).toBeUndefined();
    expect(ctx.body).toEqual({ test: 1 });
  });

  it("should extract content-type without charset", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ data: "test" }),
    });

    const ctx: any = {};
    const handler = parseBody();
    const result = await handler(request, ctx);

    expect(result).toBeUndefined();
    expect(ctx.body).toEqual({ data: "test" });
  });
});
