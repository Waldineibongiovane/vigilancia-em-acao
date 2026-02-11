import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// ── Context Helpers ──
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "127.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@votuporanga.gov.br",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "127.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

// ── Public Routes ──
describe("Public routes", () => {
  it("dashboard.summary returns metric and complaints data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dashboard.summary();
    expect(result).toHaveProperty("metric");
    expect(result).toHaveProperty("complaints");
    expect(result).toHaveProperty("topNeighborhoods");
    expect(result.complaints).toHaveProperty("total");
    expect(typeof result.complaints.total).toBe("number");
  });

  it("neighborhoods.list returns an array of neighborhoods", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.neighborhoods.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("riskLevel");
    expect(result[0]).toHaveProperty("lat");
    expect(result[0]).toHaveProperty("lng");
  });

  it("metrics.list returns metrics array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("confirmedCases");
      expect(result[0]).toHaveProperty("deaths");
      expect(result[0]).toHaveProperty("date");
    }
  });

  it("metrics.latest returns the most recent metric", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.latest();
    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("confirmedCases");
      expect(typeof result.confirmedCases).toBe("number");
    }
  });

  it("settings.getThresholds returns low and high thresholds", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.settings.getThresholds();
    expect(result).toHaveProperty("low");
    expect(result).toHaveProperty("high");
    expect(typeof result.low).toBe("number");
    expect(typeof result.high).toBe("number");
  });

  it("complaints.stats returns complaint statistics", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.complaints.stats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("received");
    expect(result).toHaveProperty("resolved");
    expect(typeof result.total).toBe("number");
  });

  it("complaints.publicList returns only confirmed/resolved complaints", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.complaints.publicList({ limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
    // Verify no private data is exposed
    if (result.items.length > 0) {
      const item = result.items[0];
      expect(item).not.toHaveProperty("addressPrivate");
      expect(item).not.toHaveProperty("reporterName");
      expect(item).not.toHaveProperty("reporterContact");
      expect(["confirmed", "resolved"]).toContain(item.status);
    }
  });

  it("complaints.lookup returns null for non-existent protocol", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.complaints.lookup({ protocol: "VA-9999-XXXXXX" });
    expect(result).toBeNull();
  });

  it("bulletins.list returns published bulletins", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.bulletins.list({ limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });
});

// ── Admin Access Control ──
describe("Admin access control", () => {
  it("admin.stats.overview is forbidden for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.stats.overview()).rejects.toThrow();
  });

  it("admin.stats.overview is forbidden for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.admin.stats.overview()).rejects.toThrow();
  });

  it("admin.complaints.list is forbidden for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.complaints.list({ limit: 10 })).rejects.toThrow();
  });

  it("admin.settings.list is forbidden for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.settings.list()).rejects.toThrow();
  });
});

// ── Admin Routes ──
describe("Admin routes (with admin context)", () => {
  it("admin.stats.overview returns overview data", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.stats.overview();
    expect(result).toHaveProperty("complaints");
    expect(result).toHaveProperty("metric");
    expect(result).toHaveProperty("avgResolutionTimeMs");
    expect(result).toHaveProperty("totalNeighborhoods");
    expect(typeof result.totalNeighborhoods).toBe("number");
  });

  it("admin.complaints.list returns complaints with total", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.complaints.list({ limit: 5 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("admin.metrics.list returns metrics", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.metrics.list({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin.settings.list returns settings", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.settings.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("key");
      expect(result[0]).toHaveProperty("value");
    }
  });

  it("admin.bulletins.list returns bulletins (including drafts)", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.bulletins.list({ limit: 5 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });
});

// ── Rate Limiting ──
describe("Rate limiting", () => {
  it("allows complaints within rate limit", async () => {
    const ctx = createPublicContext();
    // Use unique IP to avoid interference from other tests
    (ctx.req.headers as any)["x-forwarded-for"] = `test-${Date.now()}`;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.complaints.create({
      type: "standing_water",
      neighborhoodId: 1,
      anonymous: true,
    });
    expect(result).toHaveProperty("protocol");
    expect(result.protocol).toMatch(/^VA-\d{4}-/);
  });
});

// ── Complaint Creation & Lookup ──
describe("Complaint creation and lookup", () => {
  it("creates a complaint and looks it up by protocol", async () => {
    const ctx = createPublicContext();
    (ctx.req.headers as any)["x-forwarded-for"] = `create-test-${Date.now()}`;
    const caller = appRouter.createCaller(ctx);

    const created = await caller.complaints.create({
      type: "abandoned_lot",
      neighborhoodId: 1,
      description: "Terreno com muita água parada",
      anonymous: true,
    });

    expect(created.protocol).toBeDefined();

    const lookup = await caller.complaints.lookup({ protocol: created.protocol });
    expect(lookup).not.toBeNull();
    expect(lookup!.protocol).toBe(created.protocol);
    expect(lookup!.status).toBe("received");
    expect(lookup!.type).toBe("abandoned_lot");
  });
});
