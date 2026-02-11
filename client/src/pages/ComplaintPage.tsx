import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Camera, CheckCircle, Search, Loader2, Upload } from "lucide-react";
import { useState, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useSearch } from "wouter";

const complaintTypes = [
  { value: "standing_water", label: "Água parada" },
  { value: "abandoned_lot", label: "Terreno baldio" },
  { value: "trash_accumulation", label: "Acúmulo de lixo" },
  { value: "open_container", label: "Recipiente aberto" },
  { value: "construction_debris", label: "Entulho de obra" },
  { value: "other", label: "Outro" },
];

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

export default function ComplaintPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialTab = params.get("tab") === "consultar" ? "consultar" : "denunciar";

  const [tab, setTab] = useState(initialTab);
  const [type, setType] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);
  const [lookupProtocol, setLookupProtocol] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: neighborhoodsData } = trpc.neighborhoods.list.useQuery();
  const neighborhoods = useMemo(() => neighborhoodsData ?? [], [neighborhoodsData]);

  const createMutation = trpc.complaints.create.useMutation({
    onSuccess: (data) => {
      setSuccessProtocol(data.protocol);
      toast.success(`Denúncia registrada! Protocolo: ${data.protocol}`);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar denúncia. Tente novamente.");
    },
  });

  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupQuery = trpc.complaints.lookup.useQuery(
    { protocol: lookupProtocol },
    { enabled: false }
  );

  const handleLookup = useCallback(async () => {
    if (!lookupProtocol.trim()) {
      toast.error("Informe o número do protocolo");
      return;
    }
    setLookupLoading(true);
    try {
      const result = await lookupQuery.refetch();
      setLookupResult(result.data);
      if (!result.data) {
        toast.error("Protocolo não encontrado");
      }
    } catch {
      toast.error("Erro ao consultar protocolo");
    } finally {
      setLookupLoading(false);
    }
  }, [lookupProtocol, lookupQuery]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result.split(",")[1]);
      setPhotoMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setType("");
    setNeighborhoodId("");
    setAddress("");
    setDescription("");
    setAnonymous(true);
    setReporterName("");
    setReporterContact("");
    setPhotoPreview(null);
    setPhotoBase64(null);
    setPhotoMimeType(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) { toast.error("Selecione o tipo de foco"); return; }
    if (!neighborhoodId) { toast.error("Selecione o bairro"); return; }

    createMutation.mutate({
      type: type as any,
      neighborhoodId: parseInt(neighborhoodId),
      addressPrivate: address || undefined,
      description: description || undefined,
      anonymous,
      reporterName: anonymous ? undefined : reporterName || undefined,
      reporterContact: anonymous ? undefined : reporterContact || undefined,
      photoBase64: photoBase64 || undefined,
      photoMimeType: photoMimeType || undefined,
    });
  };

  return (
    <PublicLayout>
      <div className="container py-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Denúncias de Focos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registre possíveis focos do mosquito Aedes aegypti ou consulte o status de uma denúncia.
          </p>
        </div>

        {/* Success message */}
        {successProtocol && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-green-600 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-green-800">Denúncia Registrada!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Sua denúncia foi recebida com sucesso. Guarde o número do protocolo para acompanhamento:
                  </p>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-green-200 text-center">
                    <span className="text-2xl font-mono font-bold text-green-800">{successProtocol}</span>
                  </div>
                  <Button variant="outline" className="mt-3" onClick={() => setSuccessProtocol(null)}>
                    Fazer nova denúncia
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!successProtocol && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="denunciar" className="flex-1">Denunciar Foco</TabsTrigger>
              <TabsTrigger value="consultar" className="flex-1">Consultar Protocolo</TabsTrigger>
            </TabsList>

            <TabsContent value="denunciar">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Formulário de Denúncia</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type */}
                    <div className="space-y-2">
                      <Label>Tipo de Foco *</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          {complaintTypes.map(ct => (
                            <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Neighborhood */}
                    <div className="space-y-2">
                      <Label>Bairro *</Label>
                      <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
                        <SelectTrigger><SelectValue placeholder="Selecione o bairro" /></SelectTrigger>
                        <SelectContent>
                          {neighborhoods.map(n => (
                            <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Address (private) */}
                    <div className="space-y-2">
                      <Label>Endereço (privado - visível apenas para a vigilância)</Label>
                      <Input
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Rua, número, referência..."
                      />
                      <p className="text-xs text-muted-foreground">Este dado não será exibido publicamente (LGPD).</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Descreva o que encontrou..."
                        rows={3}
                        maxLength={2000}
                      />
                    </div>

                    {/* Photo */}
                    <div className="space-y-2">
                      <Label>Foto (opcional, máx. 10MB)</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                          <Camera className="h-4 w-4" />
                          {photoPreview ? "Trocar foto" : "Adicionar foto"}
                        </Button>
                        {photoPreview && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setPhotoMimeType(null); }}>
                            Remover
                          </Button>
                        )}
                      </div>
                      {photoPreview && (
                        <img src={photoPreview} alt="Preview" className="mt-2 rounded-lg max-h-48 object-cover border" />
                      )}
                    </div>

                    {/* Anonymous */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label>Denúncia anônima</Label>
                        <p className="text-xs text-muted-foreground">Seus dados não serão registrados</p>
                      </div>
                      <Switch checked={anonymous} onCheckedChange={setAnonymous} />
                    </div>

                    {/* Reporter info */}
                    {!anonymous && (
                      <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input value={reporterName} onChange={e => setReporterName(e.target.value)} placeholder="Seu nome" />
                        </div>
                        <div className="space-y-2">
                          <Label>Contato (telefone ou e-mail)</Label>
                          <Input value={reporterContact} onChange={e => setReporterContact(e.target.value)} placeholder="(17) 99999-9999" />
                        </div>
                        <p className="text-xs text-muted-foreground">Estes dados são privados e visíveis apenas para a vigilância.</p>
                      </div>
                    )}

                    <Button type="submit" className="w-full gap-2" size="lg" disabled={createMutation.isPending}>
                      {createMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Enviar Denúncia</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consultar">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consultar Denúncia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={lookupProtocol}
                      onChange={e => setLookupProtocol(e.target.value.toUpperCase())}
                      placeholder="Ex: VA-2026-ABCDEF"
                      className="font-mono"
                    />
                    <Button onClick={handleLookup} disabled={lookupLoading} className="gap-1 shrink-0">
                      {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Buscar
                    </Button>
                  </div>

                  {lookupResult && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold">{lookupResult.protocol}</span>
                          <Badge className={statusColors[lookupResult.status]}>
                            {statusLabels[lookupResult.status] || lookupResult.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <p>Data: {new Date(lookupResult.date).toLocaleDateString("pt-BR")}</p>
                          <p>Tipo: {complaintTypes.find(ct => ct.value === lookupResult.type)?.label || lookupResult.type}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {lookupResult === null && lookupProtocol && !lookupLoading && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma denúncia encontrada com este protocolo.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PublicLayout>
  );
}
