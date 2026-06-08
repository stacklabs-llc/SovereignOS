import { useState, useEffect } from 'react';
import { Eye, Download, Activity, FileText, X } from 'lucide-react';

interface Coa {
  sys_id: string;
  batch_number: string;
  lab_name: string;
  sample_date: string;
  result_date: string;
  status: string;
  thc_pct: number | null;
  cbd_pct: number | null;
  total_cannabinoids: number | null;
  pesticides: string;
  residual_solvents: string;
  heavy_metals: string;
  microbials: string;
  coa_file_url: string | null;
  notes: string;
}

export default function LabResults() {
  const [coas, setCoas] = useState<Coa[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCoaUrl, setActiveCoaUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wildseed/coas')
      .then((res) => res.json())
      .then((data) => {
        setCoas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching COAs:', err);
        setLoading(false);
      });
  }, []);

  const getPassFailClass = (val: string) => {
    switch (val) {
      case 'PASS':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      case 'FAIL':
        return 'text-rose-400 border-rose-500/20 bg-rose-500/10 animate-pulse';
      case 'PENDING':
        return 'text-sky-400 border-sky-500/20 bg-sky-500/10';
      default:
        return 'text-slate-500 border-white/5 bg-white/5';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
      case 'FAIL':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default:
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-white">
        <Activity className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Loading COA Registers...</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20 text-white relative">
      <header className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black tracking-widest uppercase">Lab Results & COAs</h2>
        <p className="text-slate-400 font-light tracking-widest text-xs uppercase mt-1">DCC DCC-compliant Certificate of Analysis Verification Console</p>
      </header>

      <div className="clinical-card bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              <tr>
                <th className="font-normal px-4 pb-2">Batch #</th>
                <th className="font-normal px-4 pb-2">Lab Facility</th>
                <th className="font-normal px-4 pb-2">Sample Date</th>
                <th className="font-normal px-4 pb-2">Release Date</th>
                <th className="font-normal px-4 pb-2">Status</th>
                <th className="font-normal px-4 pb-2">THC %</th>
                <th className="font-normal px-4 pb-2">CBD %</th>
                <th className="font-normal px-4 pb-2">Total Cann.</th>
                <th className="font-normal px-4 pb-2">Panel Verification</th>
                <th className="font-normal px-4 pb-2 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {coas.map((coa) => (
                <tr key={coa.sys_id} className="bg-white/5 group hover:bg-white/10 border border-white/5 transition-all">
                  <td className="px-4 py-3.5 rounded-l-2xl font-mono font-bold text-white text-xs border-y border-l border-white/5 group-hover:border-white/10">
                    {coa.batch_number}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 text-xs text-slate-300 font-light">
                    {coa.lab_name}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-slate-400">
                    {coa.sample_date}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-slate-400">
                    {coa.result_date}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10">
                    <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border ${getStatusBadgeClass(coa.status)}`}>
                      {coa.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-slate-300 font-bold">
                    {coa.thc_pct !== null ? `${coa.thc_pct}%` : '—'}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-slate-300 font-bold">
                    {coa.cbd_pct !== null ? `${coa.cbd_pct}%` : '—'}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-emerald-400 font-bold">
                    {coa.total_cannabinoids !== null ? `${coa.total_cannabinoids}%` : '—'}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10">
                    <div className="flex items-center gap-1.5 font-mono text-[7px] font-bold tracking-widest">
                      <span className={`px-1.5 py-0.5 rounded border ${getPassFailClass(coa.pesticides)}`}>PEST</span>
                      <span className={`px-1.5 py-0.5 rounded border ${getPassFailClass(coa.residual_solvents)}`}>SOLV</span>
                      <span className={`px-1.5 py-0.5 rounded border ${getPassFailClass(coa.heavy_metals)}`}>METL</span>
                      <span className={`px-1.5 py-0.5 rounded border ${getPassFailClass(coa.microbials)}`}>MICR</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 rounded-r-2xl border-y border-r border-white/5 group-hover:border-white/10 text-right">
                    {coa.status === 'PASS' ? (
                      <button 
                        onClick={() => setActiveCoaUrl(coa.batch_number)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-xl hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
                      >
                        <Eye size={12} />
                        <span>VIEW COA</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mr-2">HOLD</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COA Document Modal Mockup */}
      {activeCoaUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#0C1017] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-white/5 px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-400" size={18} />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                  LAB-COA-REPORT-BATCH-{activeCoaUrl}.pdf
                </span>
              </div>
              <button 
                onClick={() => setActiveCoaUrl(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated PDF Document */}
            <div className="flex-1 overflow-y-auto p-8 font-serif text-slate-800 bg-[#FAF9F6] selection:bg-emerald-200">
              <div className="max-w-xl mx-auto space-y-8 bg-white border border-slate-200 p-8 shadow-sm rounded-lg min-h-[700px]">
                {/* PDF Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">SC LABS CALIFORNIA</h1>
                    <p className="text-xs text-slate-500 font-mono mt-1">DCC License: C11-0000353-LIC</p>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-600">
                    <div>REPORT ID: COA-{activeCoaUrl}</div>
                    <div>DATE: 2026-05-18</div>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Client Information</span>
                    <span className="font-bold text-slate-800">WildSeed LLC</span>
                    <p className="text-xs text-slate-600 mt-1">100 Camino Alto, Suite B<br />Santa Rosa, CA 95404</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Sample Information</span>
                    <span className="font-bold text-slate-800">Batch #{activeCoaUrl}</span>
                    <p className="text-xs text-slate-600 mt-1">Product SKU: WS-GUM-25MG-10CT<br />Type: Cannabis Manufacturing Concentrate</p>
                  </div>
                </div>

                {/* PASS Block */}
                <div className="border border-emerald-500 bg-emerald-50 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-lg font-black text-emerald-800">REGULATORY STATUS: PASS</span>
                    <p className="text-xs text-emerald-700 mt-1">All compliance standards met per DCC regulations.</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-600 text-lg font-bold font-mono">
                    OK
                  </div>
                </div>

                {/* Cannabinoid Panel */}
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-800 border-b border-slate-200 pb-2 mb-3 uppercase">Cannabinoid Profile Analysis</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">d9-THC %</span>
                      <span className="text-lg font-black text-slate-800 block">28.4%</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">CBD %</span>
                      <span className="text-lg font-black text-slate-800 block">0.2%</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Cannabinoids</span>
                      <span className="text-lg font-black text-slate-800 block">29.1%</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Panels Table */}
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-800 border-b border-slate-200 pb-2 mb-3 uppercase">Contaminants Analysis Panel</h3>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-widest font-mono">
                        <th className="pb-2">Test Panel</th>
                        <th className="pb-2">DCC Limit</th>
                        <th className="pb-2">Result</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 font-bold text-slate-700">Pesticides Panel</td>
                        <td className="py-2.5 font-mono">ND (Non-Detect)</td>
                        <td className="py-2.5 font-mono text-emerald-600">ND</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">PASS</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-700">Heavy Metals</td>
                        <td className="py-2.5 font-mono">&lt; 0.2 ppm</td>
                        <td className="py-2.5 font-mono text-emerald-600">&lt; 0.05 ppm</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">PASS</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-700">Residual Solvents</td>
                        <td className="py-2.5 font-mono">&lt; 5000 ppm</td>
                        <td className="py-2.5 font-mono text-emerald-600">ND</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">PASS</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-700">Microbial Pathogens</td>
                        <td className="py-2.5 font-mono">Absence / 1g</td>
                        <td className="py-2.5 font-mono text-emerald-600">ABSENT</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">PASS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* PDF Signatures */}
                <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] font-mono text-slate-500">
                  <div>
                    <div>APPROVED BY:</div>
                    <div className="font-serif italic text-slate-800 text-sm mt-1">Dr. Michael Chen</div>
                    <div className="border-t border-slate-400 mt-1 pt-1">Lab Director, SC Labs</div>
                  </div>
                  <div className="text-right">
                    <div>ISO/IEC 17025 Accreditation</div>
                    <div>Certificate #4820.01</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button 
                onClick={() => setActiveCoaUrl(null)}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                CLOSE PREVIEW
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-mono rounded-xl hover:bg-emerald-600 transition-all active:scale-[0.98]">
                <Download size={14} />
                <span>DOWNLOAD PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
