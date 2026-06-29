import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Bell, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RootState } from "@/store/store";
import {
  useMyNotificationsQuery,
  useMarkNotificationsReadMutation,
} from "@/slices/apiSlice";

const NotificationsBell = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  // Solo consulta si hay sesión; refresca cada 10s para acercarse a tiempo real.
  const { data } = useMyNotificationsQuery(undefined, {
    skip: !user,
    pollingInterval: 10000,
  });
  const [markRead] = useMarkNotificationsReadMutation();

  if (!user) return null;

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const onOpenChange = (open: boolean) => {
    // Al abrir, marca todas como leídas.
    if (open && unread > 0) markRead();
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 font-semibold text-sm">Notificaciones</div>
        <div className="max-h-96 overflow-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tienes notificaciones.
            </div>
          ) : (
            items.map((n) => {
              const content = (
                <div
                  className={`flex gap-3 px-4 py-3 border-b last:border-0 ${
                    n.isRead ? "" : "bg-accent/40"
                  }`}
                >
                  <Trophy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.body}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("es-PE")}
                    </div>
                  </div>
                </div>
              );
              return n.entityType === "campaign" && n.entityId ? (
                <Link key={n.id} to={`/campana/${n.entityId}`} className="block hover:bg-muted/50">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
