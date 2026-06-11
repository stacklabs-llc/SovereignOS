import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, RefreshCw, Edit2, Save, X, Download } from 'lucide-react';
import { getApiHost } from '../api-host';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';

interface SysRule {
  sys_id: string;
  rule_id: string;
  title: string;
  summary: string;
  content: string;
  sys_updated_on: string;
}

export default function SysRulesPanel() {
  const [rules, setRules] = useState<SysRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleExportIndividual = (rule: SysRule, format: 'md' | 'json') => {
    let blob: Blob;
    let filename: string;

    if (format === 'md') {
      const markdownContent = `# ${rule.title}\n\n> **Summary:** ${rule.summary}\n\n---\n\n${rule.content}`;
      blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
      filename = `${rule.rule_id}.md`;
    } else {
      blob = new Blob([JSON.stringify(rule, null, 2)], { type: 'application/json;charset=utf-8;' });
      filename = `${rule.rule_id}.json`;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBulk = (format: 'md' | 'json') => {
    let blob: Blob;
    let filename: string;

    if (format === 'md') {
      const combinedMarkdown = rules.map(rule => (
        `# ${rule.title}\n\n**ID:** \`${rule.rule_id}\`\n\n> **Summary:** ${rule.summary}\n\n---\n\n${rule.content}\n\n`
      )).join('\n---\n\n');
      
      blob = new Blob([combinedMarkdown], { type: 'text/markdown;charset=utf-8;' });
      filename = `sovereign_system_rules_${new Date().toISOString().split('T')[0]}.md`;
    } else {
      blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json;charset=utf-8;' });
      filename = `sovereign_system_rules_${new Date().toISOString().split('T')[0]}.json`;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/sys_rules`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.sys_rules || []);
        if (data.sys_rules && data.sys_rules.length > 0 && !activeRule) {
          setActiveRule(data.sys_rules[0].sys_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sys_rules', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const selectedRule = rules.find(r => r.sys_id === activeRule);

  const filteredRules = rules.filter(rule => {
    const q = searchQuery.toLowerCase();
    return (
      rule.title.toLowerCase().includes(q) ||
      rule.rule_id.toLowerCase().includes(q) ||
      rule.summary.toLowerCase().includes(q) ||
      rule.content.toLowerCase().includes(q)
    );
  });

  // When selected rule changes, reset edit state if active
  useEffect(() => {
    if (selectedRule && !isEditing) {
      setEditSummary(selectedRule.summary);
      setEditContent(selectedRule.content);
    }
  }, [selectedRule, activeRule, isEditing]);

  const handleEditClick = () => {
    if (selectedRule) {
      setEditSummary(selectedRule.summary);
      setEditContent(selectedRule.content);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedRule) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/sys_rules/${selectedRule.sys_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: editSummary,
          content: editContent
        })
      });
      if (res.ok) {
        setIsEditing(false);
        await fetchRules(); // Refresh to get updated timestamp
      } else {
        console.error('Failed to save rule');
      }
    } catch (err) {
      console.error('Save error', err);
    }
    setSaving(false);
  };

  return (
    <div className="flex w-full h-[85vh] bg-[#0A0C10] text-white rounded-xl overflow-hidden border border-red-500/30">
      
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-red-500/20 flex flex-col bg-[#0f1115]">
        <div className="p-4 border-b border-red-500/20 flex justify-between items-center bg-red-500/5">
          <div className="flex items-center gap-2">
            <BookOpen className="text-red-400 w-5 h-5" />
            <h2 className="font-display font-bold text-red-100 uppercase tracking-widest text-sm">System Rules</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExportBulk('md')} 
              title="Export All (Markdown)" 
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-[10px] font-mono border border-red-500/20 px-1.5 py-0.5 rounded bg-red-500/5 hover:bg-red-500/10"
            >
              <Download className="w-3 h-3" /> MD
            </button>
            <button 
              onClick={() => handleExportBulk('json')} 
              title="Export All (JSON)" 
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-[10px] font-mono border border-red-500/20 px-1.5 py-0.5 rounded bg-red-500/5 hover:bg-red-500/10"
            >
              <Download className="w-3 h-3" /> JSON
            </button>
            <button onClick={fetchRules} className="text-red-400 hover:text-red-300 ml-1">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="p-3 border-b border-red-500/10">
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0c10] border border-white/10 focus:border-red-500/50 rounded px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
          {filteredRules.map(rule => (
            <button
              key={rule.sys_id}
              onClick={() => {
                if (!isEditing) setActiveRule(rule.sys_id);
              }}
              className={`w-full text-left p-3 rounded border transition-colors ${
                activeRule === rule.sys_id 
                  ? 'bg-red-500/20 border-red-500 text-red-100' 
                  : 'bg-white/5 border-white/5 hover:border-red-500/30 text-white/70'
              } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isEditing}
            >
              <h3 className="font-bold text-sm mb-1">{rule.title}</h3>
              <p className="text-[10px] text-white/50 line-clamp-2">{rule.summary}</p>
            </button>
          ))}
          {!loading && filteredRules.length === 0 && (
            <div className="p-4 text-center text-white/30 text-sm">
              {rules.length === 0 ? 'No rules found in CMDB.' : `No rules matching "${searchQuery}"`}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-black/20 overflow-y-auto relative">
        {selectedRule ? (
          <div className="p-8 max-w-4xl mx-auto w-full pb-20">
            <div className="mb-6 border-b border-white/10 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-display font-bold text-white tracking-wide mb-2">
                  {selectedRule.title}
                </h1>
                <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                  <span>ID: {selectedRule.rule_id}</span>
                  <span>•</span>
                  <span>Last Updated: {new Date(selectedRule.sys_updated_on + 'Z').toLocaleString()}</span>
                </div>
              </div>
              
              {!isEditing ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportIndividual(selectedRule, 'md')}
                    className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10 hover:border-red-500/50 px-3 py-1.5 rounded transition-all text-sm font-bold"
                  >
                    <Download className="w-4 h-4" /> Export MD
                  </button>
                  <button 
                    onClick={() => handleExportIndividual(selectedRule, 'json')}
                    className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10 hover:border-red-500/50 px-3 py-1.5 rounded transition-all text-sm font-bold"
                  >
                    <Download className="w-4 h-4" /> Export JSON
                  </button>
                  <button 
                    onClick={handleEditClick}
                    className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10 hover:border-red-500/50 px-3 py-1.5 rounded transition-all text-sm font-bold"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Rule
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded border border-white/10 transition-all text-sm font-bold"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-all text-sm font-bold"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Summary (JSON Metadata)</label>
                  <textarea 
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full bg-[#0f1115] border border-red-500/30 rounded p-3 text-sm text-red-100 font-medium focus:outline-none focus:border-red-500 min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Content (Markdown Rule)</label>
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#0f1115] border border-white/10 rounded p-4 text-sm text-white/90 font-mono focus:outline-none focus:border-red-500/50 min-h-[400px]"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mb-8 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-100 font-medium leading-relaxed">{selectedRule.summary}</p>
                </div>

                <div className="prose prose-invert prose-red max-w-none prose-headings:font-display prose-a:text-red-400 hover:prose-a:text-red-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkGithubAlerts]}>
                    {selectedRule.content}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20">
            {loading ? 'Loading rules...' : 'Select a rule to view details'}
          </div>
        )}
      </div>

    </div>
  );
}
