import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Search, PlusCircle, User, LayoutDashboard, ShieldCheck, LogIn, Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const main = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Explorar", url: "/explorar", icon: Search },
  { title: "Tendencias", url: "/tendencias", icon: Sparkles },
];
const creator = [
  { title: "Crear campaña", url: "/crear", icon: PlusCircle },
  { title: "Mi panel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Mi perfil", url: "/perfil", icon: User },
];
const others = [
  { title: "Iniciar sesión", url: "/auth", icon: LogIn },
  { title: "Administración", url: "/admin", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  const renderItems = (items: typeof main) =>
    items.map((it) => (
      <SidebarMenuItem key={it.url}>
        <SidebarMenuButton asChild isActive={isActive(it.url)}>
          <NavLink to={it.url} end={it.url === "/"}>
            <it.icon className="h-4 w-4" />
            {!collapsed && <span>{it.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-warm grid place-items-center text-primary-foreground font-bold shadow-warm">
            S
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold">Sembradora</div>
              <div className="text-xs text-muted-foreground">Crowdfunding universitario</div>
            </div>
          )}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Descubrir</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(main)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Creador</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(creator)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(others)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="rounded-xl border bg-accent/50 p-3 text-xs text-accent-foreground">
            Prototipo demo · datos de prueba
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
