import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bug, LayoutDashboard, Map, FileText, Shield, Menu, AlertTriangle, Eye } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

const navItems = [
  { label: "Painel", path: "/", icon: LayoutDashboard },
  { label: "Mapa", path: "/mapa", icon: Map },
  { label: "Denunciar", path: "/denunciar", icon: AlertTriangle },
  { label: "Boletins", path: "/boletins", icon: FileText },
  { label: "Transparência", path: "/transparencia", icon: Eye },
];

export default function PublicNav() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Bug className="h-6 w-6" />
          <span className="hidden sm:inline">Vigilância em Ação</span>
          <span className="sm:hidden">V.A.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user?.role === "admin" && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map(item => {
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path} onClick={() => setOpen(false)}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start gap-2"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
                {isAuthenticated && user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Shield className="h-4 w-4" />
                      Painel Admin
                    </Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
