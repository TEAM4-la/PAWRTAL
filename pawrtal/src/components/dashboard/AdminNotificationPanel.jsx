import React, { useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Bell, X, CheckCheck, Syringe, Pill, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'pawrtal_admin_read_notifications';

export default function AdminNotificationPanel({ alignPopover = 'right' }) {
  const [open, setOpen] = useState(false);

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

  // Fetch all clinical inventory items (vaccines and medications)
  const { data: inventory = [] } = useQuery({
    queryKey: ['adminInventoryNotifications'],
    queryFn: () => api.entities.InventoryItem.list('-created_date', 500),
    refetchInterval: 15000,
  });

  // Calculate notifications strictly for:
  // 1. Out of stock
  // 2. Low in stock (quantity <= min_stock_level)
  // 3. Expired
  // 4. About to expire (<= 30 days)
  const notifications = useMemo(() => {
    const list = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysOutStr = thirtyDaysOut.toISOString().split('T')[0];

    const activeItems = Array.isArray(inventory)
      ? inventory.filter((item) => !item.is_deleted && !item.isDeleted)
      : [];

    for (const item of activeItems) {
      const minLevel = Number(item.min_stock_level ?? item.minStockLevel ?? 5);
      const qty = Number(item.quantity ?? 0);
      const expDate = item.expiration_date || item.expirationDate || null;
      const itemName = item.name || 'Clinical Item';
      const itemType = (item.item_type || item.itemType || '').toLowerCase();
      const isVaccine = itemType.includes('vaccine');
      const Icon = isVaccine ? Syringe : Pill;
      const iconColor = isVaccine ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600';

      // 1. Out of stock alert
      if (qty <= 0) {
        const id = `${item.id}_out_of_stock`;
        list.push({
          id,
          title: `Out of Stock: ${itemName}`,
          message: `${item.item_type || 'Supply'} is currently out of stock (0 ${item.unit || 'units'}). Restock required.`,
          dateInfo: 'Out of stock',
          Icon: AlertOctagon,
          iconColor: 'bg-red-100 text-red-600',
          severity: 1,
        });
      }
      // 2. Low in stock alert
      else if (qty <= minLevel) {
        const id = `${item.id}_low_stock_${qty}`;
        list.push({
          id,
          title: `Low Stock: ${itemName}`,
          message: `Only ${qty} ${item.unit || 'units'} left in stock. Minimum threshold is ${minLevel}.`,
          dateInfo: `Low stock · ${qty} remaining`,
          Icon,
          iconColor,
          severity: 2,
        });
      }

      // 3. Expiration checks
      if (expDate) {
        const itemExpDate = new Date(expDate);
        const itemExpDay = new Date(itemExpDate.getFullYear(), itemExpDate.getMonth(), itemExpDate.getDate());

        // Expired
        if (expDate < todayStr) {
          const id = `${item.id}_expired_${expDate}`;
          list.push({
            id,
            title: `Expired: ${itemName}`,
            message: `Batch ${item.batch_number || item.batchNumber || 'N/A'} expired on ${expDate}. Dispose of properly.`,
            dateInfo: `Expired on ${expDate}`,
            Icon: AlertTriangle,
            iconColor: 'bg-rose-100 text-rose-600',
            severity: 1,
          });
        }
        // About to expire (<= 30 days)
        else if (expDate <= thirtyDaysOutStr) {
          const diffTime = itemExpDay.getTime() - today.getTime();
          const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          const id = `${item.id}_expiring_${expDate}`;
          list.push({
            id,
            title: `Expiring Soon: ${itemName}`,
            message: `Batch ${item.batch_number || item.batchNumber || 'N/A'} expires in ${diffDays} day${diffDays === 1 ? '' : 's'} (${expDate}).`,
            dateInfo: `Expires in ${diffDays} days`,
            Icon,
            iconColor: 'bg-amber-100 text-amber-600',
            severity: 2,
          });
        }
      }
    }

    return list.sort((a, b) => a.severity - b.severity);
  }, [inventory]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(combined);
  };

  const handleMarkAsRead = (id) => {
    if (!readIds.includes(id)) {
      saveReadIds([...readIds, id]);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        type="button"
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-violet-700" />
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
              <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-violet-600" />
                  <h4 className="font-semibold text-gray-900">Notification</h4>
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
                    className="h-7 w-7"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[60vh] sm:h-[500px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Bell className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((n) => {
                      const isUnread = !readIds.includes(n.id);
                      const IconComponent = n.Icon;
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group",
                            isUnread && "bg-violet-50/60"
                          )}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <div className="flex gap-3 items-start">
                            <div className={cn("p-2 rounded-xl flex-shrink-0", n.iconColor || 'bg-gray-100 text-gray-500')}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm leading-snug",
                                  isUnread ? "font-semibold text-gray-900" : "text-gray-700"
                                )}
                              >
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1.5">
                                {n.dateInfo}
                              </p>
                            </div>
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-violet-600" />
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
