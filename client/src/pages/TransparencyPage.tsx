import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Eye, Clock, CheckCircle, BarChart3, Shield, FileText } from "lucide-react";
import { useMemo } from "react";

const complaintTypeLabels: Record<string, string> = {
  standing_water: "Água parada",
  abandoned_lot: "Terreno baldio",
  trash_accumulation: "Acúmulo de lixo",
  open_container: "Recipiente aberto",
  construction_debris: "Entulho de obra",
  other: "Outro",
};

const statusLabels: Record<string, string> = {
  received: "Recebida",
  in_analysis: "Em análise",
  confirmed: "Confirmada",
  resolved: "Resolvida",
  rejected: "Rejeitada",
  archived: "Arquivada",
};

const statusColors: Record<string, string> = {
  confirmed: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
};

export default function TransparencyPage() {
  const { data: stats, isLoading: loadingStats } = trpc.complaints.stats.useQuery();
  const { data: publicComplaints, isLoading: loadingComplaints } = trpc.complaints.publicList.useQuery({ limit: 50 });
  const { data: neighborhoodsData } = trpc.neighborhoods.list.useQuery();

  const neighborhoods = useMemo(() => {
    const map: Record<number, string> = {};
    neighborhoodsData?.forEach(n => { map[n.id] = n.name; });
    return map;
  }, [neighborhoodsData]);

  const avgTimeDays = useMemo(() => {
    if (!stats?.avgResolutionTimeMs) return "—";
    const days = Math.round(stats.avgResolutionTimeMs / 86400000);
    return days <= 0 ? "< 1 dia" : `${days} dia${days > 1 ? "s" : ""}`;
  }, [stats]);

  const resolutionRate = useMemo(() => {
    if (!stats || stats.total === 0) return "0%";
    return `${Math.round((stats.resolved / stats.total) * 100)}%`;
  }, [stats]);

  return (
    <PublicLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Transparência
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe as ações da vigilância sanitária e o histórico de denúncias resolvidas.
          </p>
        </div>

        {/* Stats cards */}
        {loadingStats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2 opacity-70" />
                <p className="text-2xl font-extrabold">{stats?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total de Denúncias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2 opacity-70" />
                <p className="text-2xl font-extrabold">{stats?.resolved ?? 0}</p>
                <p className="text-xs text-muted-foreground">Resolvidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2 opacity-70" />
                <p className="text-2xl font-extrabold">{avgTimeDays}</p>
                <p className="text-xs text-muted-foreground">Tempo Médio de Resposta</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2 opacity-70" />
                <p className="text-2xl font-extrabold">{resolutionRate}</p>
                <p className="text-xs text-muted-foreground">Taxa de Resolução</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Public complaints history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Histórico de Denúncias (confirmadas e resolvidas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingComplaints ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : publicComplaints?.items && publicComplaints.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Protocolo</th>
                      <th className="pb-2 font-medium text-muted-foreground">Data</th>
                      <th className="pb-2 font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
                      <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Bairro</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicComplaints.items.map((c: any) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-mono text-xs">{c.protocol}</td>
                        <td className="py-3 text-muted-foreground">{new Date(c.date).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3 hidden sm:table-cell">{complaintTypeLabels[c.type] || c.type}</td>
                        <td className="py-3 hidden md:table-cell">{neighborhoods[c.neighborhoodId] || "—"}</td>
                        <td className="py-3 text-right">
                          <Badge variant="outline" className={`text-xs ${statusColors[c.status] || ""}`}>
                            {statusLabels[c.status] || c.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma denúncia confirmada ou resolvida ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* LGPD & Data info */}
        <Card className="bg-muted/30">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Política de Dados e LGPD
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                O sistema Vigilância em Ação respeita a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                Dados pessoais como endereço, nome e contato do denunciante são armazenados de forma segura e
                acessíveis apenas pela equipe administrativa da vigilância sanitária.
              </p>
              <p>
                Nenhum endereço exato ou dado pessoal é exibido publicamente. As informações mostradas nesta
                página são agregadas por bairro e não permitem a identificação individual.
              </p>
              <p>
                As fontes de dados epidemiológicos incluem: Vigilância Epidemiológica Municipal, InfoDengue,
                DataSUS e denúncias da população. Os dados são atualizados diariamente e estão sujeitos a
                revisão e correção.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
