export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-400">DocuPulse</h1>
            <p className="text-sm text-slate-400">AI-Assisted Phygital Document Tracking System</p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
            System Online
          </span>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition">
            <h2 className="font-semibold text-slate-200 mb-1">Track Physical Document</h2>
            <p className="text-xs text-slate-400">Scan QR codes or enter tracking IDs for physical files.</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition">
            <h2 className="font-semibold text-slate-200 mb-1">Digital Repository</h2>
            <p className="text-xs text-slate-400">Access synced digital records and AI analysis.</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
          Scan / Upload Document
        </button>
      </div>
    </div>
  );
}