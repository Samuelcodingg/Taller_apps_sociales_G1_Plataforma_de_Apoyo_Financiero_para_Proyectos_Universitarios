import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusCircle,
  User,
  LayoutDashboard,
  ShieldCheck,
  LogIn,
  Sparkles,
  LogOut,
  RegexIcon,
  UserRound,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthProvider";
import { SidebarOptions } from "@/types/sidebar";
import {
  SIDEBAR_ACCOUNT,
  SIDEBAR_ADMIN,
  SIDEBAR_CREATOR,
  SIDEBAR_MAIN,
} from "@/lib/constants";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isActive = (p: string) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p);

  const renderItems = (items: SidebarOptions) =>
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
              <div className="text-xs text-muted-foreground">
                Crowdfunding universitario
              </div>
            </div>
          )}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        {/* Sección "Descubrir" */}
        <SidebarGroup>
          <SidebarGroupLabel>Descubrir</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(SIDEBAR_MAIN)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Sección "Creador" */}
        {user && user.rol === "creator" && (
          <SidebarGroup>
            <SidebarGroupLabel>Creador</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(SIDEBAR_CREATOR)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* Sección "Cuenta" */}
        {!user && (
          <SidebarGroup>
            <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(SIDEBAR_ACCOUNT)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* Sección "Admin" */}
        {user && user.rol === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(SIDEBAR_ADMIN)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      {user && (
        <SidebarFooter className="p-3">
          {
            <div className="flex gap-3 items-center justify-center rounded-xl border bg-accent/50 p-3 text-sm text-accent-foreground cursor-pointer hover:bg-accent">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="">Cerrar sesión</span>}
            </div>
          }
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
