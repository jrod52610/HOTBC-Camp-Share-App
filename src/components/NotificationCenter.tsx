import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/NotificationContext";
import { Notification } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

export function NotificationCenter() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Filter notifications based on user permissions
  const userPermissions = currentUser?.permissions || [];
  
  // Only show notifications that are:
  // 1. Not targeted for a specific permission, or
  // 2. Targeted for a permission that the user has
  const filteredNotifications = notifications.filter((notification) => {
    if (!notification.forPermission) return true;
    return userPermissions.includes(notification.forPermission);
  });
  
  // Group notifications by their read status
  const unreadNotifications = filteredNotifications.filter((n) => !n.read);
  const readNotifications = filteredNotifications.filter((n) => n.read);
  
  // Calculate unread count from filtered notifications
  const unreadCount = unreadNotifications.length;

  // Mark notifications as read when the popover is opened
  useEffect(() => {
    if (open && unreadCount > 0) {
      // We don't auto-mark as read - user must click on the notification
    }
  }, [open, unreadCount]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 font-medium border-b flex items-center justify-between">
          <h4 className="text-sm">Notifications</h4>
          <div className="flex items-center gap-1">
            {filteredNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
            {filteredNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={clearAll}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        <Tabs defaultValue="unread">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger
              value="unread"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Unread ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              All ({filteredNotifications.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="unread" className="p-0">
            <ScrollArea className="h-[300px]">
              {unreadNotifications.length === 0 ? (
                <div className="text-center p-6 text-sm text-muted-foreground">
                  No unread notifications
                </div>
              ) : (
                <div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                      onRemove={removeNotification}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="all" className="p-0">
            <ScrollArea className="h-[300px]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center p-6 text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                      onRemove={removeNotification}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onRemove: (id: string) => void;
}

function NotificationItem({
  notification,
  onClick,
  onRemove,
}: NotificationItemProps) {
  // Different visual styling based on notification type
  const getTypeStyles = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-l-red-500";
      case "warning":
        return "bg-amber-50 border-l-amber-500";
      case "success":
        return "bg-green-50 border-l-green-500";
      case "info":
      default:
        return "bg-blue-50 border-l-blue-500";
    }
  };

  return (
    <div
      className={`border-l-4 ${getTypeStyles(
        notification.type
      )} ${!notification.read ? "font-medium" : ""} hover:bg-muted/50 transition-colors`}
    >
      <div
        className="p-3 cursor-pointer"
        onClick={() => onClick(notification)}
      >
        <div className="flex justify-between items-start">
          <h5 className="font-medium text-sm">{notification.title}</h5>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notification.id);
            }}
          >
            <span className="sr-only">Remove</span>
            <span aria-hidden className="text-xs">×</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {notification.message}
        </p>
        <div className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
        </div>
      </div>
      <Separator />
    </div>
  );
}