import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { getInitialsNames } from "@/lib/utils";
import NotificationsBell from "@/components/NotificationsBell";

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-soft">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-background/70 backdrop-blur px-3 sm:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Construyamos juntos
              </span>
            </div>
            {/*  */}
            {user && (
              <div className="flex items-center gap-3">
                <NotificationsBell />
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-warm text-primary-foreground text-sm">
                    {getInitialsNames(user.names, user.lastNames)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
