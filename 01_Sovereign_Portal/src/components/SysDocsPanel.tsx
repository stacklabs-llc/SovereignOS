import React, { useState, useEffect } from 'react';
import { BookOpen, Search, RefreshCw, Edit2, Eye, Save, X, Download, Columns, FileText } from 'lucide-react';
import { getApiHost } from '../api-host';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';

interface SystemDoc {
  path: string;
  title: string;
  summary: string;
}

export default function SysDocsPanel() {
  const [docs, setDocs] = useState<SystemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDocPath, setActiveDocPath] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'split' | 'raw'>('preview');
  const [saving, setSaving] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/docs`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.docs || []);
        if (data.docs && data.docs.length > 0 && !activeDocPath) {
          setActiveDocPath(data.docs[0].path);
        }
      }
    } catch (err) {
      console.error('Failed to fetch system docs list', err);
    }
    setLoading(false);
  };

  const fetchDocContent = async (path: string) => {
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/docs/content?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setDocContent(data.content || '');
        setEditContent(data.content || '');
      }
    } catch (err) {
      console.error('Failed to fetch doc content', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    if (activeDocPath) {
      fetchDocContent(activeDocPath);
      setIsEditing(false); // Reset editing when switching docs
    }
  }, [activeDocPath]);

  const selectedDoc = docs.find(d => d.path === activeDocPath);

  const filteredDocs = docs.filter(doc => {
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.path.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q)
    );
  });

  const handleEditClick = () => {
    if (selectedDoc) {
      setEditContent(docContent);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(docContent);
  };

  const handleSaveEdit = async () => {
    if (!activeDocPath) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/docs/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeDocPath,
          content: editContent
        })
      });
      if (res.ok) {
        setDocContent(editContent);
        setIsEditing(false);
        // Refresh list to update summaries
        await fetchDocs();
      } else {
        console.error('Failed to save document');
      }
    } catch (err) {
      console.error('Save error', err);
    }
    setSaving(false);
  };

  const handleExport = (doc: SystemDoc) => {
    const blob = new Blob([docContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', doc.path.split('/').pop() || 'document.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const markdownComponents = {
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      if (!src) return null;
      const isVideo = src.toLowerCase().endsWith('.mp4') || 
                      src.toLowerCase().endsWith('.mov') || 
                      src.toLowerCase().endsWith('.webm');
      
      const mediaUrl = src.startsWith('http') || src.startsWith('blob:') 
        ? src 
        : `${getApiHost(8090)}/api/system/docs/media?src=${encodeURIComponent(src)}&doc_path=${encodeURIComponent(activeDocPath || '')}`;

      if (isVideo) {
        return (
          <div className="my-6 rounded-xl overflow-hidden border border-cyan-500/30 shadow-lg bg-black/90 max-w-2xl mx-auto">
            <video src={mediaUrl} controls className="w-full max-h-[400px] object-contain" />
            {alt && <div className="text-center text-xs text-cyan-400/70 py-2 border-t border-cyan-500/10 bg-cyan-950/20">{alt}</div>}
          </div>
        );
      }
      
      return (
        <div className="my-6 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40 p-2 max-w-2xl mx-auto">
          <img src={mediaUrl} alt={alt} className="w-full object-contain max-h-[400px] rounded" />
          {alt && <div className="text-center text-xs text-white/50 mt-2">{alt}</div>}
        </div>
      );
    }
  };

  return (
    <div className="flex w-full h-[85vh] bg-[#0B0E14] text-white rounded-xl overflow-hidden border border-cyan-500/30">
      
      {/* Left Sidebar - Documents List */}
      <div className="w-80 border-r border-cyan-500/20 flex flex-col bg-[#0f1115] shrink-0">
        <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center bg-cyan-500/5">
          <div className="flex items-center gap-2">
            <BookOpen className="text-cyan-400 w-5 h-5" />
            <h2 className="font-display font-bold text-cyan-100 uppercase tracking-widest text-sm">System Docs</h2>
          </div>
          <button onClick={fetchDocs} className="text-cyan-400 hover:text-cyan-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="p-3 border-b border-cyan-500/10">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/30" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0c10] border border-white/10 focus:border-cyan-500/50 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredDocs.map(doc => (
            <button
              key={doc.path}
              onClick={() => {
                if (!isEditing) setActiveDocPath(doc.path);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activeDocPath === doc.path 
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                  : 'bg-white/5 border-white/5 hover:border-cyan-500/30 text-white/70'
              } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isEditing}
            >
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 shrink-0 text-cyan-500/60" />
                <div className="overflow-hidden">
                  <h3 className="font-bold text-xs truncate">{doc.title}</h3>
                  <p className="text-[10px] text-white/40 truncate mt-0.5 font-mono">{doc.path}</p>
                  <p className="text-[10px] text-white/50 line-clamp-2 mt-1 leading-relaxed">{doc.summary}</p>
                </div>
              </div>
            </button>
          ))}
          {!loading && filteredDocs.length === 0 && (
            <div className="p-4 text-center text-white/30 text-xs font-mono">
              {docs.length === 0 ? 'No playbooks found.' : `No matches for "${searchQuery}"`}
            </div>
          )}
        </div>
      </div>

      {/* Right Panels - Viewer & Editor */}
      <div className="flex-1 flex flex-col bg-black/20 overflow-hidden relative">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Document Header Controls */}
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0d0f14] shrink-0">
              <div className="overflow-hidden">
                <h1 className="text-xl font-display font-bold text-white tracking-wide truncate">
                  {selectedDoc.title}
                </h1>
                <div className="text-[10px] font-mono text-cyan-400/60 truncate mt-0.5">
                  dna/docs/{selectedDoc.path}
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {!isEditing ? (
                  <>
                    <button 
                      onClick={() => handleExport(selectedDoc)}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/50 px-3 py-1.5 rounded-lg transition-all text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> Export MD
                    </button>
                    <button 
                      onClick={handleEditClick}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/50 px-3 py-1.5 rounded-lg transition-all text-xs font-bold"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Docs
                    </button>
                  </>
                ) : (
                  <>
                    {/* Mode Selectors */}
                    <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40 mr-2 text-[10px] font-mono">
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                          viewMode === 'preview' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button
                        onClick={() => setViewMode('split')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                          viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <Columns className="w-3 h-3" /> Split
                      </button>
                      <button
                        onClick={() => setViewMode('raw')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                          viewMode === 'raw' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3 h-3" /> Raw MD
                      </button>
                    </div>

                    <button 
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg border border-white/10 transition-all text-xs font-bold"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-bold"
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Document Content Split Pane */}
            <div className="flex-1 flex overflow-hidden">
              {/* Markdown Editor Input Panel */}
              {isEditing && (viewMode === 'split' || viewMode === 'raw') && (
                <div className="flex-1 border-r border-white/10 bg-[#07090c] p-4 flex flex-col h-full">
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your markdown playbook content here..."
                    className="flex-1 w-full bg-transparent resize-none text-white/90 font-mono text-xs focus:outline-none leading-relaxed p-2 no-scrollbar"
                  />
                </div>
              )}

              {/* Markdown Parser Preview Panel */}
              {(!isEditing || viewMode === 'preview' || viewMode === 'split') && (
                <div className="flex-1 overflow-y-auto no-scrollbar p-8 h-full">
                  <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-display prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkGithubAlerts]} components={markdownComponents}>
                      {isEditing ? editContent : docContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20 font-mono text-xs">
            {loading ? 'Initializing documentation catalog...' : 'Select a playbook from the catalog to load content'}
          </div>
        )}
      </div>

    </div>
  );
}
