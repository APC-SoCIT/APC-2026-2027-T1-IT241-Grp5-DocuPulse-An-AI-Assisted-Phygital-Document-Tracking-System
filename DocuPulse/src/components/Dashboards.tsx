import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Truck, Receipt, MonitorCheck, BookOpen, LogOut, FileText, CheckCircle, Clock, Shield, Plus, X, Loader2, RefreshCw, Bell, Trash2, Eye, QrCode, History, Search, Download } from 'lucide-react';

interface DashboardProps {
  user: any;
  onSignOut: () => void;
}

export function RequestorDashboard({ user, onSignOut }: DashboardProps) {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReqForPass, setSelectedReqForPass] = useState<any | null>(null);
  const [selectedReqForHistory, setSelectedReqForHistory] = useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [documentType, setDocumentType] = useState('Requisition Form');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [reqType, setReqType] = useState<'PAYMENT' | 'PURCHASE'>('PURCHASE');
  const [reqItems, setReqItems] = useState([{ qty: 1, particulars: '', unitCost: 0 }]);

  const [foodMeals, setFoodMeals] = useState<string[]>([]);
  const [foodSnacks, setFoodSnacks] = useState<string[]>([]);
  const [foodBeverages, setFoodBeverages] = useState<string[]>([]);
  const [foodDateNeeded, setFoodDateNeeded] = useState('');
  const [foodTimeFrom, setFoodTimeFrom] = useState('');
  const [foodTimeTo, setFoodTimeTo] = useState('');
  const [foodVenue, setFoodVenue] = useState('');
  const [foodParticipantsInternal, setFoodParticipantsInternal] = useState(0);
  const [foodParticipantsExternal, setFoodParticipantsExternal] = useState(0);

  const [tripDateNeeded, setTripDateNeeded] = useState('');
  const [tripCallTime, setTripCallTime] = useState('');
  const [tripTimeStart, setTripTimeStart] = useState('');
  const [tripTimeEnd, setTripTimeEnd] = useState('');
  const [tripPassengers, setTripPassengers] = useState(1);
  const [tripPassengerNames, setTripPassengerNames] = useState('');
  const [tripFrom, setTripFrom] = useState('');
  const [tripTo, setTripTo] = useState('');

  const [libraryItems, setLibraryItems] = useState([{ titleAuthor: '', classification: 'REF', qty: 1, unitCost: 0 }]);

  const [gatePassCheckType, setGatePassCheckType] = useState<'Check In' | 'Check Out'>('Check Out');
  const [gatePassItems, setGatePassItems] = useState([{ qty: 1, item: '', color: '', brand: '', serialNo: '', remarks: '' }]);
  const [gatePassDestination, setGatePassDestination] = useState('');

  const fetchRequisitions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('document_requisitions')
      .select('*')
      .eq('requestor_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setRequisitions(data);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchRequisitions();
    fetchNotifications();

    const channel = supabase
      .channel('requestor-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_requisitions', filter: `requestor_id=eq.${user.id}` },
        () => {
          fetchRequisitions();
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleOpenHistory = async (item: any) => {
    setSelectedReqForHistory(item);
    setLoadingHistory(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('requisition_id', item.id)
      .order('created_at', { ascending: true });

    if (data) setHistoryLogs(data);
    setLoadingHistory(false);
  };

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const trackingNo = `DP-${Math.floor(100000 + Math.random() * 900000)}`;
    const userDept = user?.user_metadata?.department || 'School of Information Technology (SoCIT)';

    let formDataPayload: any = {};

    if (documentType === 'Requisition Form') {
      formDataPayload = { reqType, reqItems };
    } else if (documentType === 'Food Allowance Request Form') {
      formDataPayload = { foodMeals, foodSnacks, foodBeverages, foodDateNeeded, foodTimeFrom, foodTimeTo, foodVenue, foodParticipantsInternal, foodParticipantsExternal };
    } else if (documentType === 'Vehicle Trip Ticket') {
      formDataPayload = { tripDateNeeded, tripCallTime, tripTimeStart, tripTimeEnd, tripPassengers, tripPassengerNames, tripFrom, tripTo };
    } else if (documentType === 'Library Purchase Requisition form') {
      formDataPayload = { libraryItems };
    } else if (documentType === 'Equipment Gate Pass') {
      formDataPayload = { gatePassCheckType, gatePassItems, gatePassDestination };
    }

    const { data: inserted, error } = await supabase
      .from('document_requisitions')
      .insert([
        {
          requestor_id: user.id,
          document_type: documentType,
          department: userDept,
          tracking_number: trackingNo,
          status: 'Pending Review',
          remarks: remarks.trim() || null,
          processing_remarks: [formDataPayload]
        }
      ])
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
    } else {
      await supabase.from('audit_logs').insert([
        {
          requisition_id: inserted.id,
          performed_by: user.id,
          action: 'Requisition Submitted',
          location: userDept
        }
      ]);

      setIsModalOpen(false);
      setRemarks('');
      fetchRequisitions();
      fetchNotifications();
    }
    setSubmitting(false);
  };

  const activeCount = requisitions.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
  const completedCount = requisitions.filter(r => r.status === 'Completed').length;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardLayout title="Requestor Portal" role="Requestor" badgeColor="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" icon={<User className="w-5 h-5 text-indigo-400" />} user={user} onSignOut={onSignOut}>
      
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mr-4">
          <StatCard label="Active Requisitions" value={activeCount.toString()} icon={<Clock className="w-4 h-4 text-amber-400" />} />
          <StatCard label="Approved Documents" value={completedCount.toString()} icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
          <StatCard label="Department" value={user?.user_metadata?.department || 'N/A'} icon={<FileText className="w-4 h-4 text-indigo-400" />} />
        </div>

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
      </div>

      {showNotifications && (
        <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" /> Notifications
          </h4>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500">No notifications yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <p className="font-semibold text-slate-200">{n.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">Submit New Document Requisition</h3>
            <p className="text-xs text-slate-400">Select required academic or administrative forms to initialize phygital tracking.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-4">Your Requisitions Queue</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Fetching requisitions...
          </div>
        ) : requisitions.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No requisitions submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 px-2">Tracking No.</th>
                  <th className="pb-3 px-2">Form Type</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Date Submitted</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {requisitions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-2 font-mono text-indigo-400 font-semibold">{item.tracking_number}</td>
                    <td className="py-3 px-2 text-slate-200">{item.document_type}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReqForPass(item)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pass
                        </button>
                        <button
                          onClick={() => handleOpenHistory(item)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <History className="w-3.5 h-3.5" /> Timeline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReqForPass && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setSelectedReqForPass(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white mb-1">Phygital Gate Pass</h3>
            <p className="text-[11px] text-slate-400 mb-4">{selectedReqForPass.document_type}</p>
            
            <div className="p-4 bg-white rounded-2xl inline-block mb-3 border-4 border-indigo-500/30">
              <div className="w-36 h-36 border-2 border-dashed border-slate-900 flex flex-col items-center justify-center font-mono text-[10px] text-slate-900 gap-1">
                <QrCode className="w-20 h-20 text-slate-900" />
                <span className="font-bold">{selectedReqForPass.tracking_number}</span>
              </div>
            </div>

            <p className="font-mono text-indigo-400 font-bold text-sm tracking-wider mb-2">{selectedReqForPass.tracking_number}</p>
            <p className="text-[10px] text-slate-400">Scan at Logistics dispatch lockers or campus guard stations for physical handoff.</p>
          </div>
        </div>
      )}

      {selectedReqForHistory && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setSelectedReqForHistory(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white mb-1">Chain of Custody Timeline</h3>
            <p className="font-mono text-xs text-indigo-400 font-semibold mb-4">{selectedReqForHistory.tracking_number}</p>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Loading audit history...
              </div>
            ) : historyLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No history logs recorded yet.</p>
            ) : (
              <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {historyLogs.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[18px] top-1.5 ring-4 ring-slate-900" />
                    <p className="font-semibold text-slate-200">{log.action}</p>
                    <p className="text-[10px] text-slate-400">{log.location} • {new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Asia Pacific College Requisition Form</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitRequisition} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Form Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="Requisition Form">Requisition Form (Payment / Purchase)</option>
                  <option value="Food Allowance Request Form">Food Allowance Request Form</option>
                  <option value="Vehicle Trip Ticket">Vehicle Trip Ticket</option>
                  <option value="Library Purchase Requisition form">Library Purchase Requisition form</option>
                  <option value="Equipment Gate Pass">Equipment Gate Pass</option>
                </select>
              </div>

              {documentType === 'Requisition Form' && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-medium text-slate-300">Type:</label>
                    <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="reqType" checked={reqType === 'PURCHASE'} onChange={() => setReqType('PURCHASE')} /> Purchase
                    </label>
                    <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="reqType" checked={reqType === 'PAYMENT'} onChange={() => setReqType('PAYMENT')} /> Payment
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Particulars / Items</label>
                    {reqItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...reqItems];
                            newItems[idx].qty = parseInt(e.target.value) || 1;
                            setReqItems(newItems);
                          }}
                          className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Particulars / Description"
                          value={item.particulars}
                          onChange={(e) => {
                            const newItems = [...reqItems];
                            newItems[idx].particulars = e.target.value;
                            setReqItems(newItems);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                        <input
                          type="number"
                          placeholder="Unit Cost (Php)"
                          value={item.unitCost}
                          onChange={(e) => {
                            const newItems = [...reqItems];
                            newItems[idx].unitCost = parseFloat(e.target.value) || 0;
                            setReqItems(newItems);
                          }}
                          className="w-28 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                        {reqItems.length > 1 && (
                          <button type="button" onClick={() => setReqItems(reqItems.filter((_, i) => i !== idx))} className="text-red-400 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setReqItems([...reqItems, { qty: 1, particulars: '', unitCost: 0 }])}
                      className="text-[11px] text-indigo-400 font-semibold hover:underline"
                    >
                      + Add Item Row
                    </button>
                  </div>
                </div>
              )}

              {documentType === 'Food Allowance Request Form' && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Meals Required</label>
                    <div className="flex gap-4 text-xs text-slate-300">
                      {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                        <label key={meal} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={foodMeals.includes(meal)} onChange={() => toggleArrayItem(foodMeals, setFoodMeals, meal)} /> {meal}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Snacks Required</label>
                    <div className="flex gap-4 text-xs text-slate-300">
                      {['AM Snack', 'PM Snack'].map(snack => (
                        <label key={snack} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={foodSnacks.includes(snack)} onChange={() => toggleArrayItem(foodSnacks, setFoodSnacks, snack)} /> {snack}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Beverages Required</label>
                    <div className="flex gap-4 text-xs text-slate-300">
                      {['Coffee', 'Water', 'Juice / Soda'].map(bev => (
                        <label key={bev} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={foodBeverages.includes(bev)} onChange={() => toggleArrayItem(foodBeverages, setFoodBeverages, bev)} /> {bev}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Date Needed</label>
                      <input type="date" value={foodDateNeeded} onChange={(e) => setFoodDateNeeded(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Venue</label>
                      <input type="text" placeholder="e.g., Auditorium" value={foodVenue} onChange={(e) => setFoodVenue(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Serving Time (From)</label>
                      <input type="time" value={foodTimeFrom} onChange={(e) => setFoodTimeFrom(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Serving Time (To)</label>
                      <input type="time" value={foodTimeTo} onChange={(e) => setFoodTimeTo(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Internal Participants</label>
                      <input type="number" min={0} value={foodParticipantsInternal} onChange={(e) => setFoodParticipantsInternal(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">External Participants</label>
                      <input type="number" min={0} value={foodParticipantsExternal} onChange={(e) => setFoodParticipantsExternal(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                  </div>
                </div>
              )}

              {documentType === 'Vehicle Trip Ticket' && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Date Needed</label>
                      <input type="date" value={tripDateNeeded} onChange={(e) => setTripDateNeeded(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Call Time</label>
                      <input type="time" value={tripCallTime} onChange={(e) => setTripCallTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Time Start</label>
                      <input type="time" value={tripTimeStart} onChange={(e) => setTripTimeStart(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Time End</label>
                      <input type="time" value={tripTimeEnd} onChange={(e) => setTripTimeEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Origin (From)</label>
                      <input type="text" placeholder="e.g., APC Campus" value={tripFrom} onChange={(e) => setTripFrom(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Destination (To)</label>
                      <input type="text" placeholder="e.g., SM Mall of Asia" value={tripTo} onChange={(e) => setTripTo(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">No. of Passengers</label>
                      <input type="number" min={1} value={tripPassengers} onChange={(e) => setTripPassengers(parseInt(e.target.value) || 1)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Names of Passenger(s)</label>
                      <input type="text" placeholder="Comma-separated passenger names" value={tripPassengerNames} onChange={(e) => setTripPassengerNames(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                    </div>
                  </div>
                </div>
              )}

              {documentType === 'Library Purchase Requisition form' && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <label className="block text-xs font-medium text-slate-300">Requested Book / Media Items</label>
                  {libraryItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Title / Author / Edition"
                        value={item.titleAuthor}
                        onChange={(e) => {
                          const newItems = [...libraryItems];
                          newItems[idx].titleAuthor = e.target.value;
                          setLibraryItems(newItems);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                      <select
                        value={item.classification}
                        onChange={(e) => {
                          const newItems = [...libraryItems];
                          newItems[idx].classification = e.target.value;
                          setLibraryItems(newItems);
                        }}
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="REF">REF</option>
                        <option value="RizLife">RizLife</option>
                        <option value="CIRC">CIRC</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={item.qty}
                        onChange={(e) => {
                          const newItems = [...libraryItems];
                          newItems[idx].qty = parseInt(e.target.value) || 1;
                          setLibraryItems(newItems);
                        }}
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                      {libraryItems.length > 1 && (
                        <button type="button" onClick={() => setLibraryItems(libraryItems.filter((_, i) => i !== idx))} className="text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLibraryItems([...libraryItems, { titleAuthor: '', classification: 'REF', qty: 1, unitCost: 0 }])}
                    className="text-[11px] text-indigo-400 font-semibold hover:underline"
                  >
                    + Add Book Row
                  </button>
                </div>
              )}

              {documentType === 'Equipment Gate Pass' && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-medium text-slate-300">Action:</label>
                    <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="gateCheck" checked={gatePassCheckType === 'Check Out'} onChange={() => setGatePassCheckType('Check Out')} /> Check Out
                    </label>
                    <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="gateCheck" checked={gatePassCheckType === 'Check In'} onChange={() => setGatePassCheckType('Check In')} /> Check In
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Destination & Duration</label>
                    <input type="text" placeholder="e.g., Off-campus production, 3 days" value={gatePassDestination} onChange={(e) => setGatePassDestination(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white" />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Itemized Equipment List</label>
                    {gatePassItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...gatePassItems];
                            newItems[idx].qty = parseInt(e.target.value) || 1;
                            setGatePassItems(newItems);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Item(s)"
                          value={item.item}
                          onChange={(e) => {
                            const newItems = [...gatePassItems];
                            newItems[idx].item = e.target.value;
                            setGatePassItems(newItems);
                          }}
                          className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Brand / Color"
                          value={item.brand}
                          onChange={(e) => {
                            const newItems = [...gatePassItems];
                            newItems[idx].brand = e.target.value;
                            setGatePassItems(newItems);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Serial No."
                          value={item.serialNo}
                          onChange={(e) => {
                            const newItems = [...gatePassItems];
                            newItems[idx].serialNo = e.target.value;
                            setGatePassItems(newItems);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                        {gatePassItems.length > 1 && (
                          <button type="button" onClick={() => setGatePassItems(gatePassItems.filter((_, i) => i !== idx))} className="text-red-400 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setGatePassItems([...gatePassItems, { qty: 1, item: '', color: '', brand: '', serialNo: '', remarks: '' }])}
                      className="text-[11px] text-indigo-400 font-semibold hover:underline"
                    >
                      + Add Equipment Row
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purpose / Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="State purpose of request or special instructions"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StaffQueueTable({ staffUser, roleName, actionLabels }: { staffUser: any; roleName: string; actionLabels: { primary: string; secondary: string; primaryStatus: string; secondaryStatus: string } }) {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [inspectingReq, setInspectingReq] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('document_requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setRequisitions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel(`staff-${roleName.toLowerCase().replace(/\s+/g, '-')}-realtime`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'document_requisitions' },
        (payload) => {
          setRequisitions(prev => [payload.new, ...prev]);
          setToastMessage(`New entry received: ${payload.new.tracking_number}`);
          setTimeout(() => setToastMessage(null), 4000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'document_requisitions' },
        (payload) => {
          setRequisitions(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roleName]);

  const updateStatus = async (item: any, newStatus: string, actionLabel: string) => {
    setProcessingId(item.id);

    const { error: updateErr } = await supabase
      .from('document_requisitions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (!updateErr) {
      await supabase.from('audit_logs').insert([
        {
          requisition_id: item.id,
          performed_by: staffUser.id,
          action: `${roleName}: ${actionLabel}`,
          location: staffUser?.user_metadata?.department || roleName
        }
      ]);

      await supabase.from('notifications').insert([
        {
          requisition_id: item.id,
          user_id: item.requestor_id,
          title: `Status Update: ${item.tracking_number}`,
          message: `Your requisition for ${item.document_type} was updated to "${newStatus}" by ${roleName}.`,
          new_stage: newStatus,
          type: 'status_update'
        }
      ]);

      fetchQueue();
    }
    setProcessingId(null);
  };

  const exportToCSV = () => {
    if (filteredRequisitions.length === 0) return;

    const headers = ["Tracking Number", "Department", "Document Type", "Status", "Date Submitted"];
    const rows = filteredRequisitions.map(r => [
      r.tracking_number,
      `"${r.department}"`,
      `"${r.document_type}"`,
      r.status,
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${roleName.toLowerCase().replace(/\s+/g, '_')}_queue.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequisitions = requisitions.filter(item => {
    const matchesSearch = 
      item.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.document_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
      {toastMessage && (
        <div className="absolute -top-12 right-0 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl border border-indigo-400 flex items-center gap-2 animate-bounce">
          <Bell className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-slate-200">{roleName} Review Queue</h3>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tracking # or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition w-48"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="In Transit">In Transit</option>
            <option value="Payment Cleared">Payment Cleared</option>
            <option value="Library Cleared">Library Cleared</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button onClick={exportToCSV} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          <button onClick={fetchQueue} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Fetching pending requisitions...
        </div>
      ) : filteredRequisitions.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">No requisitions matched your search filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 px-2">Tracking No.</th>
                <th className="pb-3 px-2">Department</th>
                <th className="pb-3 px-2">Document</th>
                <th className="pb-3 px-2">Current Status</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRequisitions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-2 font-mono text-cyan-400 font-semibold">{item.tracking_number}</td>
                  <td className="py-3 px-2 text-slate-300">{item.department}</td>
                  <td className="py-3 px-2 text-slate-200">{item.document_type}</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setInspectingReq(item)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                      <button
                        onClick={() => updateStatus(item, actionLabels.secondaryStatus, actionLabels.secondary)}
                        disabled={processingId === item.id}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[11px] font-semibold transition"
                      >
                        {actionLabels.secondary}
                      </button>
                      <button
                        onClick={() => updateStatus(item, actionLabels.primaryStatus, actionLabels.primary)}
                        disabled={processingId === item.id}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition shadow-md shadow-emerald-600/20"
                      >
                        {actionLabels.primary}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inspectingReq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setInspectingReq(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white mb-0.5">{inspectingReq.document_type}</h3>
            <p className="font-mono text-xs text-cyan-400 font-semibold mb-4">{inspectingReq.tracking_number}</p>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-3 mb-4">
              <p className="text-slate-400"><strong className="text-slate-200">Department:</strong> {inspectingReq.department}</p>
              <p className="text-slate-400"><strong className="text-slate-200">Date Filed:</strong> {new Date(inspectingReq.created_at).toLocaleString()}</p>
              <p className="text-slate-400"><strong className="text-slate-200">Remarks:</strong> {inspectingReq.remarks || 'None'}</p>

              <div className="pt-2 border-t border-slate-800">
                <p className="font-bold text-slate-200 mb-2">Form Data Payload:</p>
                <pre className="p-3 bg-slate-900 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(inspectingReq.processing_remarks?.[0] || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectingReq(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LogisticsDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="Logistics & Dispatch" role="Logistics Officer" badgeColor="bg-cyan-500/20 text-cyan-400 border-cyan-500/30" icon={<Truck className="w-5 h-5 text-cyan-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Deliveries" value="8" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Dispatched Today" value="24" icon={<CheckCircle className="w-4 h-4 text-cyan-400" />} />
        <StatCard label="Active Smart Lockers" value="100%" icon={<Shield className="w-4 h-4 text-emerald-400" />} />
      </div>
      <StaffQueueTable
        staffUser={user}
        roleName="Logistics Dispatch"
        actionLabels={{
          primary: 'Dispatch Package',
          secondary: 'Mark Delivery Hold',
          primaryStatus: 'In Transit',
          secondaryStatus: 'Logistics Hold'
        }}
      />
    </DashboardLayout>
  );
}

export function FinanceDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="Finance & Treasury" role="Finance Officer" badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" icon={<Receipt className="w-5 h-5 text-emerald-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Payments" value="5" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Verified Today" value="41" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Account Balance Holds" value="2" icon={<Shield className="w-4 h-4 text-red-400" />} />
      </div>
      <StaffQueueTable
        staffUser={user}
        roleName="Finance Clearance"
        actionLabels={{
          primary: 'Clear Payment',
          secondary: 'Apply Balance Hold',
          primaryStatus: 'Payment Cleared',
          secondaryStatus: 'Finance Hold'
        }}
      />
    </DashboardLayout>
  );
}

export function ItroDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="IT Resource Office (ITRO)" role="ITRO Staff" badgeColor="bg-blue-500/20 text-blue-400 border-blue-500/30" icon={<MonitorCheck className="w-5 h-5 text-blue-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active System Users" value="1,240" icon={<User className="w-4 h-4 text-blue-400" />} />
        <StatCard label="IoT Nodes Online" value="16/16" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Security Logs" value="Normal" icon={<Shield className="w-4 h-4 text-emerald-400" />} />
      </div>
      <StaffQueueTable
        staffUser={user}
        roleName="System Operations"
        actionLabels={{
          primary: 'Approve System Release',
          secondary: 'Flag Exception',
          primaryStatus: 'Completed',
          secondaryStatus: 'Rejected'
        }}
      />
    </DashboardLayout>
  );
}

export function LibraryDashboard({ user, onSignOut }: DashboardProps) {
  return (
    <DashboardLayout title="Library & Media Center" role="Librarian" badgeColor="bg-amber-500/20 text-amber-400 border-amber-500/30" icon={<BookOpen className="w-5 h-5 text-amber-400" />} user={user} onSignOut={onSignOut}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Book Holds" value="4" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Cleared Requisitions" value="18" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Unreturned Items" value="1" icon={<Shield className="w-4 h-4 text-red-400" />} />
      </div>
      <StaffQueueTable
        staffUser={user}
        roleName="Library Resource Clearance"
        actionLabels={{
          primary: 'Grant Clearance',
          secondary: 'Unreturned Resource Hold',
          primaryStatus: 'Library Cleared',
          secondaryStatus: 'Library Hold'
        }}
      />
    </DashboardLayout>
  );
}

function DashboardLayout({ title, role, badgeColor, icon, user, onSignOut, children }: any) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">{title}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white mt-0.5">{value}</p>
      </div>
      <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">{icon}</div>
    </div>
  );
}