import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, RefreshCw, Edit2, Eye, Save, X, Download, 
  Columns, FileText, Settings, FolderPlus, Trash2, Check, 
  Folder, Plus, Loader2, AlertCircle, CheckCircle2, ChevronRight,
  Sliders, EyeOff, FolderOpen
} from 'lucide-react';
import { getApiHost } from '../api-host';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';

interface SearchDirectory {
  sys_id?: string;
  name: string;
  path: string;
  active: number;
  recursive: number;
  file_extensions?: string;
}

interface SearchResult {
  path: string;
  name: string;
  size: number;
  last_modified: string;
  directory_name: string;
  matches?: {
    line_number: number;
    line_content: string;
  }[];
}

interface GlobalSearchWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchWidget({ isOpen, onClose }: GlobalSearchWidgetProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'directories'>('search');
  const [directories, setDirectories] = useState<SearchDirectory[]>([]);
  const [loadingDirs, setLoadingDirs] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [docContent, setDocContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'split' | 'raw'>('preview');
  const [saving, setSaving] = useState(false);
  
  // Directory form state
  const [newDirName, setNewDirName] = useState('');
  const [newDirPath, setNewDirPath] = useState('');
  const [newDirExtensions, setNewDirExtensions] = useState('.md,.txt,.json,.csv,.py');
  const [newDirRecursive, setNewDirRecursive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Global message notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else if (searchQuery.trim() === '') {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isOpen]);

  // Fetch directories on open/mount
  useEffect(() => {
    if (isOpen) {
      fetchDirectories();
      // Reset search/selection states when opening
      setSearchQuery('');
      setResults([]);
      setSelectedResult(null);
      setDocContent('');
      setIsEditing(false);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // If editing, confirm or close editing first
        if (isEditing) {
          if (confirm('Discard unsaved edits?')) {
            setIsEditing(false);
          }
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isEditing]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const getHeaders = () => {
    const token = localStorage.getItem('sovereign_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchDirectories = async () => {
    setLoadingDirs(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/search/directories`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDirectories(data.directories || []);
      } else {
        console.error('Failed to fetch searchable directories');
      }
    } catch (err) {
      console.error('Error fetching directories', err);
    } finally {
      setLoadingDirs(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = (data.results || []).map((res: any) => ({
          path: res.path,
          name: res.title || res.filename || '',
          size: res.size || 0,
          last_modified: res.last_modified || '',
          directory_name: res.folder_name || '',
          matches: (res.matches || []).map((m: any) => ({
            line_number: m.line_number,
            line_content: m.content || m.line_content || ''
          }))
        }));
        setResults(normalized);
      } else {
        const err = await res.json();
        showNotification('error', `Search failed: ${err.detail || 'Access Denied'}`);
      }
    } catch (err) {
      console.error('Search error', err);
      showNotification('error', 'Search request failed. Verify Tailscale mesh connectivity.');
    } finally {
      setSearching(false);
    }
  };

  const fetchFileContent = async (result: SearchResult) => {
    setLoadingContent(true);
    setIsEditing(false);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/search/file/content?path=${encodeURIComponent(result.path)}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDocContent(data.content || '');
        setEditContent(data.content || '');
        setSelectedResult(result);
      } else {
        const err = await res.json();
        showNotification('error', `Failed to load file: ${err.detail || 'Access Denied'}`);
      }
    } catch (err) {
      console.error('Content fetch error', err);
      showNotification('error', 'Failed to retrieve file content.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedResult) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/search/file/save`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({
          path: selectedResult.path,
          content: editContent
        })
      });
      if (res.ok) {
        setDocContent(editContent);
        setIsEditing(false);
        showNotification('success', '✓ Document synchronized successfully.');
      } else {
        const err = await res.json();
        showNotification('error', `Failed to save: ${err.detail || 'Access Denied'}`);
      }
    } catch (err) {
      console.error('Save file error', err);
      showNotification('error', 'Error sending save payload.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!newDirName.trim() || !newDirPath.trim()) {
      setFormError('Name and Absolute Path are required fields.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/search/directories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({
          name: newDirName.trim(),
          path: newDirPath.trim(),
          active: 1,
          recursive: newDirRecursive ? 1 : 0,
          file_extensions: newDirExtensions.trim()
        })
      });

      if (res.ok) {
        setFormSuccess('✓ Directory successfully registered to search index.');
        setNewDirName('');
        setNewDirPath('');
        setNewDirExtensions('.md,.txt,.json,.csv,.py');
        setNewDirRecursive(true);
        fetchDirectories();
      } else {
        const err = await res.json();
        setFormError(`Registration failed: ${err.detail || 'Invalid Configuration'}`);
      }
    } catch (err) {
      console.error('Directory register error', err);
      setFormError('Failed to register directory. Verify network link.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDirectory = async (sysId?: string) => {
    if (!sysId || !confirm('Are you sure you want to remove this searchable directory? files will not be deleted, only the index reference.')) return;
    
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/search/directories/${sysId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        showNotification('success', '✓ Search directory unregistered.');
        fetchDirectories();
      } else {
        const err = await res.json();
        showNotification('error', `Delete failed: ${err.detail || 'Access Denied'}`);
      }
    } catch (err) {
      console.error('Delete directory error', err);
      showNotification('error', 'Failed to delete directory reference.');
    }
  };

  const handleToggleDirectory = async (dir: SearchDirectory) => {
    if (!dir.sys_id) return;
    try {
      const res = await fetch(`${getApiHost(8090)}/api/system/search/directories/${dir.sys_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({
          active: dir.active === 1 ? 0 : 1,
          recursive: dir.recursive,
          name: dir.name,
          path: dir.path,
          file_extensions: dir.file_extensions
        })
      });
      if (res.ok) {
        fetchDirectories();
      } else {
        const err = await res.json();
        showNotification('error', `Toggle failed: ${err.detail || 'Access Denied'}`);
      }
    } catch (err) {
      console.error('Toggle directory error', err);
    }
  };

  const handleExport = () => {
    if (!selectedResult) return;
    const blob = new Blob([docContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', selectedResult.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#04060c]/80 backdrop-blur-md p-4 md:p-6 animate-fade-in font-sans">
      
      {/* Premium Glassmorphic Split-Pane Container */}
      <div className="w-full max-w-7xl h-[90vh] bg-[#0A0D14]/90 border border-[#38bdf8]/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-cyan-950/40 select-none">
        
        {/* Top Header System Bar */}
        <div className="px-6 py-4 border-b border-[#38bdf8]/20 flex justify-between items-center bg-[#07090F] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-white uppercase font-black tracking-widest text-base flex items-center gap-2">
                Sovereign Global Search <span className="text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">CLI TETHER</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Enterprise Directory Crawler & Real-time Playbook Workspace</p>
            </div>
          </div>

          {/* Tab Selection Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40 text-[10px] font-mono uppercase tracking-widest">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeTab === 'search' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Search Workspace
              </button>
              <button
                onClick={() => setActiveTab('directories')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeTab === 'directories' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" /> Scope Directories
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className={`px-6 py-2.5 text-xs font-mono border-b flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Main Workspace Body Content */}
        <div className="flex-1 flex min-h-0 bg-[#06080e]">
          
          {/* TAB 1: SEARCH WORKSPACE */}
          {activeTab === 'search' && (
            <>
              {/* Left Sidebar: Results Catalog */}
              <div className="w-96 border-r border-[#38bdf8]/10 flex flex-col bg-[#080b11] shrink-0">
                
                {/* Search Bar Input */}
                <div className="p-4 border-b border-[#38bdf8]/10 bg-cyan-950/5">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-cyan-500/50" />
                    <input
                      type="text"
                      placeholder="Search files by name or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#04060a] border border-[#38bdf8]/20 focus:border-[#38bdf8]/50 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                      autoFocus
                    />
                    {searching ? (
                      <Loader2 className="w-3.5 h-3.5 absolute right-3 top-3.5 animate-spin text-cyan-400" />
                    ) : searchQuery && (
                      <button 
                        onClick={() => { setSearchQuery(''); setResults([]); }}
                        className="w-5 h-5 absolute right-3 top-2.5 rounded-full hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 font-mono text-[9px] text-slate-500">
                    <span>INDEX SCOPE: {directories.filter(d => d.active).length} ACTIVE FOLDERS</span>
                    {results.length > 0 && <span className="text-cyan-400 font-bold">{results.length} HITS FOUND</span>}
                  </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar select-none">
                  {results.map((res, index) => (
                    <button
                      key={`${res.path}-${index}`}
                      onClick={() => fetchFileContent(res)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        selectedResult?.path === res.path 
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                          : 'bg-white/5 border-white/5 hover:border-cyan-500/30 text-white/70'
                      } ${loadingContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loadingContent}
                    >
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 mt-0.5 shrink-0 text-cyan-500/60" />
                        <div className="overflow-hidden w-full">
                          <div className="flex justify-between items-center w-full">
                            <h3 className="font-bold text-xs truncate text-white">{res.name}</h3>
                            <span className="text-[8px] font-mono text-slate-500 shrink-0 bg-slate-950 px-1 py-0.5 rounded">
                              {(res.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <p className="text-[8px] font-mono text-cyan-400/40 truncate mt-0.5">{res.path}</p>
                          
                          {/* File Content Matches */}
                          {res.matches && res.matches.length > 0 && (
                            <div className="mt-2 space-y-1 bg-black/40 p-2 rounded-lg border border-white/5">
                              {res.matches.slice(0, 2).map((match, mIdx) => (
                                <div key={mIdx} className="text-[9px] font-mono text-slate-400 flex gap-1.5 items-start">
                                  <span className="text-cyan-500/60 shrink-0">L{match.line_number}:</span>
                                  <span className="truncate italic">"{match.line_content.trim()}"</span>
                                </div>
                              ))}
                              {res.matches.length > 2 && (
                                <div className="text-[8px] text-slate-500 font-mono text-center pt-0.5 border-t border-white/5">
                                  + {res.matches.length - 2} more keyword matches
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Empty / Initial State */}
                  {results.length === 0 && !searching && (
                    <div className="h-[40vh] flex flex-col items-center justify-center p-6 text-center text-white/20 font-mono text-xs">
                      <Folder className="w-8 h-8 text-white/10 mb-3" />
                      {searchQuery.trim().length < 2 ? (
                        <>
                          <p className="font-bold text-white/40">Enter Search Criteria</p>
                          <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                            Type at least 2 characters to trigger the high-speed backend crawler.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-white/40">No Matches Discovered</p>
                          <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                            No files match the keyword "{searchQuery}" in your active directory scopes.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Split-Pane Document Editor / Viewer */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#05070a]">
                {selectedResult ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Document Panel Header */}
                    <div className="px-6 py-3 border-b border-white/10 flex justify-between items-center bg-[#07090E] shrink-0">
                      <div className="overflow-hidden">
                        <h2 className="text-sm font-bold text-white tracking-wide truncate flex items-center gap-2">
                          {selectedResult.name} 
                          <span className="text-[8px] font-mono text-slate-500 bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded">
                            {selectedResult.directory_name}
                          </span>
                        </h2>
                        <div className="text-[9px] font-mono text-cyan-400/50 truncate mt-0.5">
                          {selectedResult.path}
                        </div>
                      </div>
                      
                      {/* Document Control Actions */}
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {!isEditing ? (
                          <>
                            <button 
                              onClick={handleExport}
                              className="flex items-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/50 px-2.5 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                              <Download className="w-3.5 h-3.5" /> Export File
                            </button>
                            <button 
                              onClick={() => { setEditContent(docContent); setIsEditing(true); }}
                              className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/50 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Modify Document
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Editor View Modes Selector */}
                            <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40 mr-2 text-[9px] font-mono uppercase tracking-wider">
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
                              onClick={() => { if (confirm('Discard unsaved modifications?')) setIsEditing(false); }}
                              disabled={saving}
                              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg border border-white/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                            <button 
                              onClick={handleSaveFile}
                              disabled={saving}
                              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content Editor Split View */}
                    <div className="flex-1 flex overflow-hidden">
                      
                      {/* Markdown Text Area Editor */}
                      {isEditing && (viewMode === 'split' || viewMode === 'raw') && (
                        <div className="flex-1 border-r border-white/5 bg-[#030508] p-5 flex flex-col h-full">
                          <textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Write your file content or markdown documentation..."
                            className="flex-1 w-full bg-transparent resize-none text-white/90 font-mono text-xs focus:outline-none leading-relaxed p-2 no-scrollbar"
                          />
                        </div>
                      )}

                      {/* Markdown Preview Panel */}
                      {(!isEditing || viewMode === 'preview' || viewMode === 'split') && (
                        <div className="flex-1 overflow-y-auto no-scrollbar p-8 h-full bg-[#05070a] select-text">
                          <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-display prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkGithubAlerts]}>
                              {isEditing ? editContent : docContent}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20 font-mono text-xs p-6 text-center">
                    {loadingContent ? (
                      <>
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                        <p className="text-cyan-100">Fetching document contents from node...</p>
                      </>
                    ) : (
                      <>
                        <FileText className="w-10 h-10 text-white/10 mb-3" />
                        <p className="font-bold text-white/40">No Document Selected</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                          Click on a file result from the left catalog to view or modify its contents.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: DIRECTORIES CONFIGURATION */}
          {activeTab === 'directories' && (
            <div className="flex-1 flex flex-col md:flex-row min-h-0 select-text p-6 gap-6 overflow-y-auto no-scrollbar">
              
              {/* Left Column: Register New Directory Form */}
              <div className="w-full md:w-96 shrink-0 flex flex-col gap-4 bg-[#080b11] border border-[#38bdf8]/20 p-5 rounded-xl">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-cyan-400" /> Index Scope Registry
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Include a local filesystem folder to global search indexing.</p>
                </div>

                {formError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-mono text-red-400 flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                
                {formSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddDirectory} className="space-y-4 text-xs select-none">
                  {/* Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Directory Label</label>
                    <input 
                      type="text"
                      placeholder="e.g. Sovereign Docs, Personal Inbox"
                      value={newDirName}
                      onChange={(e) => setNewDirName(e.target.value)}
                      className="bg-black/60 border border-slate-850 text-white p-2.5 rounded-lg outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  {/* Path Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Absolute Filesystem Path</label>
                    <input 
                      type="text"
                      placeholder="/home/james/SovereignOS/dna/docs"
                      value={newDirPath}
                      onChange={(e) => setNewDirPath(e.target.value)}
                      className="bg-black/60 border border-slate-850 text-white p-2.5 rounded-lg outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  {/* Extensions Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Filter File Extensions (Comma-separated)</label>
                    <input 
                      type="text"
                      placeholder=".md,.txt,.json"
                      value={newDirExtensions}
                      onChange={(e) => setNewDirExtensions(e.target.value)}
                      className="bg-black/60 border border-slate-850 text-white p-2.5 rounded-lg outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  {/* Recursion Input */}
                  <div className="flex items-center gap-2.5 bg-black/30 p-2.5 rounded-lg border border-white/5">
                    <input 
                      type="checkbox"
                      id="dir-recursive"
                      checked={newDirRecursive}
                      onChange={(e) => setNewDirRecursive(e.target.checked)}
                      className="accent-cyan-500 rounded w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="dir-recursive" className="text-[11px] text-slate-300 uppercase tracking-wide cursor-pointer font-mono">
                      Deep Recursion Scan
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest transition-colors rounded-lg flex items-center justify-center gap-1.5 shadow-[0_3px_10px_rgba(6,182,212,0.2)]"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Register Directory Scope
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Directories List */}
              <div className="flex-1 flex flex-col gap-4 bg-[#080b11]/60 border border-white/5 p-5 rounded-xl">
                <div className="border-b border-white/5 pb-2 flex justify-between items-center select-none">
                  <div>
                    <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                      <Folder className="w-4 h-4 text-cyan-400" /> Active Directory Scopes
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Manage active crawl boundaries and security scoping filters.</p>
                  </div>
                  <button 
                    onClick={fetchDirectories}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDirs ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar select-none">
                  {directories.map((dir) => (
                    <div 
                      key={dir.sys_id}
                      className={`p-4 rounded-xl border flex justify-between items-start transition-colors ${
                        dir.active === 1 
                          ? 'bg-cyan-950/10 border-cyan-500/25 text-white' 
                          : 'bg-white/5 border-white/5 text-white/50'
                      }`}
                    >
                      <div className="overflow-hidden pr-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm tracking-wide text-white">{dir.name}</span>
                          {dir.recursive === 1 ? (
                            <span className="text-[8px] font-mono bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 rounded">DEEP CRAWL</span>
                          ) : (
                            <span className="text-[8px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded">SHALLOW</span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-cyan-400/60 truncate">{dir.path}</p>
                        <p className="text-[9px] font-mono text-slate-500">Filters: {dir.file_extensions || '* (All files)'}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleDirectory(dir)}
                          className={`px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-widest border transition-colors ${
                            dir.active === 1
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          {dir.active === 1 ? '✓ Active' : '✗ Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteDirectory(dir.sys_id)}
                          className="w-7 h-7 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 hover:border-red-500/50 rounded-lg flex items-center justify-center text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {directories.length === 0 && !loadingDirs && (
                    <div className="h-[40vh] flex flex-col items-center justify-center p-6 text-center text-white/20 font-mono text-xs">
                      <Folder className="w-8 h-8 text-white/10 mb-2" />
                      <p className="font-bold text-white/40">No search scopes configured</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                        Use the registration panel on the left to include searchable directories.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
