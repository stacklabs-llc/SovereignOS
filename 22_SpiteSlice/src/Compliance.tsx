import { useState, useEffect } from 'react';
import { Shield, FileText, Activity } from 'lucide-react';

interface Batch {
  sys_id: string;
  batch_number: string;
  metrc_tag: string;
  status: string;
  input_material: string;
  batch_date: string;
}

interface ComplianceLog {
  sys_id: string;
  batch_number: string;
  event_type: string;
  description: string;
  operator: string;
  sys_created_on: string;
}

export default function Compliance() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/wildseed/batches').then((res) => res.json()),
      fetch('/api/wildseed/compliance').then((res) => res.json())
    ])
      .then(([batchData, logData]) => {
        setBatches(batchData);
        setLogs(logData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching compliance data:', err);
        setLoading(false);
      });
  }, []);

  const getBadgeStyle = (eventType: string) => {
    switch (eventType) {
      case 'COA_PASSED':
      case 'BATCH_RELEASED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'COA_FAILED':
      case 'BATCH_DESTROYED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'METRC_TAG_ASSIGNED':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'AUDIT_NOTE':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
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
        return 'text-rose-500 border-rose-600/30 bg-rose-600/10';
      default:
        return 'text-slate-400 border-white/10 bg-white/5';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-white">
        <Activity className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Loading Compliance Registers...</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20 text-white">
      <header className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black tracking-widest uppercase">Compliance Command</h2>
        <p className="text-slate-400 font-light tracking-widest text-xs uppercase mt-1">DCC Track-and-Trace, Metrc Logs, & Chain of Custody</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Metrc Chain of Custody */}
        <div className="col-span-12 xl:col-span-7 clinical-card bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col h-[600px] overflow-hidden">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0">
            <Shield className="w-4 h-4 text-emerald-400" /> Metrc Chain of Custody
          </h3>
          <div className="overflow-y-auto flex-1 pr-1">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <tr>
                  <th className="font-normal px-4 pb-2">Batch #</th>
                  <th className="font-normal px-4 pb-2">Metrc Tag</th>
                  <th className="font-normal px-4 pb-2">Intake Source</th>
                  <th className="font-normal px-4 pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.sys_id} className="bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                    <td className="px-4 py-3 rounded-l-xl font-mono font-bold text-white text-xs border-y border-l border-white/5">
                      {batch.batch_number}
                    </td>
                    <td className="px-4 py-3 border-y border-white/5 font-mono text-xs text-slate-400 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {batch.metrc_tag || 'PENDING'}
                    </td>
                    <td className="px-4 py-3 border-y border-white/5 text-xs text-slate-300 font-light max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {batch.input_material}
                    </td>
                    <td className="px-4 py-3 rounded-r-xl border-y border-r border-white/5 text-right">
                      <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border ${getStatusClass(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Event Log */}
        <div className="col-span-12 xl:col-span-5 clinical-card bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col h-[600px] overflow-hidden">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0">
            <FileText className="w-4 h-4 text-cyan-400" /> Compliance Event Log
          </h3>
          <div className="overflow-y-auto flex-1 pr-1 space-y-3 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
            {logs.map((log) => (
              <div key={log.sys_id} className="flex gap-3 relative z-10 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className={`w-8 h-8 rounded-full bg-[#0b0e14] border border-white/5 flex items-center justify-center shrink-0 shadow-lg ${
                  log.event_type.includes('PASSED') || log.event_type.includes('RELEASED') ? 'text-emerald-400 border-emerald-500/25' :
                  log.event_type.includes('FAILED') || log.event_type.includes('DESTROYED') ? 'text-rose-400 border-rose-500/25' :
                  log.event_type.includes('TAG') ? 'text-cyan-400 border-cyan-500/25' : 'text-amber-400 border-amber-500/25'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                </div>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3.5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-white font-mono">{log.batch_number}</span>
                    <span className="text-[8px] font-mono text-slate-500">{log.sys_created_on}</span>
                  </div>
                  <div className="mb-2">
                    <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${getBadgeStyle(log.event_type)}`}>
                      {log.event_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-light leading-snug">{log.description}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>BY: {log.operator}</span>
                    <span>METRC SUBMITTED</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
