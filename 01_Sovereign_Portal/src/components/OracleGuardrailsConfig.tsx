import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, CheckCircle, X } from 'lucide-react';

export default function OracleGuardrailsConfig() {
  const [guardrails, setGuardrails] = useState<any[]>([]);
  const [newRule, setNewRule] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/guardrails');
      const data = await res.json();
      if (data.guardrails) {
        setGuardrails(data.guardrails);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_text: newRule.trim() })
      });
      if (res.ok) {
        setNewRule('');
        fetchRules();
        setStatus('Rule added securely to the Sovereign Knot.');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setStatus('Failed to add rule.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/guardrails?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-gray-200 p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display uppercase tracking-widest text-white">Oracle Guardrails</h1>
            <p className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mt-1">Data-Driven Security Directives</p>
          </div>
        </div>

        {status && (
          <div className="mb-6 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-mono tracking-widest">
            <CheckCircle className="w-4 h-4" />
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold font-mono text-gray-400 tracking-[0.2em] uppercase mb-2">Active Directives</h2>
            {guardrails.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-gray-500 font-mono text-sm tracking-widest uppercase">
                No active guardrails. Pandora's box is wide open.
              </div>
            ) : (
              <div className="space-y-3">
                {guardrails.map((rule) => (
                  <div key={rule.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4 hover:border-cyan-400/30 transition-colors group">
                    <div className="mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    </div>
                    <div className="flex-1 font-mono text-sm leading-relaxed text-gray-300 break-words">
                      {rule.rule_text}
                    </div>
                    <button 
                      onClick={() => handleDelete(rule.id)}
                      disabled={isLoading}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#151921] border border-white/5 rounded-xl p-6 h-fit sticky top-8">
            <h2 className="text-xs font-bold font-mono text-cyan-400 tracking-[0.2em] uppercase mb-4">Add Directive</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <textarea
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="e.g. Do not reveal proprietary source code."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all min-h-[120px] resize-none"
              ></textarea>
              <button
                type="submit"
                disabled={isLoading || !newRule.trim()}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-widest uppercase px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Inject Rule
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
