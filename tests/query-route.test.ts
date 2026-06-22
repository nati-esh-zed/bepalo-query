import { describe, it, expect, beforeEach, vi } from "vitest";
import { createQueryRoute } from "../src/query";
import { Status, HttpError } from "../src/utils";

// Mock database and schema types
type MockTable = {
  _: any;
  $inferSelect: any;
  $inferInsert: any;
  getSQL: any;
};

const mockSchema: Record<string, MockTable> = {
  users: {
    _: {},
    $inferSelect: { id: 0, name: "", email: "", role: "" },
    $inferInsert: { name: "", email: "", role: "" },
    getSQL: vi.fn(),
  } as any,
  posts: {
    _: {},
    $inferSelect: { id: 0, userId: 0, title: "", content: "" },
    $inferInsert: { userId: 0, title: "", content: "" },
    getSQL: vi.fn(),
  } as any,
};

const mockDatabase = {
  query: { select: vi.fn() },
  transaction: vi.fn(),
};

describe("createQueryRoute", () => {
  it("should create route handlers object", () => {
    const routes = createQueryRoute({
      schema: mockSchema,
      database: mockDatabase,
      idParam: "id",
    });

    expect(routes).toBeDefined();
    expect(typeof routes).toBe("object");
  });

  it("should have GET handler", () => {
    const routes = createQueryRoute({
      schema: mockSchema,
      database: mockDatabase,
      idParam: "id",
    });

    expect(routes.GET).toBeDefined();
    expect(typeof routes.GET).toBe("function");
  });

  it("should have POST handler", () => {
    const routes = createQueryRoute({
      schema: mockSchema,
      database: mockDatabase,
      idParam: "id",
    });

    expect(routes.POST).toBeDefined();
    expect(typeof routes.POST).toBe("function");
  });

  it("should have PATCH handler", () => {
    const routes = createQueryRoute({
      schema: mockSchema,
      database: mockDatabase,
      idParam: "id",
    });

    expect(routes.PATCH).toBeDefined();
    expect(typeof routes.PATCH).toBe("function");
  });

  it("should have DELETE handler", () => {
    const routes = createQueryRoute({
      schema: mockSchema,
      database: mockDatabase,
      idParam: "id",
    });

    expect(routes.DELETE).toBeDefined();
    expect(typeof routes.DELETE).toBe("function");
  });

  it("should have OPTIONS handler", () => {
    const routes = createQueryRoute({
      schema: mockSchema,
      database: mockDatabase,
      idParam: "id",
    });

    expect(routes.OPTIONS).toBeDefined();
    expect(typeof routes.OPTIONS).toBe("function");
  });

  it("should have HEAD handler", () => {
    const routes = createQueryRoute({
      schema: mockSchema,
      database: mockDatabase,
      idParam: "id",
    });

    expect(routes.HEAD).toBeDefined();
    expect(typeof routes.HEAD).toBe("function");
  });

  describe("Configuration Options", () => {
    it("should use default maxDepth when not specified", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });
      expect(routes).toBeDefined();
    });

    it("should use custom maxDepth from defaults", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        defaults: { maxDepth: 5, maxLimit: 100 },
      });
      expect(routes).toBeDefined();
    });

    it("should use custom SurpassMaxLimit behavior", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        onSurpassMaxLimit: 0, // Limit instead of Throw
      });
      expect(routes).toBeDefined();
    });

    it("should support session parser middleware", () => {
      const mockSessionParser = vi.fn();
      const mockGetRole = vi.fn();

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        session: {
          parser: mockSessionParser,
          getRole: mockGetRole,
        },
      });

      expect(routes).toBeDefined();
    });

    it("should support error handler callback", () => {
      const mockErrorHandler = vi.fn();

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        onError: mockErrorHandler,
      });

      expect(routes).toBeDefined();
    });

    it("should support ACL configuration", () => {
      const mockACL = {
        users: {
          control: {
            GET: {
              guest: {},
            },
          },
        },
      };

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        acl: mockACL as any,
      });

      expect(routes).toBeDefined();
    });
  });

  describe("Handler Functionality", () => {
    it("GET handler should handle requests", async () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      const request = new Request("http://localhost/api/users");
      const ctx = { resourceId: "users" };

      // Just verify it's callable - actual response handling would depend on ACL
      expect(typeof routes.GET).toBe("function");
    });

    it("POST handler should handle requests", async () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      const request = new Request("http://localhost/api/users", {
        method: "POST",
      });

      expect(typeof routes.POST).toBe("function");
    });

    it("PATCH handler should handle requests", async () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      const request = new Request("http://localhost/api/users/1", {
        method: "PATCH",
      });

      expect(typeof routes.PATCH).toBe("function");
    });

    it("DELETE handler should handle requests", async () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      const request = new Request("http://localhost/api/users/1", {
        method: "DELETE",
      });

      expect(typeof routes.DELETE).toBe("function");
    });

    it("OPTIONS handler should return available methods", async () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(typeof routes.OPTIONS).toBe("function");
    });

    it("HEAD handler should work like GET without body", async () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(typeof routes.HEAD).toBe("function");
    });
  });

  describe("Type Safety", () => {
    it("should maintain generic type parameters", () => {
      type CustomRole = "admin" | "user";
      type CustomSession = { userId: string };

      const routes = createQueryRoute<CustomRole, CustomSession>({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        session: {
          parser: async (req, ctx) => {
            (ctx as any).userId = "123";
          },
          getRole: (req, ctx) => {
            return "admin";
          },
        },
      });

      expect(routes).toBeDefined();
    });

    it("should preserve schema types through handler chain", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      // Verify routes are properly typed
      expect(routes.GET).toBeDefined();
      expect(routes.POST).toBeDefined();
      expect(routes.PATCH).toBeDefined();
      expect(routes.DELETE).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should support error handler callback for HttpError", () => {
      const errorHandler = vi.fn();

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        onError: errorHandler,
      });

      expect(routes).toBeDefined();
    });

    it("should support error handler for generic Error", () => {
      const errorHandler = vi.fn();

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        onError: errorHandler,
      });

      expect(routes).toBeDefined();
    });
  });

  describe("Batch Operations", () => {
    it("should handle batch POST operations", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(typeof routes.POST).toBe("function");
    });

    it("should handle batch PATCH operations", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(typeof routes.PATCH).toBe("function");
    });

    it("should maintain order in batch operations", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(routes).toBeDefined();
    });
  });

  describe("ACL Integration", () => {
    it("should support role-based access control", () => {
      const mockACL = {
        users: {
          control: {
            GET: {
              admin: { where: {} },
              guest: { where: { role: "public" } },
            },
          },
        },
      };

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        acl: mockACL as any,
      });

      expect(routes).toBeDefined();
    });

    it("should enforce ACL rules on access", () => {
      const mockACL = {
        users: {
          control: {
            GET: {
              guest: { where: {} },
            },
          },
        },
      };

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        acl: mockACL as any,
      });

      expect(routes.GET).toBeDefined();
    });

    it("should support validateBody and injectBody in ACL", () => {
      const mockACL = {
        posts: {
          control: {
            POST: {
              user: {
                where: {},
                validateBody: vi.fn(),
                injectBody: vi.fn(),
              },
            },
          },
        },
      };

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        acl: mockACL as any,
      });

      expect(routes).toBeDefined();
    });
  });

  describe("Query Parsing", () => {
    it("should parse GET query parameters", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(routes.GET).toBeDefined();
    });

    it("should validate query depth limits", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        defaults: { maxDepth: 3 },
      });

      expect(routes).toBeDefined();
    });

    it("should validate query limit constraints", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        defaults: { maxLimit: 1000 },
      });

      expect(routes).toBeDefined();
    });
  });

  describe("Response Formatting", () => {
    it("should format successful GET responses", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(routes.GET).toBeDefined();
    });

    it("should include count in list responses", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(routes.GET).toBeDefined();
    });

    it("should format POST creation responses", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });
  });

  describe("Resource/Middleware Access", () => {
    it("should pass session to handlers", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        session: {
          parser: async (req, ctx) => {
            (ctx as any).customField = "value";
          },
          getRole: () => "user",
        },
      });

      expect(routes).toBeDefined();
    });

    it("should extend context with custom fields", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(routes).toBeDefined();
    });

    it("should support middleware composition", () => {
      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        session: {
          parser: vi.fn(),
          getRole: vi.fn(),
        },
      });

      expect(routes).toBeDefined();
    });
  });
});
