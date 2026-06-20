import { describe, it, expect, vi } from "vitest";
import {
  validateAclEntry,
  validateTable,
  getAclRule,
  resolveAclSelector,
  applyBodyTransform,
} from "../src/utils.ts";
import { HttpError, Status } from "../src/query.ts";
import { ArkErrors } from "arktype";

/**
 * Edge Cases and Error Scenarios Tests
 * Tests boundary conditions, error states, and unusual inputs
 */

describe("Edge Cases - ACL Resolution", () => {
  describe("Selector Resolution with Complex Rules", () => {
    it("should handle deeply nested role hierarchies", () => {
      const complexRule = {
        all: { columns: true },
        admin: { columns: true },
        moderator: { columns: true, where: { status: "approved" } },
        user: { columns: true, where: { ownerId: "userId" } },
        restricted: { columns: false },
        mine: { columns: true, where: { ownerId: "userId" } },
        guest: { columns: false },
      };

      const result = resolveAclSelector(complexRule, "moderator", {});
      expect(result).toEqual(complexRule.moderator);
    });

    it("should handle missing intermediate roles gracefully", () => {
      const rule = {
        all: { columns: true },
        admin: { columns: true },
        mine: { columns: true },
        guest: { columns: false },
      };

      // Role 'super_admin' not defined - should fallback to mine or all
      const result = resolveAclSelector(rule, "super_admin", {});
      expect(result).toBeDefined();
    });

    it("should handle multiple conflicting flags correctly", () => {
      const rule = {
        all: { columns: true },
        user: { columns: true },
        mine: { columns: true, where: { ownerId: "userId" } },
        guest: { columns: false },
      };

      // mine|guest flag with guest flag - should prioritize mine|guest
      const result = resolveAclSelector(rule, "user", {
        "mine|guest": true,
        guest: true,
      });
      expect(result).toEqual(rule.user);
    });

    it("should resolve correctly when only guest selector exists", () => {
      const minimalRule = {
        guest: { columns: false },
      };

      const result = resolveAclSelector(minimalRule, undefined, {});
      expect(result).toBeDefined();
    });
  });
});

describe("Edge Cases - Validation", () => {
  describe("Body Transform with Invalid Inputs", () => {
    it("should handle empty body object", async () => {
      const result = await applyBodyTransform(
        {},
        null,
        null,
        {},
        HttpError,
        Status._400_BadRequest,
      );
      expect(result).toEqual({});
    });

    it("should handle empty body array", async () => {
      const result = await applyBodyTransform(
        [],
        null,
        null,
        {},
        HttpError,
        Status._400_BadRequest,
      );
      expect(result).toEqual([]);
    });

    it("should handle very large batch arrays", async () => {
      const largeBatch = Array(1000).fill({ id: 1 });
      const validateFn = vi.fn((b) => Promise.resolve(b));

      const result = await applyBodyTransform(
        largeBatch,
        validateFn,
        null,
        {},
        HttpError,
        Status._400_BadRequest,
      );

      expect(validateFn).toHaveBeenCalledTimes(1000);
      expect(result).toHaveLength(1000);
    });

    it("should handle special characters in body", async () => {
      const specialBody = {
        name: "John \"O'Brien\" <script>",
        email: "test@example.com",
      };

      const result = await applyBodyTransform(
        specialBody,
        null,
        null,
        {},
        HttpError,
        Status._400_BadRequest,
      );

      expect(result).toEqual(specialBody);
    });

    it("should handle unicode characters", async () => {
      const unicodeBody = {
        name: "José María",
        emoji: "🎉🚀",
        chinese: "你好世界",
      };

      const result = await applyBodyTransform(
        unicodeBody,
        null,
        null,
        {},
        HttpError,
        Status._400_BadRequest,
      );

      expect(result).toEqual(unicodeBody);
    });

    it("should handle null values in batch", async () => {
      const bodies = [
        { id: 1 },
        null,
        { id: 3 },
      ] as any;

      const validateFn = vi.fn((b) => Promise.resolve(b ?? { empty: true }));

      const result = await applyBodyTransform(
        bodies,
        validateFn,
        null,
        {},
        HttpError,
        Status._400_BadRequest,
      );

      expect(result).toHaveLength(3);
    });

    it("should handle nested objects", async () => {
      const nestedBody = {
        user: {
          profile: {
            settings: {
              notifications: {
                enabled: true,
              },
            },
          },
        },
      };

      const result = await applyBodyTransform(
        nestedBody,
        null,
        null,
        {},
        HttpError,
        Status._400_BadRequest,
      );

      expect(result).toEqual(nestedBody);
    });
  });

  describe("Validation Error Scenarios", () => {
    it("should handle multiple validation errors in array", async () => {
      const bodies = Array(5).fill({ invalid: true });
      const error = new ArkErrors([{ code: "type" } as any]);
      const validateFn = vi.fn().mockResolvedValue(error);

      try {
        await applyBodyTransform(
          bodies,
          validateFn,
          null,
          {},
          HttpError,
          Status._400_BadRequest,
        );
        expect.fail("Should have thrown on first error");
      } catch (e) {
        expect(e).toBeInstanceOf(HttpError);
        // Only called once before throwing
        expect(validateFn).toHaveBeenCalledTimes(1);
      }
    });

    it("should preserve error messages in validation", async () => {
      const body = { invalid: true };
      const errorMessage = "Field 'name' is required and missing";
      const mockError = new ArkErrors([
        { code: "type", message: errorMessage } as any,
      ]);
      const validateFn = vi.fn().mockResolvedValue(mockError);

      try {
        await applyBodyTransform(
          body,
          validateFn,
          null,
          {},
          HttpError,
          Status._400_BadRequest,
        );
        expect.fail("Should have thrown");
      } catch (e) {
        expect((e as HttpError).message).toBeDefined();
        expect((e as HttpError).status).toBe(Status._400_BadRequest);
      }
    });
  });
});

