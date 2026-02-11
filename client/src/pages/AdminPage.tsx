import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, BarChart3, CheckCircle, Clock, Eye, FileText,
  Loader2, Plus, RefreshCw, Shield, TrendingUp, Settings, Sparkles
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  received: "Recebida",
  in_analysis: "Em análise",
  confirmed: "Confirmada",
  resolved: "Resolvida",
  rejected: "Rejeitada",
  archived: "Arquivada",
};

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  in_analysis: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-800",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const complaintTypeLabels: Record<string, string> = {
  standing_water: "Água parada",
  abandoned_lot: "Terreno baldio",
  trash_accumulation: "Acúmulo de lixo",
  open_container: "Recipiente aberto",
  construction_debris: "Entulho de obra",
  other: "Outro",
};

export default function AdminPage() {
  return <DashboardLayout><AdminContent /></DashboardLayout>;
}

function AdminContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm">Gestão de denúncias, dados epidemiológicos e configurações.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="complaints" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />Denúncias</TabsTrigger>
          <TabsTrigger value="metrics" className="gap-1"><TrendingUp className="h-3.5 w-3.5" />Métricas</TabsTrigger>
          <TabsTrigger value="bulletins" className="gap-1"><FileText className="h-3.5 w-3.5" />Boletins</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1"><Settings className="h-3.5 w-3.5" />Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="complaints"><ComplaintsTab /></TabsContent>
        <TabsContent value="metrics"><MetricsTab /></TabsContent>
        <TabsContent value="bulletins"><BulletinsTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Overview Tab ──
