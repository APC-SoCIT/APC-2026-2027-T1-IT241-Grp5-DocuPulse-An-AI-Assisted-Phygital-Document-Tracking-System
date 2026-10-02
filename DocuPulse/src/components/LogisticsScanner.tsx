import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QrCode, ScanLine, CheckCircle2, MapPin, ArrowRight } from 'lucide-react';

interface RequisitionScanItem {
  id: string;
  title: string;
  department: string;
  current_location?: string;
  status: string;
  updated_at?: string;
}

export default function LogisticsScanner() {
  const [requisitions, setRequisitions] = useState<RequisitionScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<RequisitionScanItem | null>(null);
  const [newLocation, setNewLocation] = useState('Logistics Sorting Hub');
  const [scanSuccess, setScanSuccess] = useState('');

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequisitions(data);
    }
    setLoading(false);
  };

  const handleScanUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('requisitions')
      .update({ 
        current_location: newLocation,
        updated_at: timestamp
      })
      .eq('id', selectedReq.id);

    if (!error) {
      setScanSuccess(`QR Scan Successful: ${selectedReq.id} updated to location "${newLocation}" at ${new Date(timestamp).toLocaleTimeString()}`);
      setSelectedReq(null);
      fetchRequisitions();
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-100 p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <QrCode className="w-3.5 h-3.5" /> Phygital QR Scanner (DP-07)[cite: 9]
        </div>
        <h1 className="text-2xl font-bold text-white">Logistics QR Code Tracking</h1>
        <p className="text-xs text-slate-400">Scan QR codes to synchronize physical documents with digital records in real-time[cite: 9].</p>
      </div>

      {scanSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{scanSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-indigo-400" /> Active Requisitions for QR Scanning
          </h2>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading requisitions...</div>
          ) : requisitions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No requisitions available for scanning.</div>
          ) : (
            <div className="space-y-3">
              {requisitions.map((req) => (
                <div key={req.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-indigo-500/50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">{req.id}</span>
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">{req.department}</span>
                    </div>
                    <p className="text-white text-xs font-medium mt-1">{req.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> Current Location: <span className="text-slate-200">{req.current_location || 'Intake Counter'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReq(req)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-400" /> QR Code Preview & Generator
          </h2>
          {selectedReq ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                <div className="w-36 h-36 bg-slate-900 rounded-xl flex items-center justify-center p-2 text-white font-mono text-[10px] text-center border-4 border-indigo-600">
                  [QR CODE DATA]<br />{selectedReq.id}<br />{selectedReq.title}
                </div>
                <span className="text-[11px] font-mono text-slate-700 mt-2 font-bold">{selectedReq.id}</span>
              </div>

              <form onSubmit={handleScanUpdate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Update Phygital Location</label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Logistics Sorting Hub">Logistics Sorting Hub</option>
                    <option value="Department Head Office">Department Head Office</option>
                    <option value="Finance Processing Center">Finance Processing Center</option>
                    <option value="Archival Storage Facility">Archival Storage Facility</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  Confirm QR Scan & Timestamp[cite: 9] <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              <ScanLine className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              Select a requisition to generate its QR code and simulate scanning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}