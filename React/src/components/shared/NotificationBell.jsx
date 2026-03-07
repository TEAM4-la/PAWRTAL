import React, { useState } from 'react';
import { Bell, Check, X, Calendar, Syringe, Pill, MessageSquare, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  appointment: Calendar,
  vaccination: Syringe,
  medication: Pill,
  message: MessageSquare,
  report: FileText,
  reminder: Bell,
};

const typeColors = {
  appointment: 'bg-blue-100 text-blue-600',
  vaccination: 'bg-purple-100 text-purple-600',
  medication: 'bg-green-100 text-green-600',
  message: 'bg-teal-100 text-teal-600',
  report: 'bg-orange-100 text-orange-600',
  reminder: 'bg-amber-100 text-amber-600',
};

export default function NotificationBell({ notifications = [], onMarkRead, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12">
          <Bell className="w-8 h-8 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-gray-900">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-teal-600 hover:text-teal-700"
              onClick={onMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="w-10 h-10 mb-2 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                      !notification.is_read && "bg-teal-50/50"
                    )}
                    onClick={() => onMarkRead && onMarkRead(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={cn("p-2 rounded-lg", typeColors[notification.type])}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm line-clamp-1",
                          !notification.is_read ? "font-semibold text-gray-900" : "text-gray-700"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}