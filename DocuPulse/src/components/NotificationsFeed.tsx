import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Bell, Check, Clock, Trash2, Info
} from 'lucide-react';

interface NotificationItem {
  id: string;
  requisition_id: string;
  title: string;
  previous_stage: string;
  new_stage: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: 'stage_change' | 'approval' | 'logistics' | 'alert';
}

export default function NotificationsFeed() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const clearNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" /> Communications Center
          </div>
          <h1 className="text-2xl font-bold text-white">DP-21: Live Supabase Notifications</h1>
          <p className="text-xs text-slate-400">Automated alerts retrieved from Supabase postgres tables.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Notification Feed</h2>
            <p className="text-xs text-slate-400">
              {unreadCount > 0 ? `You have ${unreadCount} unread status updates.` : 'All notifications are read.'}
            </p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'unread' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No notifications found</p>
            <p className="text-xs text-slate-500 mt-1">Requisition updates will be logged here automatically.</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition relative flex items-start justify-between gap-4 ${
                !item.is_read 
                  ? 'bg-indigo-600/5 border-indigo-500/30' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Clock className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-indigo-400 font-semibold">{item.requisition_id}</span>
                    <h3 className="text-xs font-semibold text-white">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 mt-1 mb-1 text-[11px]">
                    <span className="text-slate-500">Stage:</span>
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-400 font-mono">
                      {item.previous_stage}
                    </span>
                    <span className="text-indigo-400">→</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-semibold">
                      {item.new_stage}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{item.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.is_read && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => clearNotification(item.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}