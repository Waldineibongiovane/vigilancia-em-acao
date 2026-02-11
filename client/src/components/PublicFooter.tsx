import { Bug } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-primary mb-2">
              <Bug className="h-5 w-5" />
              Vigilância em Ação
            </div>
            <p className="text-sm text-muted-foreground">
              Sistema público de monitoramento e denúncias de dengue do município de Votuporanga/SP.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Fontes de Dados</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Vigilância Epidemiológica Municipal</li>
              <li>InfoDengue / DataSUS</li>
              <li>Denúncias da população</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Informações</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Dados atualizados diariamente</li>
              <li>LGPD: dados pessoais protegidos</li>
              <li>Votuporanga, SP – Brasil</li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-6 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vigilância em Ação – Votuporanga/SP. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
