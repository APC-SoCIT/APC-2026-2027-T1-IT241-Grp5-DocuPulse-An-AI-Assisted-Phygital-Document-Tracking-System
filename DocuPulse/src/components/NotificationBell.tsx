import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleClearAll = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" /> Notifications
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] text-indigo-400 hover:underline font-semibold"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No notifications yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`p-2.5 border rounded-xl text-xs transition cursor-pointer ${
                    n.is_read
                      ? 'bg-slate-950/50 border-slate-800/60 opacity-60'
                      : 'bg-slate-950 border-indigo-500/30 hover:border-indigo-500/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-200">{n.title}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}