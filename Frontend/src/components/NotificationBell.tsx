// src/components/NotificationBell.tsx
import { Bell, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { formatDistanceToNow } from "date-fns";
import {
  markAllNotificationAsReadAsyncThunk,
  markNotificationAsReadAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";

export default function NotificationBell() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications } = useSelector((state: RootState) => state.general);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[11px] font-bold text-white shadow-lg pl-1.5 pt-0.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between text-base font-semibold">
          <span>Notifications</span>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllNotificationAsReadAsyncThunk())}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications?.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications?.map((notif) => {
            const isUnread = !notif.is_read;

            return (
              <DropdownMenuItem
                key={notif.id}
                className={`
                  relative flex flex-col items-start gap-1 p-4 cursor-pointer rounded-lg mx-2 my-1
                  transition-all duration-200
                  ${isUnread
                    ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                    : "hover:bg-muted/50"
                  }
                `}
                onSelect={() => dispatch(markNotificationAsReadAsyncThunk({ notification_id: notif.id }))}
              >
                {/* Unread Dot Indicator */}
                {isUnread && (
                  <Circle className="absolute top-4 left-2 h-2.5 w-2.5 fill-primary text-primary" />
                )}

                <div className={`flex w-full justify-between items-start ${isUnread ? "pl-5" : ""}`}>
                  <span
                    className={`
                      font-semibold text-sm line-clamp-1
                      ${isUnread ? "text-foreground font-bold" : "text-foreground/80"}
                    `}
                  >
                    {notif.name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {notif?.date && notif?.time ? formatDistanceToNow(new Date(notif?.date + " " + notif?.time), { addSuffix: true }) : "-"}
                  </span>
                </div>

                <p className={`text-xs mt-1 line-clamp-2 ${isUnread ? "text-foreground/90" : "text-muted-foreground"}`}>
                  {notif.message}
                </p>

                {/* Optional: Extra visual for unread */}
                {isUnread && (
                  <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-primary/5 to-transparent" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}