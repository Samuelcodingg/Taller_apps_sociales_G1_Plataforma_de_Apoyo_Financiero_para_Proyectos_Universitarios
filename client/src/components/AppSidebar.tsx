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
import { SidebarOptions } from "@/types/sidebar";
import {
  ROLES,
  SIDEBAR_ACCOUNT,
  SIDEBAR_ADMIN,
  SIDEBAR_CREATOR,
  SIDEBAR_DONOR,
  SIDEBAR_MAIN,
} from "@/lib/constants";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { logout } from "@/slices/authSlice";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

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

  const logOut = () => {
    dispatch(logout());
  };

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
        {user && user.role === ROLES[0] && (
          <SidebarGroup>
            <SidebarGroupLabel>Creador</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(SIDEBAR_CREATOR)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {user && user.role === ROLES[1] && (
          <SidebarGroup>
            <SidebarGroupLabel>Donador</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(SIDEBAR_DONOR)}</SidebarMenu>
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
        {user && user.role === ROLES[2] && (
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
            <div
              className="flex gap-3 items-center justify-center rounded-xl border bg-accent/50 p-3 text-sm text-accent-foreground cursor-pointer hover:bg-accent"
              onClick={logOut}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="">Cerrar sesión</span>}
            </div>
          }
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
