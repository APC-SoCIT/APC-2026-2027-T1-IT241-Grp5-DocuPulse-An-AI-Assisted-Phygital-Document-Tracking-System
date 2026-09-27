import { useState } from 'react';
import { 
  Bell, Check, CheckCircle2, Clock, Truck, AlertCircle, 
  Trash2, Info
} from 'lucide-react';

interface NotificationItem {
  id: string;
  requisitionId: string;
  title: string;
  previousStage: string;
  newStage: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'stage_change' | 'approval' | 'logistics' | 'alert';
}

export default function NotificationsFeed() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'NOTIF-101',
      requisitionId: 'REQ-2026-001',
      title: 'Equipment Procurement Request - IT Lab',
      previousStage: 'Submitted',
      newStage: 'In Logistics',
      message: 'Your requisition has passed Department Head approval and was transferred to Logistics for processing.',
      timestamp: '10 minutes ago',
      isRead: false,
      type: 'stage_change'
    },
    {
      id: 'NOTIF-102',
      requisitionId: 'REQ-2026-003',
      title: 'Formal Apparel & Driver Gloves for Ceremony',
      previousStage: 'In Logistics',
      newStage: 'Procurement Active',
      message: 'Logistics Officer issued purchase order #PO-8821 to vendor. Items are currently in transit.',
      timestamp: '2 hours ago',
      isRead: false,
      type: 'logistics'
    },
    {
      id: 'NOTIF-103',
      requisitionId: 'REQ-2026-004',
      title: 'Office Stationery & Printer Cartridge Refills',
      previousStage: 'Procurement Active',
      newStage: 'Completed',
      message: 'Requisition fulfilled! Items delivered to Finance & Accounting office.',
      timestamp: '1 day ago',
      isRead: true,
      type: 'approval'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const simulateStatusChange = () => {
    const randomReqNum = Math.floor(100 + Math.random() * 900);
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now().toString().slice(-3)}`,
      requisitionId: `REQ-2026-${randomReqNum}`,
      title: 'Clearance Form Verification Set',
      previousStage: 'Dept Head Review',
      newStage: 'In Logistics',
      message: 'Workflow status updated automatically: Approved by Department Head.',
      timestamp: 'Just now',
      isRead: false,
      type: 'stage_change'
    };
    setNotifications([newNotif, ...notifications]);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" /> Requestor Communication Hub
          </div>
          <h1 className="text-2xl font-bold text-white">DP-21: Requisition Progress Notifications</h1>
          <p className="text-xs text-slate-400">Receive real-time automated updates on every workflow stage change for your requisitions.</p>
        </div>

        <button
          onClick={simulateStatusChange}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition"
        >
          <Bell className="w-3.5 h-3.5" /> Simulate Stage Change Event
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Notification Feed</h2>
            <p className="text-xs text-slate-400">
              {unreadCount > 0 ? `You have ${unreadCount} unread status updates.` : 'All notifications are read.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No notifications found</p>
            <p className="text-xs text-slate-500 mt-1">Status changes will automatically appear here as your requests progress.</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition relative flex items-start justify-between gap-4 ${
                !item.isRead 
                  ? 'bg-indigo-600/5 border-indigo-500/30' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  item.type === 'stage_change' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  item.type === 'approval' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  item.type === 'logistics' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {item.type === 'stage_change' && <Clock className="w-4 h-4" />}
                  {item.type === 'approval' && <CheckCircle2 className="w-4 h-4" />}
                  {item.type === 'logistics' && <Truck className="w-4 h-4" />}
                  {item.type === 'alert' && <AlertCircle className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-indigo-400 font-semibold">{item.requisitionId}</span>
                    <h3 className="text-xs font-semibold text-white">{item.title}</h3>
                    {!item.isRead && (
                      <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] font-bold rounded-full">NEW</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 mb-1 text-[11px]">
                    <span className="text-slate-500">Stage Transition:</span>
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-400 font-mono">
                      {item.previousStage}
                    </span>
                    <span className="text-indigo-400">→</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-semibold">
                      {item.newStage}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{item.message}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.timestamp}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.isRead && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => clearNotification(item.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title="Delete Notification"
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