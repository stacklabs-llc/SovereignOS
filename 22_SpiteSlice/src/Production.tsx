import { useState, useEffect } from 'react';
import { FlaskConical, ChevronRight, X, FileText, HelpCircle, Activity } from 'lucide-react';

interface Batch {
  sys_id: string;
  batch_number: string;
  metrc_tag: string;
  status: string;
  input_material: string;
  input_weight_g: number;
  output_units: number;
  output_sku: string;
  batch_date: string;
  notes: string;
}

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
  coa_file_url: string;
  notes: string;
}

interface ComplianceLog {
  sys_id: string;
  batch_number: string;
  event_type: string;
  description: string;
  operator: string;
  sys_created_on: string;
}

interface BatchDetailData {
  batch: Batch | null;
  coa: Coa | null;
  compliance_log: ComplianceLog[];
}

export default function Production() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<BatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/wildseed/batches')
      .then((res) => res.json())
      .then((data) => {
        setBatches(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching batches:', err);
        setLoading(false);
      });
  }, []);

  const handleRowClick = (batchNumber: string) => {
    setSelectedBatch(batchNumber);
    setDetailLoading(true);
    fetch(`/api/wildseed/batches/${batchNumber}`)
      .then((res) => res.json())
      .then((data) => {
        setDetailData(data);
        setDetailLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching batch detail:', err);
        setDetailLoading(false);
      });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'IN_PROCESS':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      case 'TESTING':
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10 shadow-[0_0_10px_rgba(14,165,233,0.1)]';
      case 'RELEASED':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      case 'DESTROYED':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      case 'RECALLED':
        return 'text-rose-500 border-rose-600/30 bg-rose-600/10 animate-pulse';
      default:
        return 'text-slate-400 border-white/10 bg-white/5';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-white">
        <Activity className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Loading Active Runs...</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20 text-white relative">
      <header className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black tracking-widest uppercase">Manufacturing Production</h2>
        <p className="text-slate-400 font-light tracking-widest text-xs uppercase mt-1">Extraction, Formulation, and Packaging Batches</p>
      </header>

      <div className="clinical-card bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              <tr>
                <th className="font-normal px-4 pb-2">Batch #</th>
                <th className="font-normal px-4 pb-2">Status</th>
                <th className="font-normal px-4 pb-2">Input Source</th>
                <th className="font-normal px-4 pb-2">Input Weight</th>
                <th className="font-normal px-4 pb-2">Output SKU</th>
                <th className="font-normal px-4 pb-2">Yield (Units)</th>
                <th className="font-normal px-4 pb-2">Batch Date</th>
                <th className="font-normal px-4 pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr 
                  key={batch.sys_id} 
                  onClick={() => handleRowClick(batch.batch_number)}
                  className="bg-white/5 group hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                >
                  <td className="px-4 py-3.5 rounded-l-2xl font-mono font-bold text-white text-xs border-y border-l border-white/5 group-hover:border-white/10">
                    {batch.batch_number}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10">
                    <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border ${getStatusClass(batch.status)}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 text-xs font-light text-slate-300">
                    {batch.input_material}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-slate-400">
                    {batch.input_weight_g.toLocaleString()} g
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-slate-300">
                    {batch.output_sku}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-emerald-400 font-bold">
                    {batch.output_units > 0 ? `${batch.output_units.toLocaleString()} units` : '—'}
                  </td>
                  <td className="px-4 py-3.5 border-y border-white/5 group-hover:border-white/10 font-mono text-xs text-slate-400">
                    {batch.batch_date}
                  </td>
                  <td className="px-4 py-3.5 rounded-r-2xl border-y border-r border-white/5 group-hover:border-white/10 text-right">
                    <div className="flex items-center justify-end text-slate-400 group-hover:text-emerald-400 transition-colors">
                      <span className="text-[10px] font-mono tracking-wider mr-1 opacity-0 group-hover:opacity-100 transition-opacity">DETAIL</span>
                      <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Detail Drawer */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl h-full bg-[#0C1017]/95 border-l border-white/10 shadow-2xl p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">BATCH OPERATIONS DETAIL</span>
                <h3 className="text-xl font-black text-white font-mono uppercase tracking-widest mt-1">BATCH #{selectedBatch}</h3>
              </div>
              <button 
                onClick={() => setSelectedBatch(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white">
                <Activity className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Retrieving Batch Records...</span>
              </div>
            ) : (
              detailData && (
                <div className="space-y-6 flex-1">
                  {/* Basic Info */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4.5 space-y-3.5">
                    <h4 className="text-[10px] font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                      <FlaskConical size={12} className="text-emerald-400" /> BATCH PROTOCOL PROFILE
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">METRC Tag UID</span>
                        <span className="text-xs font-mono text-slate-300 font-bold block overflow-hidden text-ellipsis">{detailData.batch?.metrc_tag || 'UNASSIGNED'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Status</span>
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border inline-block mt-0.5 ${getStatusClass(detailData.batch?.status || '')}`}>
                          {detailData.batch?.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Input Weight</span>
                        <span className="text-xs font-mono text-slate-300 font-bold block">{detailData.batch?.input_weight_g.toLocaleString()} g</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Yield Amount</span>
                        <span className="text-xs font-mono text-emerald-400 font-bold block">{detailData.batch?.output_units.toLocaleString()} units</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Target SKU</span>
                        <span className="text-xs font-mono text-slate-300 font-bold block">{detailData.batch?.output_sku}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Intake Date</span>
                        <span className="text-xs font-mono text-slate-300 font-bold block">{detailData.batch?.batch_date}</span>
                      </div>
                    </div>
                    {detailData.batch?.notes && (
                      <div className="border-t border-white/5 pt-3">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Internal Notes</span>
                        <p className="text-xs text-slate-300 font-light mt-1 italic">"{detailData.batch?.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* COA Status Panel */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4.5 space-y-3.5">
                    <h4 className="text-[10px] font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                      <FileText size={12} className="text-sky-400" /> COA CERTIFICATE STATUS
                    </h4>
                    {detailData.coa ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-white font-bold block">{detailData.coa.lab_name}</span>
                            <span className="text-[9px] font-mono text-slate-500 block">Tested: {detailData.coa.sample_date}</span>
                          </div>
                          <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                            detailData.coa.status === 'PASS' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                            detailData.coa.status === 'FAIL' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                            'text-sky-400 border-sky-500/30 bg-sky-500/10'
                          }`}>
                            COA {detailData.coa.status}
                          </span>
                        </div>

                        {detailData.coa.status !== 'PENDING' && (
                          <div className="grid grid-cols-3 gap-3 border-y border-white/5 py-3">
                            <div className="text-center bg-black/40 border border-white/5 rounded-xl p-2">
                              <span className="text-[8px] font-mono text-slate-500 uppercase block">THC %</span>
                              <span className="text-sm font-black text-white font-mono block">{detailData.coa.thc_pct}%</span>
                            </div>
                            <div className="text-center bg-black/40 border border-white/5 rounded-xl p-2">
                              <span className="text-[8px] font-mono text-slate-500 uppercase block">CBD %</span>
                              <span className="text-sm font-black text-white font-mono block">{detailData.coa.cbd_pct}%</span>
                            </div>
                            <div className="text-center bg-black/40 border border-white/5 rounded-xl p-2">
                              <span className="text-[8px] font-mono text-slate-500 uppercase block">Total Cannabinoids</span>
                              <span className="text-sm font-black text-emerald-400 font-mono block">{detailData.coa.total_cannabinoids}%</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-slate-400 text-[10px]">Pesticides:</span>
                            <span className={detailData.coa.pesticides === 'PASS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {detailData.coa.pesticides}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-slate-400 text-[10px]">Heavy Metals:</span>
                            <span className={detailData.coa.heavy_metals === 'PASS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {detailData.coa.heavy_metals}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-slate-400 text-[10px]">Solvents:</span>
                            <span className={detailData.coa.residual_solvents === 'PASS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {detailData.coa.residual_solvents}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-slate-400 text-[10px]">Microbials:</span>
                            <span className={detailData.coa.microbials === 'PASS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {detailData.coa.microbials}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-black/20 border border-dashed border-white/10 rounded-xl text-slate-500 font-mono text-xs uppercase tracking-wider flex flex-col items-center gap-2">
                        <HelpCircle size={20} className="opacity-45" />
                        No Linked Lab COA found for this batch.
                      </div>
                    )}
                  </div>

                  {/* Batch Compliance Log */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                      <Activity size={12} className="text-amber-400" /> COMPLIANCE & PROTOCOL HISTORY
                    </h4>
                    <div className="space-y-3 overflow-y-auto max-h-56 pr-1 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                      {detailData.compliance_log.map((log) => (
                        <div key={log.sys_id} className="flex gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full bg-[#0b0e14] border border-white/5 flex items-center justify-center shrink-0 shadow-lg ${
                            log.event_type.includes('PASSED') || log.event_type.includes('RELEASED') ? 'text-emerald-400 border-emerald-500/25' :
                            log.event_type.includes('FAILED') || log.event_type.includes('DESTROYED') ? 'text-rose-400 border-rose-500/25' :
                            'text-cyan-400 border-cyan-500/25'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          </div>
                          <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border ${
                                log.event_type.includes('PASSED') || log.event_type.includes('RELEASED') ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                log.event_type.includes('FAILED') ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                                'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                              }`}>
                                {log.event_type}
                              </span>
                              <span className="text-[8px] font-mono text-slate-500">{log.sys_created_on}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">{log.description}</p>
                            <span className="text-[8px] font-mono text-slate-500 block mt-2">OPERATOR: {log.operator.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
