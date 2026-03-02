import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, CheckCheck, Trash2, User, ShoppingCart, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAdminAlerts, markAdminAlertRead, markAllAdminAlertsRead, deleteAdminAlert, type AdminAlert } from "@/api/adminAlerts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function alertIcon(type: AdminAlert["type"]) {
  switch (type) {
    case "new_user":
      return <User className="w-4 h-4 text-blue-500" />;
    case "new_purchase":
      return <ShoppingCart className="w-4 h-4 text-green-500" />;
    case "referral_signup":
      return <UserPlus className="w-4 h-4 text-purple-500" />;
    case "referral_purchase":
      return <ShoppingCart className="w-4 h-4 text-purple-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AdminAlertBell() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const failCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAdminAlerts();
      failCountRef.current = 0;
      setServerDown(false);
      setAlerts(data.alerts);
      setUnreadCount(data.unreadCount);
    } catch (err: any) {
      failCountRef.current += 1;
      // Stop polling immediately on a network error (e.g. ERR_CONNECTION_REFUSED / Failed to fetch)
      // or after 2 consecutive server-side errors
      const isNetworkError =
        err instanceof TypeError ||
        String(err?.message).toLowerCase().includes("failed to fetch") ||
        String(err?.message).toLowerCase().includes("network");
      if (isNetworkError || failCountRef.current >= 2) {
        setServerDown(true);
        stopPolling();
      }
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    intervalRef.current = setInterval(fetchAlerts, 30000);
  }, [fetchAlerts, stopPolling]);

  useEffect(() => {
    // Small delay so the initial fetch doesn't fire before the app settles
    const initTimer = setTimeout(async () => {
      await fetchAlerts();
      // Only start polling if the initial fetch succeeded (server is up)
      if (!serverDown && failCountRef.current === 0) {
        startPolling();
      }
    }, 1000);
    return () => {
      clearTimeout(initTimer);
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markAdminAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, read: true } : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminAlertsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
      toast({ title: "All alerts marked as read" });
    } catch (_) {}
  };

  const handleDelete = async (id: string) => {
    const alert = alerts.find((a) => a._id === id);
    try {
      await deleteAdminAlert(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      if (alert && !alert.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  return (
    <DropdownMenu open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) {
        // Reset failure count and retry when user opens the dropdown
        failCountRef.current = 0;
        setServerDown(false);
        fetchAlerts().then(() => {
          if (!intervalRef.current) startPolling();
        });
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {serverDown && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-gray-400" title="Server offline — alerts paused" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs h-5 px-1.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Alert list */}
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                    !alert.read && "bg-blue-50/50 dark:bg-blue-950/10"
                  )}
                  onClick={() => !alert.read && handleMarkRead(alert._id)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {alertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-tight", !alert.read && "font-semibold")}>
                        {alert.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleDelete(alert._id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">{timeAgo(alert.createdAt)}</span>
                      {!alert.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