describe("Edge Cases - ACL Entry & Table Validation", () => {
  describe("Schema Edge Cases", () => {
    it("should handle schema with many tables", () => {
      const largeSchema: any = {};
      for (let i = 0; i < 100; i++) {
        largeSchema[`table_${i}`] = { _: { name: `table_${i}` } };
      }

      expect(validateTable("table_0", largeSchema)).toBe(true);
      expect(validateTable("table_99", largeSchema)).toBe(true);
      expect(validateTable("table_100", largeSchema)).toBe(false);
    });

    it("should handle tables with special characters in names", () => {
      const schema = {
        "user-profiles": { _: { name: "user-profiles" } },
        "post_comments": { _: { name: "post_comments" } },
        "order$info": { _: { name: "order$info" } },
      };

      expect(validateTable("user-profiles", schema)).toBe(true);
      expect(validateTable("post_comments", schema)).toBe(true);
      expect(validateTable("order$info", schema)).toBe(true);
    });

    it("should handle tables with numeric names", () => {
      const schema = {
        "2024_users": { _: { name: "2024_users" } },
        "v2_posts": { _: { name: "v2_posts" } },
      };

      expect(validateTable("2024_users", schema)).toBe(true);
      expect(validateTable("v2_posts", schema)).toBe(true);
    });
  });

  describe("ACL Entry Edge Cases", () => {
    it("should validate entries with empty control", () => {
      const entry = { control: {} };
      expect(validateAclEntry(entry)).toBe(true);
    });

    it("should validate entries with many methods", () => {
      const entry = {
        control: {
          GET: {},
          POST: {},
          PUT: {},
          PATCH: {},
          DELETE: {},
          HEAD: {},
          OPTIONS: {},
        },
      };
      expect(validateAclEntry(entry)).toBe(true);
    });

    it("should handle entries with mixed content", () => {
      const entry = {
        control: {
          GET: { all: {} },
          POST: null,
          PATCH: undefined,
        },
      };
      expect(validateAclEntry(entry)).toBe(true);
    });
  });

  describe("ACL Rule Retrieval Edge Cases", () => {
    it("should return null for non-existent method consistently", () => {
      const entry = {
        control: {
          GET: { all: {} },
          POST: { all: {} },
        },
      };

      expect(getAclRule(entry, "DELETE")).toBeNull();
      expect(getAclRule(entry, "PUT")).toBeNull();
      expect(getAclRule(entry, "TRACE")).toBeNull();
    });

    it("should handle method names with different cases", () => {
      const entry = {
        control: {
          GET: { all: {} },
          Post: { all: {} },
          patch: { all: {} },
        },
      };

      // Note: Should be exact match (case-sensitive)
      expect(getAclRule(entry, "GET")).toBeDefined();
      expect(getAclRule(entry, "get")).toBeNull();
      expect(getAclRule(entry, "Post")).toBeDefined();
      expect(getAclRule(entry, "post")).toBeNull();
    });

    it("should handle very long method strings", () => {
      const longMethod = "G".repeat(1000);
      const entry = {
        control: {
          [longMethod]: { all: {} },
        },
      };

      expect(getAclRule(entry, longMethod)).toBeDefined();
      expect(getAclRule(entry, longMethod + "X")).toBeNull();
    });
  });
});

