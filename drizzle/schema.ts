import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint, boolean } from "drizzle-orm/mysql-core";

// ── Users ──
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Neighborhoods (Bairros) ──
export const neighborhoods = mysqlTable("neighborhoods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  lat: text("lat"),
  lng: text("lng"),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low").notNull(),
  totalComplaints: int("totalComplaints").default(0).notNull(),
  totalCases: int("totalCases").default(0).notNull(),
  infestationIndex: text("infestationIndex"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = typeof neighborhoods.$inferInsert;

// ── Complaints (Denúncias) ──
export const complaints = mysqlTable("complaints", {
  id: int("id").autoincrement().primaryKey(),
  protocol: varchar("protocol", { length: 20 }).notNull().unique(),
  date: bigint("date", { mode: "number" }).notNull(),
  type: mysqlEnum("type", [
    "standing_water",
    "abandoned_lot",
    "trash_accumulation",
    "open_container",
    "construction_debris",
    "other",
  ]).notNull(),
  description: text("description"),
  neighborhoodId: int("neighborhoodId").notNull(),
  addressPrivate: text("addressPrivate"),
  latPrivate: text("latPrivate"),
  lngPrivate: text("lngPrivate"),
  photoUrl: text("photoUrl"),
  photoKey: text("photoKey"),
  anonymous: boolean("anonymous").default(true).notNull(),
  reporterName: varchar("reporterName", { length: 255 }),
  reporterContact: varchar("reporterContact", { length: 255 }),
  status: mysqlEnum("status", [
    "received",
    "in_analysis",
    "confirmed",
    "resolved",
    "rejected",
    "archived",
  ]).default("received").notNull(),
  aiPriority: mysqlEnum("aiPriority", ["low", "medium", "high", "critical"]),
  aiSummary: text("aiSummary"),
  resolvedAt: bigint("resolvedAt", { mode: "number" }),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;

// ── Metrics (Dados Epidemiológicos) ──
export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  date: bigint("date", { mode: "number" }).notNull(),
  confirmedCases: int("confirmedCases").default(0).notNull(),
  suspectedCases: int("suspectedCases").default(0).notNull(),
  deaths: int("deaths").default(0).notNull(),
  underInvestigation: int("underInvestigation").default(0).notNull(),
  infestationIndex: text("infestationIndex"),
  incidenceRate: text("incidenceRate"),
  totalComplaints: int("totalComplaints").default(0).notNull(),
  byNeighborhood: json("byNeighborhood"),
  source: varchar("source", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

// ── Bulletins (Boletins Epidemiológicos) ──
export const bulletins = mysqlTable("bulletins", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["daily", "weekly"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  periodStart: bigint("periodStart", { mode: "number" }).notNull(),
  periodEnd: bigint("periodEnd", { mode: "number" }).notNull(),
  generatedByAi: boolean("generatedByAi").default(true).notNull(),
  publishedAt: bigint("publishedAt", { mode: "number" }),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bulletin = typeof bulletins.$inferSelect;
export type InsertBulletin = typeof bulletins.$inferInsert;

// ── Settings (Configurações do Sistema) ──
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// ── Audit (Registro de Ações) ──
export const audit = mysqlTable("audit", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditEntry = typeof audit.$inferSelect;
export type InsertAuditEntry = typeof audit.$inferInsert;
