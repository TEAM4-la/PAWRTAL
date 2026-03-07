import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Calendar, Syringe, Pill, MessageSquare, FileText, CheckCheck, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';


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

export default function NotificationPanel({ userEmail, accentColor = 'amber' }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => api.entities.Notification.filter({ user_email: userEmail }, '-created_date', 30),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => api.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] }),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const bellColor = accentColor === 'teal' ? 'text-teal-600' : 'text-amber-700';
  const dotColor = accentColor === 'teal' ? 'bg-teal-500' : 'bg-amber-500';
  const badgeBg = accentColor === 'teal' ? 'bg-teal-500' : 'bg-amber-600';
  const markAllColor = accentColor === 'teal' ? 'text-teal-600 hover:text-teal-700' : 'text-amber-700 hover:text-amber-800';
  const unreadBg = accentColor === 'teal' ? 'bg-teal-50/60' : 'bg-amber-50/60';

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className={cn("w-5 h-5", bellColor)} />
        {unreadCount > 0 && (
          <span className={cn("absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center", badgeBg)}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-10 z-50 w-[460px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Bell className={cn("w-4 h-4", bellColor)} />
                  <h4 className="font-semibold text-gray-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <Badge className={cn("text-white text-xs px-1.5 py-0.5", badgeBg)}>
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("text-xs gap-1", markAllColor)}
                      onClick={() => markAllReadMutation.mutate()}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[500px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Bell className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notification) => {
                      const Icon = typeIcons[notification.type] || Bell;
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group",
                            !notification.is_read && unreadBg
                          )}
                          onClick={() => !notification.is_read && markReadMutation.mutate(notification.id)}
                        >
                          <div className="flex gap-3 items-start">
                            <div className={cn("p-2 rounded-xl flex-shrink-0", typeColors[notification.type] || 'bg-gray-100 text-gray-500')}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm leading-snug",
                                !notification.is_read ? "font-semibold text-gray-900" : "text-gray-700"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1.5">
                                {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", dotColor)} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}