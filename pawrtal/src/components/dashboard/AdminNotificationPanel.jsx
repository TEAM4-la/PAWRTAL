import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, X, CheckCheck, Syringe, Pill, AlertTriangle, AlertOctagon,
  CalendarClock, CalendarX, UserPlus, ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointmentStatus } from '@/utils';

const STORAGE_KEY = 'pawrtal_admin_read_notifications';

export default function AdminNotificationPanel({ alignPopover = 'right', currentUser: propUser }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Track read notification IDs in localStorage
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveReadIds = (newIds) => {
    setReadIds(newIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
    } catch {
      // ignore
    }
  };

  // Fetch current user if not provided via props
  const { data: queriedUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
    enabled: !propUser,
  });
  const currentUser = propUser || queriedUser;

  // Fetch all clinical inventory items (vaccines and medications)
  const { data: inventory = [] } = useQuery({
    queryKey: ['adminInventoryNotifications'],
    queryFn: () => api.entities.InventoryItem.list('-created_date', 500),
    refetchInterval: 15000,
  });

  // Fetch appointments for booking requests and cancellations
  const { data: appointments = [] } = useQuery({
    queryKey: ['adminAppointmentsNotifications'],
    queryFn: () => api.entities.Appointment.list('-created_date', 300),
    refetchInterval: 15000,
  });

  // Fetch users for new registrations
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsersNotifications'],
    queryFn: () => api.entities.User.list('-created_date', 200),
    refetchInterval: 30000,
  });

  // Fetch database notifications for the admin (e.g. vet recorded vaccinations / medications)
  const { data: dbNotifications = [] } = useQuery({
    queryKey: ['adminDbNotifications', currentUser?.email],
    queryFn: () => api.entities.Notification.filter({ user_email: currentUser?.email }, '-created_date', 50),
    enabled: !!currentUser?.email,
    refetchInterval: 5000,
  });

  // Aggregate and filter notifications based on Admin settings
  const notifications = useMemo(() => {
    const list = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysOutStr = thirtyDaysOut.toISOString().split('T')[0];

    const prefs = currentUser?.notification_preferences || {};
    const allowAppointments = prefs.appointments !== false;
    const allowVaccinations = prefs.vaccinations !== false;
    const allowMedications = prefs.medications !== false;

    // ─── 1. Appointments (New Bookings & Cancellations) ────────────────────
    if (allowAppointments && Array.isArray(appointments)) {
      const activeAppts = appointments.filter((a) => !a.is_deleted && !a.isDeleted);
      for (const a of activeAppts) {
        const derivedStatus = getAppointmentStatus ? getAppointmentStatus(a) : a.status;

        // A) New Incoming Booking Requests (Pending)
        if (derivedStatus === 'pending') {
          list.push({
            id: `${a.id}_pending`,
            title: `New Booking Request: ${a.pet_name || 'Pet'}`,
            message: `${a.owner_name || a.user_email || 'Pet owner'} submitted a request for ${a.appointment_type || 'appointment'} on ${a.date || 'upcoming'} at ${a.time || 'scheduled time'}.`,
            dateInfo: `Pending confirmation · ${a.date || 'Upcoming'}`,
            Icon: CalendarClock,
            iconColor: 'bg-amber-100 text-amber-700',
            severity: 1,
            link: '/admin-appointments',
            rawTimestamp: a.created_at || a.date,
          });
        }
        // B) Appointment Cancellations (Veterinarian vs Pet Owner vs Admin)
        else if (derivedStatus === 'cancelled' || (a.status || '').toLowerCase() === 'cancelled') {
          const reasonText = a.reason || '';
          let cancelledBy = a.cancelled_by;
          let cancelledByName = a.cancelled_by_name;
          let cleanReason = '';

          // Extract reason and detect who cancelled
          const cancelIdx = reasonText.toLowerCase().lastIndexOf('cancellation reason');
          if (cancelIdx >= 0) {
            const part = reasonText.substring(cancelIdx);
            const match = part.match(/Cancellation Reason\s*(?:\((?:by\s*)?([^)]+)\)|\[(?:by\s*)?([^\]]+)\])?:\s*(.*)/i);
            if (match) {
              const tag = (match[1] || match[2] || '').toLowerCase();
              cleanReason = (match[3] || '').trim();
              if (!cancelledBy) {
                if (tag.includes('vet') || tag.includes('doctor') || tag.includes('dr')) {
                  cancelledBy = 'veterinarian';
                } else if (tag.includes('admin') || tag.includes('staff')) {
                  cancelledBy = 'admin';
                } else if (tag.includes('owner') || tag.includes('client')) {
                  cancelledBy = 'pet_owner';
                }
              }
              if (!cancelledByName && (match[1] || match[2])) {
                cancelledByName = (match[1] || match[2]).trim();
              }
            } else {
              cleanReason = part.replace(/^cancellation reason:\s*/i, '').trim();
            }
          } else {
            cleanReason = reasonText;
          }

          // Fallback detection from reason text
          if (!cancelledBy) {
            if (/by veterinarian|by doctor|dr\./i.test(reasonText)) {
              cancelledBy = 'veterinarian';
            } else if (/by clinic admin|by admin/i.test(reasonText)) {
              cancelledBy = 'admin';
            } else if (/by pet owner|by owner/i.test(reasonText)) {
              cancelledBy = 'pet_owner';
            }
          }

          const petLabel = a.pet_name || 'Pet';
          const typeLabel = a.type?.replace('_', ' ') || a.appointment_type || 'appointment';
          const dateLabel = a.date || 'date';
          const reasonSuffix = cleanReason ? ` Reason: "${cleanReason}"` : '.';

          let title = `Appointment Cancelled: ${petLabel}`;
          let message = `The ${typeLabel} on ${dateLabel} was cancelled.${reasonSuffix}`;
          let dateInfo = `Cancelled · ${dateLabel}`;

          if (cancelledBy === 'veterinarian') {
            const rawVet = a.vet_name || (cancelledByName?.replace(/^(?:by\s*)?veterinarian:?\s*/i, '')) || 'Veterinarian';
            const vetDisplayName = rawVet.startsWith('Dr.') ? rawVet : `Dr. ${rawVet}`;
            title = `Appointment Cancelled by Vet: ${petLabel}`;
            message = `${vetDisplayName} cancelled the ${typeLabel} on ${dateLabel}.${reasonSuffix}`;
            dateInfo = `Cancelled by Vet · ${dateLabel}`;
          } else if (cancelledBy === 'pet_owner') {
            const ownerDisplayName = a.owner_name || (cancelledByName?.replace(/^(?:by\s*)?pet owner:?\s*/i, '')) || a.owner_email || 'Pet owner';
            title = `Appointment Cancelled by Owner: ${petLabel}`;
            message = `Pet owner ${ownerDisplayName} cancelled the ${typeLabel} on ${dateLabel}.${reasonSuffix}`;
            dateInfo = `Cancelled by Pet Owner · ${dateLabel}`;
          } else if (cancelledBy === 'admin') {
            title = `Appointment Cancelled by Admin: ${petLabel}`;
            message = `Clinic administrator cancelled the ${typeLabel} on ${dateLabel}.${reasonSuffix}`;
            dateInfo = `Cancelled by Admin · ${dateLabel}`;
          }

          list.push({
            id: `${a.id}_cancelled`,
            title,
            message,
            dateInfo,
            Icon: CalendarX,
            iconColor: 'bg-rose-100 text-rose-700',
            severity: 2,
            link: '/admin-appointments',
            rawTimestamp: a.updated_at || a.created_at || a.date,
          });
        }
      }
    }

    // ─── 2. User Registrations (Newly registered pet owners / staff) ────────
    if (Array.isArray(users)) {
      const activeUsers = users.filter(
        (u) => !u.is_deleted && !u.isDeleted && u.email?.toLowerCase() !== currentUser?.email?.toLowerCase()
      );

      for (const u of activeUsers) {
        const createdRaw = u.created_at || u.createdAt;
        let isRecent = false;
        let dateInfo = 'Recently registered';

        if (createdRaw) {
          const createdDate = new Date(createdRaw);
          const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          // Alert for accounts created in the last 14 days
          if (diffDays <= 14) {
            isRecent = true;
            dateInfo = diffDays <= 0 ? 'Registered today' : diffDays === 1 ? 'Registered yesterday' : `Registered ${diffDays} days ago`;
          }
        } else {
          isRecent = true;
        }

        if (isRecent) {
          const roleLabel =
            u.user_type === 'veterinarian'
              ? 'Veterinarian'
              : u.user_type === 'admin'
              ? 'Clinic Staff'
              : 'Pet Owner';

          list.push({
            id: `${u.id}_new_account`,
            title: `New ${roleLabel}: ${u.full_name || u.display_name || u.first_name || u.email}`,
            message: `A new ${roleLabel.toLowerCase()} profile was registered (${u.email}${u.phone ? ` · ${u.phone}` : ''}).`,
            dateInfo,
            Icon: UserPlus,
            iconColor: 'bg-indigo-100 text-indigo-700',
            severity: 3,
            link: '/admin-staff',
            rawTimestamp: createdRaw,
          });
        }
      }
    }

    // ─── 3. Database Notifications (Vet Recorded Vaccinations / Prescriptions) ───
    if (Array.isArray(dbNotifications)) {
      for (const n of dbNotifications) {
        const type = (n.type || '').toLowerCase();
        const isVaccine = type === 'vaccination';
        const isMed = type === 'medication';

        // Honor Admin settings toggles
        if (isVaccine && !allowVaccinations) continue;
        if (isMed && !allowMedications) continue;

        const IconComponent = isVaccine ? Syringe : isMed ? Pill : Bell;
        const iconColor = isVaccine 
          ? 'bg-purple-100 text-purple-700' 
          : isMed 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-blue-100 text-blue-700';

        let dateInfo = 'Recent';
        if (n.created_date) {
          try {
            dateInfo = formatDistanceToNow(new Date(n.created_date), { addSuffix: true });
          } catch {
            dateInfo = 'Recent';
          }
        }

        list.push({
          id: n.id,
          title: n.title,
          message: n.message,
          dateInfo,
          Icon: IconComponent,
          iconColor,
          severity: 2,
          link: '/admin-inventory',
          isDbNotification: true,
          isReadDb: n.is_read,
          rawTimestamp: n.created_date,
        });
      }
    }

    // ─── 4. Inventory Items (Vaccinations & Medications Thresholds) ──────────
    const activeItems = Array.isArray(inventory)
      ? inventory.filter((item) => !item.is_deleted && !item.isDeleted)
      : [];

    for (const item of activeItems) {
      const itemType = (item.item_type || item.itemType || '').toLowerCase();
      const isVaccine = itemType.includes('vaccine');

      // Honor Admin settings toggles
      if (isVaccine && !allowVaccinations) continue;
      if (!isVaccine && !allowMedications) continue;

      const minLevel = Number(item.min_stock_level ?? item.minStockLevel ?? 5);
      const qty = Number(item.quantity ?? 0);
      const expDate = item.expiration_date || item.expirationDate || null;
      const itemName = item.name || 'Clinical Item';
      const Icon = isVaccine ? Syringe : Pill;
      const iconColor = isVaccine ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600';

      // 1. Out of stock alert
      if (qty <= 0) {
        list.push({
          id: `${item.id}_out_of_stock`,
          title: `Out of Stock: ${itemName}`,
          message: `${item.item_type || 'Supply'} is currently out of stock (0 ${item.unit || 'units'}). Restock required.`,
          dateInfo: 'Out of stock',
          Icon: AlertOctagon,
          iconColor: 'bg-red-100 text-red-600',
          severity: 1,
          link: '/admin-inventory',
          rawTimestamp: item.updated_at || item.created_at || item.updatedAt || item.createdAt,
        });
      }
      // 2. Low in stock alert
      else if (qty <= minLevel) {
        list.push({
          id: `${item.id}_low_stock_${qty}`,
          title: `Low Stock: ${itemName}`,
          message: `Only ${qty} ${item.unit || 'units'} left in stock. Minimum threshold is ${minLevel}.`,
          dateInfo: `Low stock · ${qty} remaining`,
          Icon,
          iconColor,
          severity: 2,
          link: '/admin-inventory',
          rawTimestamp: item.updated_at || item.created_at || item.updatedAt || item.createdAt,
        });
      }

      // 3. Expiration checks
      if (expDate) {
        const itemExpDate = new Date(expDate);
        const itemExpDay = new Date(itemExpDate.getFullYear(), itemExpDate.getMonth(), itemExpDate.getDate());

        // Expired
        if (expDate < todayStr) {
          list.push({
            id: `${item.id}_expired_${expDate}`,
            title: `Expired: ${itemName}`,
            message: `Batch ${item.batch_number || item.batchNumber || 'N/A'} expired on ${expDate}. Dispose of properly.`,
            dateInfo: `Expired on ${expDate}`,
            Icon: AlertTriangle,
            iconColor: 'bg-rose-100 text-rose-600',
            severity: 1,
            link: '/admin-inventory',
            rawTimestamp: item.updated_at || item.created_at || item.updatedAt || item.createdAt,
          });
        }
        // About to expire (<= 30 days)
        else if (expDate <= thirtyDaysOutStr) {
          const diffTime = itemExpDay.getTime() - today.getTime();
          const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          list.push({
            id: `${item.id}_expiring_${expDate}`,
            title: `Expiring Soon: ${itemName}`,
            message: `Batch ${item.batch_number || item.batchNumber || 'N/A'} expires in ${diffDays} day${diffDays === 1 ? '' : 's'} (${expDate}).`,
            dateInfo: `Expires in ${diffDays} days`,
            Icon,
            iconColor: 'bg-amber-100 text-amber-600',
            severity: 2,
            link: '/admin-inventory',
            rawTimestamp: item.updated_at || item.created_at || item.updatedAt || item.createdAt,
          });
        }
      }
    }

    return list.sort((a, b) => {
      const timeA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
      const timeB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [inventory, appointments, users, dbNotifications, currentUser]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => {
      if (n.isDbNotification) {
        return !n.isReadDb && !readIds.includes(n.id);
      }
      return !readIds.includes(n.id);
    }).length;
  }, [notifications, readIds]);

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(combined);

    const unreadDb = dbNotifications.filter(n => !n.is_read);
    if (unreadDb.length > 0) {
      Promise.all(unreadDb.map(n => api.entities.Notification.update(n.id, { is_read: true })))
        .then(() => queryClient.invalidateQueries({ queryKey: ['adminDbNotifications', currentUser?.email] }))
        .catch(() => {});
    }
  };

  const handleMarkAsRead = (id) => {
    if (!readIds.includes(id)) {
      saveReadIds([...readIds, id]);
    }
  };

  const handleNotificationClick = (n) => {
    handleMarkAsRead(n.id);
    if (n.isDbNotification && !n.isReadDb) {
      api.entities.Notification.update(n.id, { is_read: true })
        .then(() => queryClient.invalidateQueries({ queryKey: ['adminDbNotifications', currentUser?.email] }))
        .catch(() => {});
    }
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        type="button"
        className="relative p-2 rounded-xl hover:bg-violet-100/60 text-violet-700 transition-colors cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        title="Admin Notifications"
      >
        <Bell className="w-5 h-5" />
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
                  <Bell className="w-4 h-4 text-violet-600" />
                  <h4 className="font-semibold text-gray-900">Admin Notifications</h4>
                  {unreadCount > 0 && (
                    <Badge className="bg-violet-600 text-white text-xs px-1.5 py-0.5">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 text-violet-600 hover:text-violet-700"
                      onClick={handleMarkAllRead}
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
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Bell className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm font-semibold text-gray-700">All caught up!</p>
                    <p className="text-xs text-gray-400 mt-1">No active notifications or alerts</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((n) => {
                      const isUnread = n.isDbNotification
                        ? (!n.isReadDb && !readIds.includes(n.id))
                        : !readIds.includes(n.id);
                      const IconComponent = n.Icon;

                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group flex items-start gap-3 relative",
                            isUnread && "bg-violet-50/50"
                          )}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className={cn("p-2 rounded-xl flex-shrink-0 mt-0.5", n.iconColor || 'bg-gray-100 text-gray-500')}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm leading-snug",
                                  isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                                )}
                              >
                                {n.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[11px] text-gray-400 font-medium">
                                {n.dateInfo}
                              </span>
                              <span className="text-[11px] text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium inline-flex items-center gap-0.5">
                                View Inventory <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-violet-600" />
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
