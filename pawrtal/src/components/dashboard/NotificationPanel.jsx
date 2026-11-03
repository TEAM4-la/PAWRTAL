import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, X, Calendar, Syringe, Pill, MessageSquare, FileText,
  CheckCheck, ChevronRight, BookOpen, Users
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { cleanNotificationMessage } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

const typeIcons = {
  appointment: Calendar,
  vaccination: Syringe,
  medication: Pill,
  message: MessageSquare,
  report: FileText,
  journal: BookOpen,
  pet: Users,
  reminder: Bell,
};

const typeColors = {
  appointment: 'bg-blue-100 text-blue-600',
  vaccination: 'bg-purple-100 text-purple-600',
  medication: 'bg-emerald-100 text-emerald-600',
  message: 'bg-teal-100 text-teal-600',
  report: 'bg-orange-100 text-orange-600',
  journal: 'bg-amber-100 text-amber-700',
  pet: 'bg-indigo-100 text-indigo-600',
  reminder: 'bg-amber-100 text-amber-600',
};

function getNotificationLink(notification, isVet) {
  const type = (notification.type || '').toLowerCase();
  const title = (notification.title || '').toLowerCase();
  const message = (notification.message || '').toLowerCase();
  const relatedType = (notification.related_entity_type || '').toLowerCase();

  // 1. Messages / Chat
  if (type === 'message' || relatedType === 'message' || title.includes('message') || message.includes('message')) {
    return '/messages';
  }

  // 2. Appointments / Bookings
  if (
    type === 'appointment' ||
    relatedType === 'appointment' ||
    title.includes('appointment') ||
    title.includes('booking') ||
    message.includes('appointment') ||
    message.includes('booking')
  ) {
    return isVet ? '/vet-appointments' : '/appointments';
  }

  // 3. Vaccinations
  if (type === 'vaccination' || relatedType === 'vaccination' || title.includes('vaccin') || message.includes('vaccin')) {
    return isVet ? '/vet-records' : '/health-records';
  }

  // 4. Medications / Prescriptions
  if (
    type === 'medication' ||
    relatedType === 'medication' ||
    title.includes('medicat') ||
    title.includes('prescription') ||
    message.includes('medicat')
  ) {
    return isVet ? '/vet-records' : '/health-records';
  }

  // 5. Medical Reports / Health Records
  if (
    type === 'report' ||
    type === 'record' ||
    relatedType === 'health_record' ||
    title.includes('record') ||
    title.includes('report') ||
    message.includes('record')
  ) {
    return isVet ? '/vet-records' : '/health-records';
  }

  // 6. Journal Entries
  if (type === 'journal' || relatedType === 'journal' || title.includes('journal') || message.includes('journal')) {
    return isVet ? '/vet-dashboard' : '/journal';
  }

  // 7. Pets / Patients
  if (type === 'pet' || relatedType === 'pet' || title.includes('pet ') || title.includes('patient')) {
    return isVet ? '/patients' : '/my-pets';
  }

  // Fallback defaults
  return isVet ? '/vet-dashboard' : '/dashboard';
}

export default function NotificationPanel({ userEmail, accentColor = 'amber', alignPopover = 'right' }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isVet = accentColor === 'teal';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => api.entities.Notification.filter({ user_email: userEmail }, '-created_date', 30),
    enabled: !!userEmail,
    refetchInterval: 5000,
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

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const timeA = a.created_date ? new Date(a.created_date).getTime() : 0;
      const timeB = b.created_date ? new Date(b.created_date).getTime() : 0;
      return timeB - timeA;
    });
  }, [notifications]);

  const bellColor = isVet ? 'text-teal-600' : 'text-amber-700';
  const bellHoverBg = isVet ? 'hover:bg-teal-100/60' : 'hover:bg-amber-100/60';
  const dotColor = isVet ? 'bg-teal-500' : 'bg-amber-500';
  const badgeBg = isVet ? 'bg-teal-600 text-white' : 'bg-amber-600 text-white';
  const markAllColor = isVet ? 'text-teal-600 hover:text-teal-700' : 'text-amber-700 hover:text-amber-800';
  const unreadBg = isVet ? 'bg-teal-50/50' : 'bg-amber-50/50';
  const viewLinkColor = isVet ? 'text-teal-600' : 'text-amber-700';

  const handleNotificationClick = (notification) => {
    // 1. Mark as read immediately if not yet read
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }

    // 2. Resolve target route and navigate
    const targetLink = getNotificationLink(notification, isVet);
    if (targetLink) {
      navigate(targetLink);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        type="button"
        className={cn("relative p-2 rounded-xl transition-colors cursor-pointer", bellHoverBg)}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className={cn("w-5 h-5", bellColor)} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Slide-in / Popover Panel */}
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
              className={cn(
                "fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:top-10 z-50 sm:w-[460px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden",
                alignPopover === 'left' ? 'sm:left-0' : 'sm:right-0'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50/60">
                <div className="flex items-center gap-2">
                  <Bell className={cn("w-4 h-4", bellColor)} />
                  <h4 className="font-semibold text-gray-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <Badge className={cn("text-xs px-1.5 py-0.5", badgeBg)}>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-gray-700"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[65vh] sm:h-[480px]">
                {sortedNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Bell className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm font-semibold text-gray-700">All caught up!</p>
                    <p className="text-xs text-gray-400 mt-1">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sortedNotifications.map((notification) => {
                      const Icon = typeIcons[notification.type] || Bell;
                      const isUnread = !notification.is_read;

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group flex items-start gap-3 relative",
                            isUnread && unreadBg
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className={cn(
                            "p-2 rounded-xl flex-shrink-0 mt-0.5",
                            typeColors[notification.type] || 'bg-gray-100 text-gray-500'
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "text-sm leading-snug",
                                isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                              )}>
                                {notification.title}
                              </p>
                            </div>

                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                              {cleanNotificationMessage(notification.message)}
                            </p>

                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[11px] text-gray-400 font-medium">
                                {notification.created_date ? (
                                  formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })
                                ) : (
                                  'Recent'
                                )}
                              </span>
                              <span className={cn(
                                "text-[11px] opacity-0 group-hover:opacity-100 transition-opacity font-medium inline-flex items-center gap-0.5",
                                viewLinkColor
                              )}>
                                View <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>

                          {isUnread && (
                            <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", dotColor)} />
                          )}
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
