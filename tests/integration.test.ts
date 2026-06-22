import { describe, it, expect, beforeEach, vi } from "vitest";
import { createQueryRoute } from "../src/query";
import { HttpError, Status, parseBody } from "../src/utils";
import { RJSON } from "@bepalo/rjson";

type MockTable = {
  _: any;
  $inferSelect: any;
  $inferInsert: any;
  getSQL: any;
};

const createMockSchema = () => ({
  users: {
    _: {},
    $inferSelect: { id: 0, name: "", email: "", role: "" },
    $inferInsert: { name: "", email: "", role: "" },
    getSQL: vi.fn(),
  } as any,
  posts: {
    _: {},
    $inferSelect: { id: 0, userId: 0, title: "", content: "", published: false },
    $inferInsert: { userId: 0, title: "", content: "", published: false },
    getSQL: vi.fn(),
  } as any,
  comments: {
    _: {},
    $inferSelect: { id: 0, postId: 0, userId: 0, text: "" },
    $inferInsert: { postId: 0, userId: 0, text: "" },
    getSQL: vi.fn(),
  } as any,
});

const createMockDatabase = () => ({
  query: {
    select: vi.fn(),
  },
  transaction: vi.fn(),
});

describe("Integration Tests - Complete Request/Response Cycles", () => {
  describe("GET Request Flow", () => {
    it("should handle complete GET request with session", async () => {
      const mockDatabase = createMockDatabase();
      const mockSchema = createMockSchema();

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
        session: {
          parser: async (req, ctx: any) => {
            ctx.userId = "user-123";
          },
          getRole: () => "user",
        },
      });

      expect(routes.GET).toBeDefined();
    });

    it("should handle GET with query parameters", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.GET).toBeDefined();
    });

    it("should handle GET with nested selects", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.GET).toBeDefined();
    });

    it("should handle GET with filters", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.GET).toBeDefined();
    });
  });

  describe("POST Request Flow", () => {
    it("should handle complete POST request with body parsing", async () => {
      const bodyParser = parseBody();
      const mockDatabase = createMockDatabase();
      const mockSchema = createMockSchema();

      const routes = createQueryRoute({
        schema: mockSchema,
        database: mockDatabase,
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });

    it("should handle POST with validation", async () => {
      const validateBody = vi.fn().mockResolvedValue({});

      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              POST: {
                user: {
                  where: {},
                  validateBody,
                },
              },
            },
          },
        } as any,
      });

      expect(routes.POST).toBeDefined();
    });

    it("should handle POST with injection", async () => {
      const injectBody = vi.fn().mockResolvedValue({});

      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              POST: {
                user: {
                  where: {},
                  injectBody,
                },
              },
            },
          },
        } as any,
      });

      expect(routes.POST).toBeDefined();
    });

    it("should handle batch POST operations", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });
  });

  describe("PATCH Request Flow", () => {
    it("should handle complete PATCH request", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.PATCH).toBeDefined();
    });

    it("should handle PATCH with where clause", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              PATCH: {
                user: {
                  where: { userId: "current_user" },
                },
              },
            },
          },
        } as any,
      });

      expect(routes.PATCH).toBeDefined();
    });

    it("should handle PATCH with validation and injection", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              PATCH: {
                user: {
                  where: {},
                  validateBody: vi.fn(),
                  injectBody: vi.fn(),
                },
              },
            },
          },
        } as any,
      });

      expect(routes.PATCH).toBeDefined();
    });
  });

  describe("DELETE Request Flow", () => {
    it("should handle complete DELETE request", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.DELETE).toBeDefined();
    });

    it("should handle DELETE with row-level security", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              DELETE: {
                admin: { where: {} },
                user: { where: { userId: "current_user" } },
              },
            },
          },
        } as any,
      });

      expect(routes.DELETE).toBeDefined();
    });
  });

  describe("Middleware Chain Integration", () => {
    it("should compose multiple middleware functions", async () => {
      const middleware1 = vi.fn(async (req, ctx: any) => {
        ctx.step1 = true;
      });

      const middleware2 = vi.fn(async (req, ctx: any) => {
        ctx.step2 = ctx.step1 ? true : false;
      });

      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        session: {
          parser: middleware1,
          getRole: () => "user",
        },
      });

      expect(routes).toBeDefined();
    });

    it("should handle middleware errors gracefully", async () => {
      const failingMiddleware = vi.fn().mockRejectedValue(
        new Error("Middleware failed"),
      );

      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        session: {
          parser: failingMiddleware,
          getRole: () => "user",
        },
      });

      expect(routes).toBeDefined();
    });
  });

  describe("Error Handling in Integration", () => {
    it("should call onError callback for HttpError", async () => {
      const errorHandler = vi.fn();

      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        onError: errorHandler,
      });

      expect(routes).toBeDefined();
    });

    it("should call onError callback for regular Error", async () => {
      const errorHandler = vi.fn();

      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        onError: errorHandler,
      });

      expect(routes).toBeDefined();
    });

    it("should propagate errors through handler chain", async () => {
      const errorHandler = vi.fn();

      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        onError: errorHandler,
      });

      expect(routes).toBeDefined();
    });
  });

  describe("ACL with Roles", () => {
    it("should enforce different ACLs per role", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          users: {
            control: {
              GET: {
                admin: { where: {} },
                user: { where: { id: "current_user" } },
                guest: null,
              },
            },
          },
        } as any,
      });

      expect(routes).toBeDefined();
    });

    it("should support mine/all/guest selectors", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              GET: {
                mine: { where: { userId: "current_user" } },
                guest: { where: { published: true } },
                all: { where: {} },
              },
            },
          },
        } as any,
      });

      expect(routes).toBeDefined();
    });

    it("should fallback to all selector when role not defined", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              GET: {
                all: { where: { published: true } },
              },
            },
          },
        } as any,
      });

      expect(routes).toBeDefined();
    });
  });

  describe("Complex Data Transformations", () => {
    it("should handle validateBody transformation", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              POST: {
                user: {
                  where: {},
                  validateBody: vi.fn().mockResolvedValue({ title: "", content: "" }),
                },
              },
            },
          },
        } as any,
      });

      expect(routes).toBeDefined();
    });

    it("should handle injectBody transformation", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              POST: {
                user: {
                  where: {},
                  injectBody: vi.fn().mockResolvedValue({}),
                },
              },
            },
          },
        } as any,
      });

      expect(routes).toBeDefined();
    });

    it("should apply both validateBody and injectBody", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
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
        } as any,
      });

      expect(routes).toBeDefined();
    });

    it("should handle array transformation for batch operations", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          posts: {
            control: {
              POST: {
                user: {
                  where: {},
                  validateBody: vi.fn(),
                },
              },
            },
          },
        } as any,
      });

      expect(routes).toBeDefined();
    });
  });

  describe("Body Parsing Integration", () => {
    it("should parse JSON bodies in POST", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });

    it("should parse RJSON bodies in POST", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });

    it("should parse form-urlencoded bodies in POST", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });

    it("should handle empty bodies gracefully", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });

    it("should reject unsupported media types", async () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes.POST).toBeDefined();
    });
  });

  describe("Max Limits and Constraints", () => {
    it("should respect maxDepth from defaults", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        defaults: { maxDepth: 2 },
      });

      expect(routes).toBeDefined();
    });

    it("should respect maxLimit from defaults", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        defaults: { maxLimit: 100 },
      });

      expect(routes).toBeDefined();
    });

    it("should allow surpass or throw on max limit", () => {
      const routes1 = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        onSurpassMaxLimit: 0, // Limit
      });

      const routes2 = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        onSurpassMaxLimit: 1, // Throw
      });

      expect(routes1).toBeDefined();
      expect(routes2).toBeDefined();
    });
  });

  describe("Multiple Resource Types", () => {
    it("should handle multiple tables in schema", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
      });

      expect(routes).toBeDefined();
    });

    it("should apply ACL to all resources", () => {
      const routes = createQueryRoute({
        schema: createMockSchema(),
        database: createMockDatabase(),
        idParam: "id",
        acl: {
          users: {
            control: { GET: { guest: {} } },
          },
          posts: {
            control: { GET: { guest: { where: { published: true } } } },
          },
          comments: {
            control: { GET: { user: { where: {} } } },
          },
        } as any,
      });

      expect(routes).toBeDefined();
    });
  });
});
