import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        setLocation("/admin");
      }, 1000);
    },
    onError: (err) => {
      setError(err.message || "Erro ao fazer login");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-6 h-6" />
            <CardTitle>Painel Administrativo</CardTitle>
          </div>
          <CardDescription className="text-green-100">
            Vigilância em Ação - Acesso Restrito
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Login realizado com sucesso! Redirecionando...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário
              </label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginMutation.isPending || success}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Padrão: admin</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending || success}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Padrão: admin</p>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending || success || !username || !password}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loginMutation.isPending ? "Autenticando..." : "Acessar Painel"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Credenciais de Teste:</strong>
              <br />
              Usuário: <code className="bg-white px-1 rounded">admin</code>
              <br />
              Senha: <code className="bg-white px-1 rounded">admin</code>
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Sistema de Vigilância Epidemiológica de Dengue
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
