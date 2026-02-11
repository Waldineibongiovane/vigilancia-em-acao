import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, Calendar, ChevronRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function BulletinsPage() {
  const { data, isLoading } = trpc.bulletins.list.useQuery({ limit: 20 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: selectedBulletin, isLoading: loadingBulletin } = trpc.bulletins.getById.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  if (selectedBulletin && selectedId !== null) {
    return (
      <PublicLayout>
        <div className="container py-6 max-w-3xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => setSelectedId(null)} className="gap-1">
            ← Voltar aos boletins
          </Button>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {selectedBulletin.type === "daily" ? "Diário" : "Semanal"}
                </Badge>
                {selectedBulletin.publishedAt && (
                  <span className="text-xs text-muted-foreground">
                    Publicado em {new Date(selectedBulletin.publishedAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <CardTitle className="text-xl">{selectedBulletin.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Período: {new Date(selectedBulletin.periodStart).toLocaleDateString("pt-BR")} a {new Date(selectedBulletin.periodEnd).toLocaleDateString("pt-BR")}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <Streamdown>{selectedBulletin.content}</Streamdown>
            </CardContent>
          </Card>
          {selectedBulletin.generatedByAi && (
            <p className="text-xs text-muted-foreground text-center">
              Este boletim foi gerado automaticamente por inteligência artificial com base nos dados coletados.
              Os números apresentados são extraídos das fontes oficiais disponíveis.
            </p>
          )}
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Boletins Epidemiológicos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe os boletins sobre a situação da dengue em Votuporanga, gerados com análise de tendências e recomendações.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="space-y-3">
            {data.items.map(bulletin => (
              <Card
                key={bulletin.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedId(bulletin.id)}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {bulletin.type === "daily" ? "Diário" : "Semanal"}
                          </Badge>
                          {bulletin.generatedByAi && (
                            <Badge variant="secondary" className="text-xs">IA</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm md:text-base">{bulletin.title}</h3>
                        {bulletin.summary && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bulletin.summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(bulletin.periodStart).toLocaleDateString("pt-BR")} - {new Date(bulletin.periodEnd).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg">Nenhum boletim publicado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Os boletins epidemiológicos serão publicados aqui conforme forem gerados pela equipe de vigilância.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
