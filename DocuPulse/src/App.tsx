export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-blue-400 mb-2">DocuPulse</h1>
        <p className="text-slate-400 mb-6">Phygital Document Tracking System workspace is ready.</p>
        <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-medium rounded-lg transition-colors">
          Get Started
        </button>
      </div>
    </div>
  );
}