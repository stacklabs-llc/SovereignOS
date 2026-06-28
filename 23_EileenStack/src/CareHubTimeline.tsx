import { useEffect, useState } from 'react';
import { BookOpen, RefreshCw, FileText, Calendar, User, FileSymlink } from 'lucide-react';

interface MedicalRecord {
  record_id: number;
  category: 'Lab' | 'Oncology' | 'Scan' | 'Medication';
  document_title: string;
  provider_name: string;
  date_of_service: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export default function CareHubTimeline() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/medical_vault');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      } else {
        setError(`Failed to retrieve clinical vault logs: ${res.statusText}`);
      }
    } catch (e: any) {
      setError(`Network error connecting to medical vault API: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Lab':
        return { badge: 'bg-[#436850]/8 text-[#436850] border-[#436850]/20', dot: 'bg-[#436850]' };
      case 'Oncology':
        return { badge: 'bg-[#c25134]/8 text-[#c25134] border-[#c25134]/20', dot: 'bg-[#c25134]' };
      case 'Scan':
        return { badge: 'bg-blue-50 text-blue-750 border-blue-200', dot: 'bg-blue-500' };
      case 'Medication':
        return { badge: 'bg-[#9c3120]/8 text-[#9c3120] border-[#9c3120]/20', dot: 'bg-[#9c3120]' };
      default:
        return { badge: 'bg-gray-50 text-gray-750 border-gray-200', dot: 'bg-gray-400' };
    }
  };

  return (
    <div className="cardboard-panel p-6 bg-white min-h-[480px]">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-6">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-4.5 h-4.5 text-[#c25134]" /> Clinical Record Vault Ledger
        </h2>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="p-1.5 hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all disabled:opacity-50"
          title="Sync Ledger"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-[#c25134] animate-spin" />
          <p className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider">Loading local ledger...</p>
        </div>
      )}

      {error && (
        <div className="bg-[#9c3120]/8 border border-[#9c3120]/20 text-gray-800 p-4 rounded-xl text-xs font-mono leading-relaxed mb-6">
          🚨 {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="text-center py-20 text-gray-400 bg-gray-50/50 rounded-2xl border border-gray-200 border-dashed">
          <FileText className="w-9 h-9 mx-auto mb-2 opacity-50" />
          <p className="text-xs uppercase font-bold tracking-wider">No medical documents registered.</p>
          <p className="text-[10px] mt-1 font-serif">Run `ingest_medical_vault.py` to synchronize file paths.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="relative pl-6 border-l border-gray-200 space-y-6">
          {records.map(record => {
            const styles = getCategoryStyles(record.category);
            const fileName = record.file_path.split('/').pop() || 'document.pdf';
            return (
              <div key={record.record_id} className="relative group">
                {/* Timeline Dot Indicator */}
                <div className={`absolute -left-[30px] top-1.5 w-[9px] h-[9px] rounded-full border border-white ${styles.dot} z-10 shadow-sm`} />

                {/* Ledger Item Details */}
                <div className="p-4 bg-gray-50/40 border border-gray-100 hover:border-gray-200 rounded-2xl transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${styles.badge}`}>
                      {record.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-sans font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {record.date_of_service}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-gray-800 leading-tight mb-1.5">
                    {record.document_title}
                  </h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600 mb-3.5 font-sans">
                    {record.provider_name && (
                      <span><strong>Provider:</strong> {record.provider_name}</span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <User className="w-3 h-3" />
                      <span>By: {record.uploaded_by}</span>
                    </span>
                  </div>

                  {/* Attachment Access path */}
                  <div className="bg-white border border-gray-100 p-2.5 rounded-xl flex items-center justify-between text-[10px] text-gray-600 font-medium font-sans">
                    <span className="truncate max-w-[220px]" title={record.file_path}>
                      📁 {fileName}
                    </span>
                    <a
                      href={`file://${record.file_path}`}
                      className="text-[#c25134] hover:text-[#b84a2b] transition-colors flex items-center gap-0.5 font-bold uppercase tracking-wider text-[9px]"
                    >
                      <FileSymlink className="w-3.5 h-3.5" />
                      <span>Ledger Path</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
