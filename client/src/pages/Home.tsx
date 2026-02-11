import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity, AlertTriangle, Bug, CheckCircle, Heart,
  TrendingUp, Users, FileWarning, ArrowUpRight
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useMemo } from "react";

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const riskLabels: Record<string, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
};

const riskEmoji: Record<string, string> = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
};

export default function Home() {
  const { data: summary, isLoading: loadingSummary } = trpc.dashboard.summary.useQuery();
  const { data: metricsData, isLoading: loadingMetrics } = trpc.metrics.list.useQuery({ limit: 30 });
  const { data: thresholds } = trpc.settings.getThresholds.useQuery();

  const chartData = useMemo(() => {
    if (!metricsData) return [];
    return [...metricsData].reverse().map(m => ({
      date: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      casos: m.confirmedCases,
      suspeitos: m.suspectedCases,
      denuncias: m.totalComplaints,
    }));
  }, [metricsData]);

  // Determine overall risk level
  const overallRisk = useMemo(() => {
    if (!summary?.metric) return "low";
    const cases = summary.metric.confirmedCases;
    const highThreshold = thresholds?.high ?? 20;
    const lowThreshold = thresholds?.low ?? 5;
    if (cases >= highThreshold) return "high";
    if (cases >= lowThreshold) return "medium";
    return "low";
  }, [summary, thresholds]);

  return (
    <PublicLayout>
      <div className="container py-6 space-y-6">
        {/* Hero Banner */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Painel de Situação da Dengue
              </h1>
              <p className="text-muted-foreground mt-1">
                Votuporanga/SP — Dados atualizados diariamente
              </p>
              {summary?.metric && (
                <p className="text-xs text-muted-foreground mt-2">
                  Última atualização: {new Date(summary.metric.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${riskColors[overallRisk]}`}>
                <span className="text-xl">{riskEmoji[overallRisk]}</span>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider">Nível de Risco</div>
                  <div className="font-bold">{riskLabels[overallRisk]}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {loadingSummary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-16" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Casos Confirmados</p>
                    <p className="text-2xl md:text-3xl font-extrabold mt-1">{summary?.metric?.confirmedCases ?? 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-red-500 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Óbitos</p>
                    <p className="text-2xl md:text-3xl font-extrabold mt-1">{summary?.metric?.deaths ?? 0}</p>
                  </div>
                  <Heart className="h-8 w-8 text-gray-500 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Em Investigação</p>
                    <p className="text-2xl md:text-3xl font-extrabold mt-1">{summary?.metric?.underInvestigation ?? 0}</p>
                  </div>
                  <FileWarning className="h-8 w-8 text-yellow-500 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Denúncias</p>
                    <p className="text-2xl md:text-3xl font-extrabold mt-1">{summary?.complaints?.total ?? 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional metrics row */}
        {summary?.metric && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Taxa de Incidência</p>
                <p className="text-xl font-bold mt-1">{summary.metric.incidenceRate ?? "—"} <span className="text-xs font-normal text-muted-foreground">por 100 mil hab.</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Índice de Infestação</p>
                <p className="text-xl font-bold mt-1">{summary.metric.infestationIndex ?? "—"}%</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Casos Suspeitos</p>
                <p className="text-xl font-bold mt-1">{summary.metric.suspectedCases ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução dos Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMetrics ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCasos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDenuncias" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.45 0.15 155)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.45 0.15 155)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="casos" name="Confirmados" stroke="#ef4444" fill="url(#colorCasos)" strokeWidth={2} />
                  <Area type="monotone" dataKey="denuncias" name="Denúncias" stroke="#16a34a" fill="url(#colorDenuncias)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top neighborhoods + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Top 5 Bairros em Alerta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10" />)}</div>
              ) : (
                <div className="space-y-2">
                  {summary?.topNeighborhoods?.map((n, idx) => (
                    <div key={n.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}.</span>
                        <span className="font-medium text-sm">{n.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{n.totalComplaints + n.totalCases} ocorrências</span>
                        <Badge variant="outline" className={`text-xs ${riskColors[n.riskLevel]}`}>
                          {riskEmoji[n.riskLevel]} {riskLabels[n.riskLevel]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!summary?.topNeighborhoods || summary.topNeighborhoods.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Encontrou um foco?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Denuncie possíveis criadouros do mosquito Aedes aegypti. Sua participação é fundamental no combate à dengue.
                    </p>
                    <Link href="/denunciar">
                      <Button className="mt-3 gap-1">
                        Fazer Denúncia <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Bug className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">Consultar Protocolo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acompanhe o status da sua denúncia informando o número do protocolo.
                    </p>
                    <Link href="/denunciar?tab=consultar">
                      <Button variant="outline" className="mt-3 gap-1">
                        Consultar <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data sources */}
        <div className="text-xs text-muted-foreground text-center py-4 border-t">
          Fontes: Vigilância Epidemiológica Municipal, InfoDengue, DataSUS, denúncias da população.
          Dados sujeitos a atualização. Última coleta: {summary?.metric ? new Date(summary.metric.date).toLocaleDateString("pt-BR") : "—"}.
        </div>
      </div>
    </PublicLayout>
  );
}