describe("Edge Cases - Injection & Validation Flow", () => {
  it("should apply injection even when validation was skipped", async () => {
    const body = { name: "John" };
    const injectFn = vi.fn().mockResolvedValue({ name: "John", injected: true });

    const result = await applyBodyTransform(
      body,
      null, // No validation
      injectFn,
      {},
      HttpError,
      Status._400_BadRequest,
    );

    expect(injectFn).toHaveBeenCalled();
    expect(result).toEqual({ name: "John", injected: true });
  });

  it("should apply validation even when injection returns null", async () => {
    const body = { name: "John" };
    const validateFn = vi.fn().mockResolvedValue({ name: "John", validated: true });
    const injectFn = vi.fn().mockResolvedValue(null);

    const result = await applyBodyTransform(
      body,
      validateFn,
      injectFn,
      {},
      HttpError,
      Status._400_BadRequest,
    );

    expect(validateFn).toHaveBeenCalled();
    expect(result).toEqual({ name: "John", validated: true });
  });

  it("should handle mutation of body by injection", async () => {
    const originalBody = { name: "John" };
    const injectFn = vi.fn((b) => {
      b.injected = true;
      return b;
    });

    const result = await applyBodyTransform(
      originalBody,
      null,
      injectFn,
      {},
      HttpError,
      Status._400_BadRequest,
    );

    expect(result).toHaveProperty("injected", true);
  });

  it("should preserve context through entire transformation", async () => {
    const body = { name: "John" };
    const context = { userId: "123", role: "admin", timestamp: Date.now() };
    const validateFn = vi.fn().mockResolvedValue(body);
    const injectFn = vi.fn().mockResolvedValue(body);

    await applyBodyTransform(
      body,
      validateFn,
      injectFn,
      context,
      HttpError,
      Status._400_BadRequest,
    );

    // Both should receive exact same context
    expect(validateFn).toHaveBeenCalledWith(body, context);
    expect(injectFn).toHaveBeenCalledWith(body, context);
    expect(validateFn).toHaveBeenCalledBefore(injectFn as any);
  });
});

describe("Edge Cases - Boundary Values", () => {
  it("should handle zero limits", () => {
    const rule = {
      all: { limit: 0 },
      guest: { limit: 0 },
    };

    expect(resolveAclSelector(rule, undefined, {})).toBeDefined();
  });

  it("should handle negative values gracefully", () => {
    const rule = {
      all: { limit: -1 },
      guest: { limit: -100 },
    };

    expect(resolveAclSelector(rule, undefined, {})).toBeDefined();
  });

  it("should handle very large numbers", () => {
    const rule = {
      all: { limit: Number.MAX_SAFE_INTEGER },
      guest: { limit: Infinity },
    };

    expect(resolveAclSelector(rule, undefined, {})).toBeDefined();
  });

  it("should handle empty string as role", () => {
    const rule = {
      all: { columns: true },
      "": { columns: false },
      guest: { columns: false },
    };

    // Empty string is falsy but distinct from undefined/null
    const result = resolveAclSelector(rule, "", {});
    expect(result).toBeDefined();
  });

  it("should handle whitespace-only role strings", () => {
    const rule = {
      all: { columns: true },
      " ": { columns: false },
      "\t": { columns: false },
      guest: { columns: false },
    };

    expect(resolveAclSelector(rule, " ", {})).toBeDefined();
    expect(resolveAclSelector(rule, "\t", {})).toBeDefined();
  });
});

describe("Edge Cases - Concurrency", () => {
  it("should handle concurrent batch transformations", async () => {
    const bodies = Array(10).fill({ id: 1 });
    const validateFn = vi.fn((b) =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ ...b, validated: true }), Math.random() * 10);
      }),
    );

    const result = await applyBodyTransform(
      bodies,
      validateFn,
      null,
      {},
      HttpError,
      Status._400_BadRequest,
    );

    expect(result).toHaveLength(10);
    expect(result.every((r) => r.validated)).toBe(true);
  });

  it("should maintain order during concurrent processing", async () => {
    const bodies = Array(100).map((_, i) => ({ index: i }));
    const validateFn = vi.fn((b) => Promise.resolve(b));

    const result = await applyBodyTransform(
      bodies,
      validateFn,
      null,
      {},
      HttpError,
      Status._400_BadRequest,
    );

    expect(result.map((r) => r.index)).toEqual(bodies.map((_, i) => i));
  });
});
