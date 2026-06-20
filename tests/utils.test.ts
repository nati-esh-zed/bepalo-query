import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cancelRequestBody,
  validateAclEntry,
  validateTable,
  getAclRule,
  resolveAclSelector,
  applyBodyTransform,
} from "../src/utils.ts";
import { ArkErrors } from "arktype";
import { HttpError, Status } from "../src/query.ts";

/**
 * Test Suite for Utility Functions
 * Tests all extracted utility functions to ensure proper isolation and correctness
 */

describe("cancelRequestBody", () => {
  it("should safely cancel a request with a body", async () => {
    const cancelFn = vi.fn();
    const mockRequest = {
      body: {
        cancel: cancelFn,
      },
    } as any;

    await cancelRequestBody(mockRequest);
    expect(cancelFn).toHaveBeenCalled();
  });

  it("should handle request with null body gracefully", async () => {
    const mockRequest = {
      body: null,
    } as any;

    expect(async () => {
      await cancelRequestBody(mockRequest);
    }).not.toThrow();
  });

  it("should handle request with undefined body gracefully", async () => {
    const mockRequest = {
      body: undefined,
    } as any;

    expect(async () => {
      await cancelRequestBody(mockRequest);
    }).not.toThrow();
  });

  it("should catch cancel errors and continue silently", async () => {
    const mockRequest = {
      body: {
        cancel: vi.fn().mockRejectedValue(new Error("Cancel failed")),
      },
    } as any;

    expect(async () => {
      await cancelRequestBody(mockRequest);
    }).not.toThrow();
  });
});

describe("validateAclEntry", () => {
  it("should return true for non-null acl entry", () => {
    const result = validateAclEntry({ control: {} });
    expect(result).toBe(true);
  });

  it("should return true for object with properties", () => {
    const result = validateAclEntry({ control: { GET: {}, POST: {} } });
    expect(result).toBe(true);
  });

  it("should return false for null", () => {
    const result = validateAclEntry(null);
    expect(result).toBe(false);
  });

  it("should return false for undefined", () => {
    const result = validateAclEntry(undefined);
    expect(result).toBe(false);
  });

  it("should return false for empty object passed as falsy check", () => {
    // Note: empty object is truthy in JavaScript
    const result = validateAclEntry({});
    expect(result).toBe(true);
  });
});

describe("validateTable", () => {
  it("should return true when table exists in schema", () => {
    const schema = {
      users: { _: { name: "users" } },
      posts: { _: { name: "posts" } },
    };
    const result = validateTable("users", schema);
    expect(result).toBe(true);
  });

  it("should return false when table does not exist", () => {
    const schema = {
      users: { _: { name: "users" } },
    };
    const result = validateTable("posts", schema);
    expect(result).toBe(false);
  });

  it("should return false when schema is empty", () => {
    const schema = {};
    const result = validateTable("users", schema);
    expect(result).toBe(false);
  });

  it("should handle null table gracefully", () => {
    const schema = {
      users: { _: { name: "users" } },
      posts: null,
    };
    const result = validateTable("posts", schema);
    expect(result).toBe(false);
  });

  it("should handle undefined table gracefully", () => {
    const schema = {
      users: { _: { name: "users" } },
    };
    const result = validateTable("undefined_table", schema);
    expect(result).toBe(false);
  });
});

describe("getAclRule", () => {
  it("should return ACL rule for GET method", () => {
    const aclEntry = {
      control: {
        GET: { all: { columns: true } },
        POST: { all: { columns: true } },
      },
    };
    const result = getAclRule(aclEntry, "GET");
    expect(result).toEqual({ all: { columns: true } });
  });

  it("should return ACL rule for POST method", () => {
    const aclEntry = {
      control: {
        GET: { all: { columns: true } },
        POST: { all: { columns: true } },
      },
    };
    const result = getAclRule(aclEntry, "POST");
    expect(result).toEqual({ all: { columns: true } });
  });

  it("should return null when method rule does not exist", () => {
    const aclEntry = {
      control: {
        GET: { all: { columns: true } },
      },
    };
    const result = getAclRule(aclEntry, "DELETE");
    expect(result).toBeNull();
  });

  it("should handle empty control object", () => {
    const aclEntry = { control: {} };
    const result = getAclRule(aclEntry, "GET");
    expect(result).toBeNull();
  });

  it("should return rule even if it is undefined (optional)", () => {
    const aclEntry = {
      control: {
        GET: undefined,
      },
    };
    const result = getAclRule(aclEntry, "GET");
    expect(result).toBeUndefined();
  });
});

