import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, BookOpen, Coins, Gift, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

const typeIcons = {
  quiz_complete: <BookOpen className="w-5 h-5 text-primary" />,
  coins_earned: <Coins className="w-5 h-5 text-amber-500" />,
  reward_requested: <Gift className="w-5 h-5 text-purple-500" />,
  reward_approved: <Check className="w-5 h-5 text-emerald-500" />,
  reward_rejected: <X className="w-5 h-5 text-red-500" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const notifs = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 50);
      setNotifications(notifs);
      // Mark all as read
      const unread = notifs.filter(n => !n.read);
      for (const n of unread) {
        base44.entities.Notification.update(n.id, { read: true });
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Notifications 🔔</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                n.read ? "bg-white border-border/50" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {typeIcons[n.type] || <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{moment(n.created_date).fromNow()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}