function OverviewTab() {
  const { data, isLoading } = trpc.admin.stats.overview.useQuery();

  if (isLoading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>;

  const avgDays = data?.avgResolutionTimeMs ? Math.round(data.avgResolutionTimeMs / 86400000) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2 opacity-70" />
          <p className="text-2xl font-extrabold">{data?.complaints?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Denúncias</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2 opacity-70" />
          <p className="text-2xl font-extrabold">{data?.complaints?.received ?? 0}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2 opacity-70" />
          <p className="text-2xl font-extrabold">{data?.complaints?.resolved ?? 0}</p>
          <p className="text-xs text-muted-foreground">Resolvidas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2 opacity-70" />
          <p className="text-2xl font-extrabold">{avgDays > 0 ? `${avgDays}d` : "—"}</p>
          <p className="text-xs text-muted-foreground">Tempo Médio</p>
        </CardContent></Card>
      </div>

      {data?.metric && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Última Métrica Epidemiológica</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Confirmados:</span> <strong>{data.metric.confirmedCases}</strong></div>
              <div><span className="text-muted-foreground">Suspeitos:</span> <strong>{data.metric.suspectedCases}</strong></div>
              <div><span className="text-muted-foreground">Óbitos:</span> <strong>{data.metric.deaths}</strong></div>
              <div><span className="text-muted-foreground">Investigação:</span> <strong>{data.metric.underInvestigation}</strong></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Complaints Tab ──
function ComplaintsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.complaints.list.useQuery({
    limit: 20,
    offset: page * 20,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const updateStatusMutation = trpc.admin.complaints.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.complaints.list.invalidate();
      toast.success("Status atualizado");
    },
    onError: (e) => toast.error(e.message),
  });

  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: complaintDetail } = trpc.admin.complaints.getById.useQuery(
    { id: selectedComplaint?.id },
    { enabled: !!selectedComplaint }
  );

  const { data: neighborhoodsData } = trpc.neighborhoods.list.useQuery();
  const neighborhoodMap = useMemo(() => {
    const map: Record<number, string> = {};
    neighborhoodsData?.forEach(n => { map[n.id] = n.name; });
    return map;
  }, [neighborhoodsData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="received">Recebidas</SelectItem>
            <SelectItem value="in_analysis">Em análise</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
            <SelectItem value="archived">Arquivadas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{data?.total ?? 0} denúncias</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {data?.items?.map((c: any) => (
            <Dialog key={c.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => { setSelectedComplaint(c); setNewStatus(c.status); setAdminNotes(""); }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold">{c.protocol}</span>
                          <Badge variant="outline" className={`text-xs ${statusColors[c.status]}`}>{statusLabels[c.status]}</Badge>
                          {c.aiPriority && <Badge variant="outline" className={`text-xs ${priorityColors[c.aiPriority]}`}>IA: {priorityLabels[c.aiPriority]}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {complaintTypeLabels[c.type]} • {neighborhoodMap[c.neighborhoodId] || "—"} • {new Date(c.date).toLocaleDateString("pt-BR")}
                        </p>
                        {c.aiSummary && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.aiSummary}</p>}
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Denúncia {c.protocol}</DialogTitle>
                </DialogHeader>
                {complaintDetail && complaintDetail.id === c.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Tipo:</span> <strong>{complaintTypeLabels[complaintDetail.type]}</strong></div>
                      <div><span className="text-muted-foreground">Bairro:</span> <strong>{neighborhoodMap[complaintDetail.neighborhoodId]}</strong></div>
                      <div><span className="text-muted-foreground">Data:</span> <strong>{new Date(complaintDetail.date).toLocaleDateString("pt-BR")}</strong></div>
                      <div><span className="text-muted-foreground">Anônima:</span> <strong>{complaintDetail.anonymous ? "Sim" : "Não"}</strong></div>
                    </div>
                    {complaintDetail.description && (
                      <div><Label className="text-muted-foreground">Descrição</Label><p className="text-sm mt-1">{complaintDetail.description}</p></div>
                    )}
                    {complaintDetail.addressPrivate && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <Label className="text-yellow-800 text-xs">Endereço (privado)</Label>
                        <p className="text-sm font-medium">{complaintDetail.addressPrivate}</p>
                      </div>
                    )}
                    {!complaintDetail.anonymous && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <Label className="text-blue-800 text-xs">Dados do Denunciante (privado)</Label>
                        <p className="text-sm">{complaintDetail.reporterName || "—"}</p>
                        <p className="text-sm">{complaintDetail.reporterContact || "—"}</p>
                      </div>
                    )}
                    {complaintDetail.photoUrl && (
                      <div>
                        <Label className="text-muted-foreground">Foto</Label>
                        <img src={complaintDetail.photoUrl} alt="Foto da denúncia" className="mt-1 rounded-lg max-h-64 object-cover border" />
                      </div>
                    )}
                    {complaintDetail.aiSummary && (
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                        <Label className="text-purple-800 text-xs flex items-center gap-1"><Sparkles className="h-3 w-3" /> Análise IA</Label>
                        <p className="text-sm mt-1">{complaintDetail.aiSummary}</p>
                        {complaintDetail.aiPriority && <Badge className={`mt-1 text-xs ${priorityColors[complaintDetail.aiPriority]}`}>Prioridade: {priorityLabels[complaintDetail.aiPriority]}</Badge>}
                      </div>
                    )}
                    <div className="border-t pt-4 space-y-3">
                      <Label>Alterar Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="received">Recebida</SelectItem>
                          <SelectItem value="in_analysis">Em análise</SelectItem>
                          <SelectItem value="confirmed">Confirmada</SelectItem>
                          <SelectItem value="resolved">Resolvida</SelectItem>
                          <SelectItem value="rejected">Rejeitada</SelectItem>
                          <SelectItem value="archived">Arquivada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Notas administrativas (opcional)" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} />
                      <Button
                        onClick={() => updateStatusMutation.mutate({ id: c.id, status: newStatus as any, adminNotes: adminNotes || undefined })}
                        disabled={updateStatusMutation.isPending}
                        className="w-full"
                      >
                        {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                )}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground self-center">Página {page + 1} de {Math.ceil(data.total / 20)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * 20 >= data.total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}
    </div>
  );
}

// ── Metrics Tab ──
function MetricsTab() {
  const { data, isLoading } = trpc.admin.metrics.list.useQuery({ limit: 30 });
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    confirmedCases: 0, suspectedCases: 0, deaths: 0, underInvestigation: 0,
    infestationIndex: "", incidenceRate: "", source: "",
  });

  const createMutation = trpc.admin.metrics.create.useMutation({
    onSuccess: () => {
      utils.admin.metrics.list.invalidate();
      toast.success("Métrica adicionada");
      setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Dados Epidemiológicos</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> Adicionar Métrica
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">Confirmados</Label><Input type="number" value={formData.confirmedCases} onChange={e => setFormData(f => ({ ...f, confirmedCases: parseInt(e.target.value) || 0 }))} /></div>
              <div><Label className="text-xs">Suspeitos</Label><Input type="number" value={formData.suspectedCases} onChange={e => setFormData(f => ({ ...f, suspectedCases: parseInt(e.target.value) || 0 }))} /></div>
              <div><Label className="text-xs">Óbitos</Label><Input type="number" value={formData.deaths} onChange={e => setFormData(f => ({ ...f, deaths: parseInt(e.target.value) || 0 }))} /></div>
              <div><Label className="text-xs">Investigação</Label><Input type="number" value={formData.underInvestigation} onChange={e => setFormData(f => ({ ...f, underInvestigation: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label className="text-xs">Índ. Infestação (%)</Label><Input value={formData.infestationIndex} onChange={e => setFormData(f => ({ ...f, infestationIndex: e.target.value }))} /></div>
              <div><Label className="text-xs">Taxa Incidência</Label><Input value={formData.incidenceRate} onChange={e => setFormData(f => ({ ...f, incidenceRate: e.target.value }))} /></div>
              <div><Label className="text-xs">Fonte</Label><Input value={formData.source} onChange={e => setFormData(f => ({ ...f, source: e.target.value }))} placeholder="Ex: DataSUS" /></div>
            </div>
            <Button onClick={() => createMutation.mutate({ ...formData, date: Date.now() })} disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Métrica
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-muted-foreground">Data</th>
                <th className="pb-2 font-medium text-muted-foreground">Confirmados</th>
                <th className="pb-2 font-medium text-muted-foreground">Suspeitos</th>
                <th className="pb-2 font-medium text-muted-foreground">Óbitos</th>
                <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Investigação</th>
                <th className="pb-2 font-medium text-muted-foreground hidden lg:table-cell">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((m: any) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2">{new Date(m.date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-2 font-semibold">{m.confirmedCases}</td>
                  <td className="py-2">{m.suspectedCases}</td>
                  <td className="py-2">{m.deaths}</td>
                  <td className="py-2 hidden md:table-cell">{m.underInvestigation}</td>
                  <td className="py-2 hidden lg:table-cell text-muted-foreground text-xs">{m.source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Bulletins Tab ──
function BulletinsTab() {
  const { data, isLoading } = trpc.admin.bulletins.list.useQuery({ limit: 20 });
  const utils = trpc.useUtils();

  const generateMutation = trpc.admin.bulletins.generate.useMutation({
    onSuccess: (data) => {
      utils.admin.bulletins.list.invalidate();
      toast.success(`Boletim gerado: ${data.title}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const publishMutation = trpc.admin.bulletins.publish.useMutation({
    onSuccess: () => {
      utils.admin.bulletins.list.invalidate();
      toast.success("Boletim publicado");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold flex-1">Boletins Epidemiológicos</h2>
        <Button size="sm" variant="outline" onClick={() => generateMutation.mutate({ type: "daily" })} disabled={generateMutation.isPending} className="gap-1">
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar Diário
        </Button>
        <Button size="sm" variant="outline" onClick={() => generateMutation.mutate({ type: "weekly" })} disabled={generateMutation.isPending} className="gap-1">
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar Semanal
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {data?.items?.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{b.type === "daily" ? "Diário" : "Semanal"}</Badge>
                      {b.published ? <Badge className="bg-green-100 text-green-800 text-xs">Publicado</Badge> : <Badge variant="secondary" className="text-xs">Rascunho</Badge>}
                      {b.generatedByAi && <Badge variant="secondary" className="text-xs">IA</Badge>}
                    </div>
                    <h3 className="font-semibold text-sm mt-1">{b.title}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(b.periodStart).toLocaleDateString("pt-BR")} - {new Date(b.periodEnd).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {!b.published && (
                    <Button size="sm" onClick={() => publishMutation.mutate({ id: b.id })} disabled={publishMutation.isPending}>
                      Publicar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum boletim gerado ainda. Use os botões acima para gerar.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──
function SettingsTab() {
  const { data, isLoading } = trpc.admin.settings.list.useQuery();
  const utils = trpc.useUtils();
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");

  const upsertMutation = trpc.admin.settings.upsert.useMutation({
    onSuccess: () => {
      utils.admin.settings.list.invalidate();
      toast.success("Configuração salva");
      setEditKey("");
      setEditValue("");
    },
    onError: (e) => toast.error(e.message),
  });

  const settingLabels: Record<string, string> = {
    threshold_low: "Limite Baixo (semáforo)",
    threshold_high: "Limite Alto (semáforo)",
    notification_emails: "E-mails de notificação",
    city_name: "Nome da cidade",
    city_state: "Estado",
    population: "População",
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Configurações do Sistema</h2>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <div className="space-y-2">
          {data?.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{settingLabels[s.key] || s.key}</p>
                    <p className="text-sm text-muted-foreground font-mono">{s.value}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setEditKey(s.key); setEditValue(s.value); }}>
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editKey && (
        <Card className="border-primary">
          <CardContent className="p-4 space-y-3">
            <Label>{settingLabels[editKey] || editKey}</Label>
            <Input value={editValue} onChange={e => setEditValue(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => upsertMutation.mutate({ key: editKey, value: editValue })} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
              <Button variant="ghost" onClick={() => { setEditKey(""); setEditValue(""); }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