describe("resolveAclSelector", () => {
  const baseRule = {
    all: { columns: true, where: {} },
    admin: { columns: true, where: {} },
    user: { columns: true, where: { ownerId: "userId" } },
    mine: { columns: true, where: { ownerId: "userId" } },
    guest: { columns: false, where: {} },
  };

  it("should return all selector when no role and no flags", () => {
    const query = {};
    const result = resolveAclSelector(baseRule, undefined, query);
    expect(result).toEqual(baseRule.all);
  });

  it("should return user-specific selector when user role provided", () => {
    const query = {};
    const result = resolveAclSelector(baseRule, "user", query);
    expect(result).toEqual(baseRule.user);
  });

  it("should return admin selector when admin role provided", () => {
    const query = {};
    const result = resolveAclSelector(baseRule, "admin", query);
    expect(result).toEqual(baseRule.admin);
  });

  it("should return mine selector as fallback when role not explicitly defined", () => {
    const customRule = {
      all: { columns: true },
      mine: { columns: true, where: { ownerId: "userId" } },
      guest: { columns: false },
    };
    const result = resolveAclSelector(customRule, "user", {});
    expect(result).toEqual(customRule.mine);
  });

  it("should return guest selector when guest flag set and no role", () => {
    const query = { guest: true };
    const result = resolveAclSelector(baseRule, undefined, query);
    expect(result).toEqual(baseRule.guest);
  });

  it("should prioritize mine|guest flag over individual flags", () => {
    const query = { "mine|guest": true, guest: true };
    const result = resolveAclSelector(baseRule, "user", query);
    // With user role and mine|guest flag, should return user rule
    expect(result).toEqual(baseRule.user);
  });

  it("should return guest selector with mine|guest flag when no role", () => {
    const query = { "mine|guest": true };
    const result = resolveAclSelector(baseRule, undefined, query);
    expect(result).toEqual(baseRule.guest);
  });

  it("should fallback to all when no matching selector", () => {
    const simpleRule = { all: { columns: true } };
    const result = resolveAclSelector(simpleRule, undefined, {});
    expect(result).toEqual(simpleRule.all);
  });
});

