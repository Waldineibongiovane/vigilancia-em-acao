import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import * as db from "./db";

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ── Protocol generator ──
function generateProtocol(): string {
  const year = new Date().getFullYear();
  const seq = nanoid(6).toUpperCase();
  return `VA-${year}-${seq}`;
}

// ── Complaint type labels ──
const complaintTypeLabels: Record<string, string> = {
  standing_water: "Água parada",
  abandoned_lot: "Terreno baldio",
  trash_accumulation: "Acúmulo de lixo",
  open_container: "Recipiente aberto",
  construction_debris: "Entulho de obra",
  other: "Outro",
};

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Neighborhoods ──
  neighborhoods: router({
    list: publicProcedure.query(async () => {
      return db.getAllNeighborhoods();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getNeighborhoodById(input.id);
    }),
  }),

  // ── Complaints (Public) ──
  complaints: router({
    create: publicProcedure
      .input(z.object({
        type: z.enum(["standing_water", "abandoned_lot", "trash_accumulation", "open_container", "construction_debris", "other"]),
        description: z.string().max(2000).optional(),
        neighborhoodId: z.number(),
        addressPrivate: z.string().max(500).optional(),
        latPrivate: z.string().optional(),
        lngPrivate: z.string().optional(),
        photoBase64: z.string().optional(),
        photoMimeType: z.string().optional(),
        anonymous: z.boolean().default(true),
        reporterName: z.string().max(255).optional(),
        reporterContact: z.string().max(255).optional(),
        captchaToken: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit
        const ip = ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket?.remoteAddress || "unknown";
        if (!checkRateLimit(ip)) {
          throw new Error("Muitas denúncias enviadas. Tente novamente em 1 minuto.");
        }

        const protocol = generateProtocol();
        let photoUrl: string | undefined;
        let photoKey: string | undefined;

        // Upload photo to S3 if provided
        if (input.photoBase64 && input.photoMimeType) {
          const buffer = Buffer.from(input.photoBase64, "base64");
          const ext = input.photoMimeType.split("/")[1] || "jpg";
          const key = `complaints/${protocol}-${nanoid(8)}.${ext}`;
          const result = await storagePut(key, buffer, input.photoMimeType);
          photoUrl = result.url;
          photoKey = result.key;
        }

        const complaintId = await db.createComplaint({
          protocol,
          date: Date.now(),
          type: input.type,
          description: input.description || null,
          neighborhoodId: input.neighborhoodId,
          addressPrivate: input.addressPrivate || null,
          latPrivate: input.latPrivate || null,
          lngPrivate: input.lngPrivate || null,
          photoUrl: photoUrl || null,
          photoKey: photoKey || null,
          anonymous: input.anonymous,
          reporterName: input.anonymous ? null : (input.reporterName || null),
          reporterContact: input.anonymous ? null : (input.reporterContact || null),
          status: "received",
        });

        // Get neighborhood name for notification
        const neighborhood = await db.getNeighborhoodById(input.neighborhoodId);
        const neighborhoodName = neighborhood?.name ?? "Desconhecido";
        const typeLabel = complaintTypeLabels[input.type] || input.type;

        // Send notification to owner
        try {
          await notifyOwner({
            title: `Nova Denúncia: ${protocol}`,
            content: `Nova denúncia registrada no sistema Vigilância em Ação.\n\nProtocolo: ${protocol}\nTipo: ${typeLabel}\nBairro: ${neighborhoodName}\nDescrição: ${input.description || "Não informada"}\nAnônima: ${input.anonymous ? "Sim" : "Não"}`,
          });
        } catch (e) {
          console.warn("[Notification] Failed to notify owner:", e);
        }

        // AI classification (async, non-blocking)
        classifyComplaintAsync(complaintId, input.type, input.description || "", neighborhoodName).catch(console.error);

        return { protocol, id: complaintId };
      }),

    lookup: publicProcedure
      .input(z.object({ protocol: z.string() }))
      .query(async ({ input }) => {
        const complaint = await db.getComplaintByProtocol(input.protocol);
        if (!complaint) return null;
        // Public view: hide private data
        return {
          protocol: complaint.protocol,
          date: complaint.date,
          type: complaint.type,
          status: complaint.status,
          neighborhoodId: complaint.neighborhoodId,
          createdAt: complaint.createdAt,
        };
      }),

    publicList: publicProcedure
      .input(z.object({ limit: z.number().max(100).default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.listPublicComplaints(input);
      }),

    stats: publicProcedure.query(async () => {
      const [stats, avgTime] = await Promise.all([
        db.getComplaintStats(),
        db.getAvgResolutionTime(),
      ]);
      return { ...stats, avgResolutionTimeMs: avgTime };
    }),
  }),

  // ── Metrics (Public) ──
  metrics: router({
    latest: publicProcedure.query(async () => {
      return db.getLatestMetric();
    }),
    list: publicProcedure
      .input(z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        limit: z.number().max(365).default(90),
      }))
      .query(async ({ input }) => {
        return db.listMetrics(input);
      }),
  }),

  // ── Bulletins (Public) ──
  bulletins: router({
    list: publicProcedure
      .input(z.object({
        type: z.enum(["daily", "weekly"]).optional(),
        limit: z.number().max(50).default(10),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.listBulletins({ published: true, type: input.type, limit: input.limit, offset: input.offset });
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const bulletin = await db.getBulletinById(input.id);
        if (!bulletin || !bulletin.published) return null;
        return bulletin;
      }),
  }),

  // ── Dashboard Stats ──
  dashboard: router({
    summary: publicProcedure.query(async () => {
      const [latestMetric, complaintStats, neighborhoodsList] = await Promise.all([
        db.getLatestMetric(),
        db.getComplaintStats(),
        db.getAllNeighborhoods(),
      ]);
      const topNeighborhoods = [...neighborhoodsList]
        .sort((a, b) => (b.totalComplaints + b.totalCases) - (a.totalComplaints + a.totalCases))
        .slice(0, 5);
      return {
        metric: latestMetric ?? null,
        complaints: complaintStats,
        topNeighborhoods,
      };
    }),
  }),

  // ── Settings (Public read for thresholds) ──
  settings: router({
    getThresholds: publicProcedure.query(async () => {
      const low = await db.getSetting("threshold_low");
      const high = await db.getSetting("threshold_high");
      return {
        low: low ? parseInt(low) : 5,
        high: high ? parseInt(high) : 20,
      };
    }),
  }),

  // ── Admin ──
  admin: router({
    complaints: router({
      list: adminProcedure
        .input(z.object({
          limit: z.number().max(200).default(50),
          offset: z.number().default(0),
          status: z.string().optional(),
          neighborhoodId: z.number().optional(),
          startDate: z.number().optional(),
          endDate: z.number().optional(),
        }))
        .query(async ({ input }) => {
          return db.listComplaints(input);
        }),
      getById: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return db.getComplaintById(input.id);
        }),
      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["received", "in_analysis", "confirmed", "resolved", "rejected", "archived"]),
          adminNotes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          await db.updateComplaintStatus(input.id, input.status, input.adminNotes);
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "update_complaint_status",
            details: `Status changed to ${input.status}${input.adminNotes ? ` - Notes: ${input.adminNotes}` : ""}`,
            entityType: "complaint",
            entityId: input.id,
          });
          return { success: true };
        }),
    }),

    metrics: router({
      list: adminProcedure
        .input(z.object({ startDate: z.number().optional(), endDate: z.number().optional(), limit: z.number().default(90) }))
        .query(async ({ input }) => {
          return db.listMetrics(input);
        }),
      create: adminProcedure
        .input(z.object({
          date: z.number(),
          confirmedCases: z.number().default(0),
          suspectedCases: z.number().default(0),
          deaths: z.number().default(0),
          underInvestigation: z.number().default(0),
          infestationIndex: z.string().optional(),
          incidenceRate: z.string().optional(),
          totalComplaints: z.number().default(0),
          source: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          await db.createMetric(input);
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "create_metric",
            details: `Metric created for date ${new Date(input.date).toISOString().split("T")[0]}`,
            entityType: "metric",
          });
          return { success: true };
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          confirmedCases: z.number().optional(),
          suspectedCases: z.number().optional(),
          deaths: z.number().optional(),
          underInvestigation: z.number().optional(),
          infestationIndex: z.string().optional(),
          incidenceRate: z.string().optional(),
          totalComplaints: z.number().optional(),
          source: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const { id, ...data } = input;
          await db.updateMetric(id, data);
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "update_metric",
            details: `Metric ${id} updated`,
            entityType: "metric",
            entityId: id,
          });
          return { success: true };
        }),
    }),

    neighborhoods: router({
      upsert: adminProcedure
        .input(z.object({
          name: z.string(),
          lat: z.string().optional(),
          lng: z.string().optional(),
          riskLevel: z.enum(["low", "medium", "high"]).default("low"),
          totalComplaints: z.number().default(0),
          totalCases: z.number().default(0),
          infestationIndex: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          await db.upsertNeighborhood(input);
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "upsert_neighborhood",
            details: `Neighborhood ${input.name} upserted`,
            entityType: "neighborhood",
          });
          return { success: true };
        }),
      updateRisk: adminProcedure
        .input(z.object({ id: z.number(), riskLevel: z.enum(["low", "medium", "high"]) }))
        .mutation(async ({ input, ctx }) => {
          await db.updateNeighborhoodRisk(input.id, input.riskLevel);
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "update_neighborhood_risk",
            details: `Risk level changed to ${input.riskLevel}`,
            entityType: "neighborhood",
            entityId: input.id,
          });
          return { success: true };
        }),
    }),

    bulletins: router({
      list: adminProcedure
        .input(z.object({ limit: z.number().default(20), offset: z.number().default(0), type: z.string().optional() }))
        .query(async ({ input }) => {
          return db.listBulletins({ type: input.type, limit: input.limit, offset: input.offset });
        }),
      generate: adminProcedure
        .input(z.object({ type: z.enum(["daily", "weekly"]) }))
        .mutation(async ({ input, ctx }) => {
          const now = Date.now();
          const periodMs = input.type === "daily" ? 86400000 : 604800000;
          const periodStart = now - periodMs;
          const metricsData = await db.listMetrics({ startDate: periodStart, endDate: now, limit: 30 });
          const complaintStats = await db.getComplaintStats();
          const neighborhoodsList = await db.getAllNeighborhoods();

          const prompt = `Você é um epidemiologista da vigilância sanitária de Votuporanga/SP. Gere um boletim epidemiológico ${input.type === "daily" ? "diário" : "semanal"} sobre dengue.

Dados disponíveis:
- Métricas recentes: ${JSON.stringify(metricsData.slice(0, 7))}
- Estatísticas de denúncias: ${JSON.stringify(complaintStats)}
- Bairros com mais casos: ${JSON.stringify(neighborhoodsList.slice(0, 10).map(n => ({ nome: n.name, risco: n.riskLevel, denuncias: n.totalComplaints, casos: n.totalCases })))}

Gere um boletim com:
1. Título claro
2. Resumo executivo
3. Análise de tendências
4. Bairros em destaque
5. Recomendações preventivas
6. Padrões sazonais observados

IMPORTANTE: Use APENAS os dados fornecidos. NÃO invente números. Se não houver dados suficientes, indique claramente. Escreva em português brasileiro formal.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Você é um especialista em epidemiologia e vigilância em saúde. Gere boletins claros, informativos e baseados exclusivamente nos dados fornecidos." },
              { role: "user", content: prompt },
            ],
          });

          const content = typeof response.choices[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "";

          const title = `Boletim ${input.type === "daily" ? "Diário" : "Semanal"} - ${new Date().toLocaleDateString("pt-BR")}`;

          const bulletinId = await db.createBulletin({
            type: input.type,
            title,
            content,
            summary: content.substring(0, 300),
            periodStart,
            periodEnd: now,
            generatedByAi: true,
            published: false,
          });

          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "generate_bulletin",
            details: `${input.type} bulletin generated by AI`,
            entityType: "bulletin",
            entityId: bulletinId,
          });

          return { id: bulletinId, title };
        }),
      publish: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await db.updateBulletin(input.id, { published: true, publishedAt: Date.now() });
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "publish_bulletin",
            details: `Bulletin ${input.id} published`,
            entityType: "bulletin",
            entityId: input.id,
          });
          return { success: true };
        }),
      update: adminProcedure
        .input(z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), published: z.boolean().optional() }))
        .mutation(async ({ input, ctx }) => {
          const { id, ...data } = input;
          if (data.published) (data as any).publishedAt = Date.now();
          await db.updateBulletin(id, data);
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "update_bulletin",
            details: `Bulletin ${id} updated`,
            entityType: "bulletin",
            entityId: id,
          });
          return { success: true };
        }),
    }),

    settings: router({
      list: adminProcedure.query(async () => {
        return db.getAllSettings();
      }),
      upsert: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input, ctx }) => {
          await db.upsertSetting(input.key, input.value);
          await db.createAuditEntry({
            userId: ctx.user.id,
            action: "update_setting",
            details: `Setting ${input.key} updated`,
            entityType: "setting",
          });
          return { success: true };
        }),
    }),

    audit: router({
      list: adminProcedure
        .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
        .query(async ({ input }) => {
          return db.listAuditEntries(input);
        }),
    }),

    stats: router({
      overview: adminProcedure.query(async () => {
        const [complaintStats, latestMetric, avgTime, neighborhoodsList] = await Promise.all([
          db.getComplaintStats(),
          db.getLatestMetric(),
          db.getAvgResolutionTime(),
          db.getAllNeighborhoods(),
        ]);
        return { complaints: complaintStats, metric: latestMetric, avgResolutionTimeMs: avgTime, totalNeighborhoods: neighborhoodsList.length };
      }),
    }),
  }),

  // ── Photo upload ──
  upload: router({
    photo: publicProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.length > 10 * 1024 * 1024) throw new Error("Arquivo muito grande. Máximo 10MB.");
        const key = `uploads/${nanoid(12)}-${input.fileName}`;
        const result = await storagePut(key, buffer, input.mimeType);
        return { url: result.url, key: result.key };
      }),
  }),
});

// ── AI Classification (async) ──
async function classifyComplaintAsync(complaintId: number, type: string, description: string, neighborhood: string) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um agente de vigilância sanitária. Classifique a prioridade da denúncia e gere um resumo executivo curto." },
        { role: "user", content: `Denúncia de foco de dengue:\nTipo: ${complaintTypeLabels[type] || type}\nBairro: ${neighborhood}\nDescrição: ${description || "Não informada"}\n\nClassifique a prioridade (low, medium, high, critical) e gere um resumo de no máximo 200 caracteres.` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "complaint_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              priority: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Prioridade da denúncia" },
              summary: { type: "string", description: "Resumo executivo curto" },
            },
            required: ["priority", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      const dbInstance = await db.getDb();
      if (dbInstance) {
        const { complaints: complaintsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await dbInstance.update(complaintsTable).set({
          aiPriority: parsed.priority,
          aiSummary: parsed.summary,
        }).where(eq(complaintsTable.id, complaintId));
      }
    }
  } catch (e) {
    console.error("[AI] Failed to classify complaint:", e);
  }
}

export type AppRouter = typeof appRouter;
