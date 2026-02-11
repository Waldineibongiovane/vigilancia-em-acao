import PublicLayout from "@/components/PublicLayout";
import { MapView } from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Map, Info } from "lucide-react";
import { useRef, useCallback, useMemo } from "react";

const riskColors: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
};

const riskLabels: Record<string, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
};

const riskBgColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const riskEmoji: Record<string, string> = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
};

export default function MapPage() {
  const { data: neighborhoodsData, isLoading } = trpc.neighborhoods.list.useQuery();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const neighborhoods = useMemo(() => neighborhoodsData ?? [], [neighborhoodsData]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Add markers for each neighborhood
    if (neighborhoods.length > 0) {
      addMarkers(map, neighborhoods);
    }
  }, [neighborhoods]);

  const addMarkers = (map: google.maps.Map, data: typeof neighborhoods) => {
    // Clear existing markers
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];

    data.forEach(n => {
      if (!n.lat || !n.lng) return;
      const lat = parseFloat(n.lat);
      const lng = parseFloat(n.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = riskColors[n.riskLevel] || "#22c55e";

      // Create custom marker element
      const markerEl = document.createElement("div");
      markerEl.style.width = "32px";
      markerEl.style.height = "32px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.backgroundColor = color;
      markerEl.style.border = "3px solid white";
      markerEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      markerEl.style.cursor = "pointer";
      markerEl.style.display = "flex";
      markerEl.style.alignItems = "center";
      markerEl.style.justifyContent = "center";
      markerEl.style.fontSize = "14px";
      markerEl.style.fontWeight = "bold";
      markerEl.style.color = "white";
      markerEl.textContent = String(n.totalComplaints + n.totalCases);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: n.name,
        content: markerEl,
      });

      marker.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding:8px;min-width:200px;font-family:Inter,sans-serif;">
              <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;">${n.name}</h3>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
                <span style="font-size:13px;">Risco: <strong>${riskLabels[n.riskLevel]}</strong></span>
              </div>
              <div style="font-size:13px;color:#555;line-height:1.6;">
                <div>Denúncias: <strong>${n.totalComplaints}</strong></div>
                <div>Casos: <strong>${n.totalCases}</strong></div>
                ${n.infestationIndex ? `<div>Índice de Infestação: <strong>${n.infestationIndex}%</strong></div>` : ""}
              </div>
            </div>
          `);
          infoWindowRef.current.open({
            anchor: marker,
            map,
          });
        }
      });

      markersRef.current.push(marker);
    });
  };

  // Update markers when data changes
  useMemo(() => {
    if (mapRef.current && neighborhoods.length > 0) {
      addMarkers(mapRef.current, neighborhoods);
    }
  }, [neighborhoods]);

  return (
    <PublicLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Mapa de Focos e Riscos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize a situação da dengue por bairro em Votuporanga. Clique nos marcadores para ver detalhes.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {(["low", "medium", "high"] as const).map(level => (
            <div key={level} className="flex items-center gap-2 text-sm">
              <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: riskColors[level] }} />
              <span>{riskLabels[level]}</span>
            </div>
          ))}
        </div>

        {/* Map */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <MapView
              className="w-full h-[500px] md:h-[600px]"
              initialCenter={{ lat: -20.4219, lng: -49.9728 }}
              initialZoom={14}
              onMapReady={handleMapReady}
            />
          </CardContent>
        </Card>

        {/* Neighborhood list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Situação por Bairro
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {neighborhoods.map(n => (
                  <div key={n.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-sm">{n.name}</span>
                    <Badge variant="outline" className={`text-xs ${riskBgColors[n.riskLevel]}`}>
                      {riskEmoji[n.riskLevel]} {riskLabels[n.riskLevel]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center py-2">
          Os marcadores representam dados agregados por bairro. Endereços exatos não são exibidos publicamente (LGPD).
        </div>
      </div>
    </PublicLayout>
  );
}