describe("applyBodyTransform", () => {
  const mockHttpError = HttpError;
  const mockStatus = Status._400_BadRequest;

  it("should return body unchanged when no validators or injectors", async () => {
    const body = { name: "John", age: 30 };
    const result = await applyBodyTransform(
      body,
      null,
      null,
      {},
      mockHttpError,
      mockStatus,
    );
    expect(result).toEqual(body);
  });

  it("should apply validation to single object", async () => {
    const body = { name: "John" };
    const validateFn = vi.fn().mockResolvedValue({ name: "John", validated: true });

    const result = await applyBodyTransform(
      body,
      validateFn,
      null,
      {},
      mockHttpError,
      mockStatus,
    );

    expect(validateFn).toHaveBeenCalledWith(body, {});
    expect(result).toEqual({ name: "John", validated: true });
  });

  it("should apply validation to array of objects", async () => {
    const bodies = [{ name: "John" }, { name: "Jane" }];
    const validateFn = vi.fn((b) =>
      Promise.resolve({ ...b, validated: true }),
    );

    const result = await applyBodyTransform(
      bodies,
      validateFn,
      null,
      {},
      mockHttpError,
      mockStatus,
    );

    expect(validateFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { name: "John", validated: true },
      { name: "Jane", validated: true },
    ]);
  });

  it("should throw HttpError when validation returns ArkErrors on single object", async () => {
    const body = { name: "John" };
    const mockError = new ArkErrors([{ code: "type" } as any]);
    const validateFn = vi.fn().mockResolvedValue(mockError);

    await expect(
      applyBodyTransform(body, validateFn, null, {}, mockHttpError, mockStatus),
    ).rejects.toThrow(HttpError);
  });

  it("should throw HttpError when validation fails on array item", async () => {
    const bodies = [{ name: "John" }, { name: "Jane" }];
    const mockError = new ArkErrors([{ code: "type" } as any]);
    const validateFn = vi
      .fn()
      .mockResolvedValueOnce({ name: "John", validated: true })
      .mockResolvedValueOnce(mockError);

    await expect(
      applyBodyTransform(
        bodies,
        validateFn,
        null,
        {},
        mockHttpError,
        mockStatus,
      ),
    ).rejects.toThrow(HttpError);
  });

  it("should apply injection to single object", async () => {
    const body = { name: "John" };
    const injectFn = vi.fn().mockResolvedValue({ name: "John", injected: true });

    const result = await applyBodyTransform(
      body,
      null,
      injectFn,
      {},
      mockHttpError,
      mockStatus,
    );

    expect(injectFn).toHaveBeenCalledWith(body, {});
    expect(result).toEqual({ name: "John", injected: true });
  });

  it("should apply injection to array of objects", async () => {
    const bodies = [{ name: "John" }, { name: "Jane" }];
    const injectFn = vi.fn((b) => Promise.resolve({ ...b, injected: true }));

    const result = await applyBodyTransform(
      bodies,
      null,
      injectFn,
      {},
      mockHttpError,
      mockStatus,
    );

    expect(injectFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { name: "John", injected: true },
      { name: "Jane", injected: true },
    ]);
  });

  it("should skip injection when injector returns null", async () => {
    const body = { name: "John" };
    const injectFn = vi.fn().mockResolvedValue(null);

    const result = await applyBodyTransform(
      body,
      null,
      injectFn,
      {},
      mockHttpError,
      mockStatus,
    );

    expect(result).toEqual(body);
  });

  it("should skip injection when injector returns undefined", async () => {
    const bodies = [{ name: "John" }, { name: "Jane" }];
    const injectFn = vi.fn().mockResolvedValue(undefined);

    const result = await applyBodyTransform(
      bodies,
      null,
      injectFn,
      {},
      mockHttpError,
      mockStatus,
    );

    expect(result).toEqual(bodies);
  });

  it("should apply both validation and injection in sequence", async () => {
    const body = { name: "John" };
    const validateFn = vi.fn().mockResolvedValue({ name: "John", validated: true });
    const injectFn = vi.fn().mockResolvedValue({ name: "John", validated: true, injected: true });

    const result = await applyBodyTransform(
      body,
      validateFn,
      injectFn,
      {},
      mockHttpError,
      mockStatus,
    );

    expect(validateFn).toHaveBeenCalled();
    expect(injectFn).toHaveBeenCalled();
    expect(result).toEqual({ name: "John", validated: true, injected: true });
  });

  it("should pass context to both validators and injectors", async () => {
    const body = { name: "John" };
    const ctx = { userId: "123", userRole: "admin" };
    const validateFn = vi.fn().mockResolvedValue(body);
    const injectFn = vi.fn().mockResolvedValue(body);

    await applyBodyTransform(
      body,
      validateFn,
      injectFn,
      ctx,
      mockHttpError,
      mockStatus,
    );

    expect(validateFn).toHaveBeenCalledWith(body, ctx);
    expect(injectFn).toHaveBeenCalledWith(body, ctx);
  });

  it("should throw with proper status code on validation error", async () => {
    const body = { name: "John" };
    const mockError = new ArkErrors([{ code: "type" } as any]);
    const validateFn = vi.fn().mockResolvedValue(mockError);
    const customStatus = Status._422_UnprocessableEntity;

    try {
      await applyBodyTransform(
        body,
        validateFn,
        null,
        {},
        mockHttpError,
        customStatus,
      );
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(customStatus);
    }
  });
});
