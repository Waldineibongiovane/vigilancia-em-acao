import { eq, desc, and, gte, lte, sql, count, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  complaints, InsertComplaint, Complaint,
  metrics, InsertMetric,
  neighborhoods, InsertNeighborhood,
  bulletins, InsertBulletin,
  settings, InsertSetting,
  audit, InsertAuditEntry,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Neighborhoods ──
export async function getAllNeighborhoods() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(neighborhoods).orderBy(asc(neighborhoods.name));
}

export async function getNeighborhoodById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(neighborhoods).where(eq(neighborhoods.id, id)).limit(1);
  return result[0];
}

export async function upsertNeighborhood(data: InsertNeighborhood) {
  const db = await getDb();
  if (!db) return;
  await db.insert(neighborhoods).values(data).onDuplicateKeyUpdate({
    set: { lat: data.lat, lng: data.lng, riskLevel: data.riskLevel, totalComplaints: data.totalComplaints, totalCases: data.totalCases, infestationIndex: data.infestationIndex },
  });
}

export async function updateNeighborhoodRisk(id: number, riskLevel: "low" | "medium" | "high") {
  const db = await getDb();
  if (!db) return;
  await db.update(neighborhoods).set({ riskLevel }).where(eq(neighborhoods.id, id));
}

// ── Complaints ──
export async function createComplaint(data: InsertComplaint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(complaints).values(data);
  return result[0].insertId;
}

export async function getComplaintByProtocol(protocol: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(complaints).where(eq(complaints.protocol, protocol)).limit(1);
  return result[0];
}

export async function listComplaints(opts: { limit?: number; offset?: number; status?: string; neighborhoodId?: number; startDate?: number; endDate?: number } = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (opts.status) conditions.push(eq(complaints.status, opts.status as any));
  if (opts.neighborhoodId) conditions.push(eq(complaints.neighborhoodId, opts.neighborhoodId));
  if (opts.startDate) conditions.push(gte(complaints.date, opts.startDate));
  if (opts.endDate) conditions.push(lte(complaints.date, opts.endDate));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, totalResult] = await Promise.all([
    db.select().from(complaints).where(where).orderBy(desc(complaints.date)).limit(opts.limit ?? 50).offset(opts.offset ?? 0),
    db.select({ count: count() }).from(complaints).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function listPublicComplaints(opts: { limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const resolvedStatuses = ["confirmed", "resolved"] as const;
  const where = sql`${complaints.status} IN ('confirmed', 'resolved')`;
  const [items, totalResult] = await Promise.all([
    db.select({
      id: complaints.id, protocol: complaints.protocol, date: complaints.date,
      type: complaints.type, neighborhoodId: complaints.neighborhoodId,
      status: complaints.status, resolvedAt: complaints.resolvedAt,
      createdAt: complaints.createdAt,
    }).from(complaints).where(where).orderBy(desc(complaints.date)).limit(opts.limit ?? 50).offset(opts.offset ?? 0),
    db.select({ count: count() }).from(complaints).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function updateComplaintStatus(id: number, status: string, adminNotes?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  if (status === "resolved") updateData.resolvedAt = Date.now();
  await db.update(complaints).set(updateData).where(eq(complaints.id, id));
}

export async function getComplaintById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
  return result[0];
}

export async function getComplaintStats() {
  const db = await getDb();
  if (!db) return { total: 0, received: 0, inAnalysis: 0, confirmed: 0, resolved: 0, rejected: 0, archived: 0 };
  const result = await db.select({
    status: complaints.status,
    count: count(),
  }).from(complaints).groupBy(complaints.status);
  const stats: Record<string, number> = {};
  result.forEach(r => { stats[r.status] = r.count; });
  return {
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    received: stats.received ?? 0,
    inAnalysis: stats.in_analysis ?? 0,
    confirmed: stats.confirmed ?? 0,
    resolved: stats.resolved ?? 0,
    rejected: stats.rejected ?? 0,
    archived: stats.archived ?? 0,
  };
}

export async function getAvgResolutionTime() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({
    avgTime: sql<number>`AVG(${complaints.resolvedAt} - ${complaints.date})`,
  }).from(complaints).where(sql`${complaints.resolvedAt} IS NOT NULL`);
  return result[0]?.avgTime ?? 0;
}

// ── Metrics ──
export async function createMetric(data: InsertMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(metrics).values(data);
}

export async function getLatestMetric() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(metrics).orderBy(desc(metrics.date)).limit(1);
  return result[0];
}

export async function listMetrics(opts: { startDate?: number; endDate?: number; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.startDate) conditions.push(gte(metrics.date, opts.startDate));
  if (opts.endDate) conditions.push(lte(metrics.date, opts.endDate));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(metrics).where(where).orderBy(desc(metrics.date)).limit(opts.limit ?? 365);
}

export async function updateMetric(id: number, data: Partial<InsertMetric>) {
  const db = await getDb();
  if (!db) return;
  await db.update(metrics).set(data).where(eq(metrics.id, id));
}

// ── Bulletins ──
export async function createBulletin(data: InsertBulletin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bulletins).values(data);
  return result[0].insertId;
}

export async function listBulletins(opts: { published?: boolean; type?: string; limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (opts.published !== undefined) conditions.push(eq(bulletins.published, opts.published));
  if (opts.type) conditions.push(eq(bulletins.type, opts.type as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, totalResult] = await Promise.all([
    db.select().from(bulletins).where(where).orderBy(desc(bulletins.createdAt)).limit(opts.limit ?? 20).offset(opts.offset ?? 0),
    db.select({ count: count() }).from(bulletins).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getBulletinById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bulletins).where(eq(bulletins.id, id)).limit(1);
  return result[0];
}

export async function updateBulletin(id: number, data: Partial<InsertBulletin>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bulletins).set(data).where(eq(bulletins.id, id));
}

// ── Settings ──
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value;
}

export async function upsertSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(settings);
}

// ── Audit ──
export async function createAuditEntry(data: InsertAuditEntry) {
  const db = await getDb();
  if (!db) return;
  await db.insert(audit).values(data);
}

export async function listAuditEntries(opts: { limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(audit).orderBy(desc(audit.createdAt)).limit(opts.limit ?? 50).offset(opts.offset ?? 0);
}
