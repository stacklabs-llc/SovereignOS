import React, { useState, useEffect } from "react";
import { 
  BookOpen, Search, Plus, Edit3, Trash2, Tag, 
  Calendar, User, Save, X, RefreshCw, FileText, Globe
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';

interface KBArticle {
  sys_id: string;
  number: string;
  topic: string;
  short_description: string;
  text?: string;
  workflow_state: string;
  sys_created_on: string;
  sys_updated_on: string;
  u_source?: string;
  u_tags?: string;
}

export default function KnowledgeHub() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<KBArticle | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Editor States
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTopic, setEditTopic] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchArticles = async (selectId?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/kb");
      if (res.ok) {
        const data = await res.json();
        const list = data.kb_articles || [];
        setArticles(list);
        
        // Select an article if requested or if there's none active yet
        if (list.length > 0) {
          const targetId = selectId || list[0].sys_id;
          setActiveArticleId(targetId);
        } else {
          setActiveArticleId(null);
          setActiveArticle(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch KB articles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Fetch individual article detail when active article changes
  useEffect(() => {
    if (!activeArticleId) {
      setActiveArticle(null);
      return;
    }
    
    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/system/kb/${activeArticleId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveArticle(data);
          
          // Pre-populate editor values
          setEditTopic(data.topic || "");
          setEditShortDesc(data.short_description || "");
          setEditSource(data.u_source || "");
          setEditTags(data.u_tags || "");
          setEditContent(data.text || "");
        }
      } catch (err) {
        console.error(`Failed to load article detail for ${activeArticleId}`, err);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [activeArticleId]);

  const handleEditClick = () => {
    if (activeArticle) {
      setEditTopic(activeArticle.topic || "");
      setEditShortDesc(activeArticle.short_description || "");
      setEditSource(activeArticle.u_source || "");
      setEditTags(activeArticle.u_tags || "");
      setEditContent(activeArticle.text || "");
      setIsEditing(true);
      setIsCreating(false);
    }
  };

  const handleNewClick = () => {
    setEditTopic("");
    setEditShortDesc("");
    setEditSource("");
    setEditTags("");
    setEditContent("");
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editTopic.trim() || !editShortDesc.trim() || !editContent.trim()) {
      alert("Topic, Short Description, and Markdown Content are required fields.");
      return;
    }
    
    setSaving(true);
    try {
      const url = isCreating ? "/api/system/kb" : `/api/system/kb/${activeArticleId}`;
      const method = isCreating ? "POST" : "PUT";
      
      const payload = {
        topic: editTopic,
        short_description: editShortDesc,
        text: editContent,
        workflow_state: "published",
        u_source: editSource || null,
        u_tags: editTags || null
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setIsEditing(false);
        setIsCreating(false);
        // Refresh articles list and auto-select the saved one
        await fetchArticles(data.sys_id);
      } else {
        const errData = await res.json();
        alert(`Failed to save article: ${errData.detail || 'Unknown server error'}`);
      }
    } catch (err) {
      console.error("Save error", err);
      alert("Network error: Failed to save the knowledge base article.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeArticleId || !activeArticle) return;
    if (!window.confirm(`Are you sure you want to delete ${activeArticle.number}: ${activeArticle.topic}?`)) return;

    try {
      const res = await fetch(`/api/system/kb/${activeArticleId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchArticles();
      } else {
        alert("Failed to delete article.");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const filteredArticles = articles.filter(art => {
    const q = searchQuery.toLowerCase();
    return (
      art.topic.toLowerCase().includes(q) ||
      art.number.toLowerCase().includes(q) ||
      art.short_description.toLowerCase().includes(q) ||
      (art.u_tags && art.u_tags.toLowerCase().includes(q))
    );
  });

  return (
    <div className="h-full flex flex-col bg-slate-950/90 text-slate-200 font-mono p-6 border border-slate-800 rounded-xl relative overflow-hidden backdrop-blur-md">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4 z-10">
        <div>
          <h2 className="text-3xl font-bold tracking-widest text-[#E0BC68] drop-shadow-md flex items-center gap-2">
            <BookOpen className="text-cyan-400 w-8 h-8" />
            Sovereign Intelligence Gateway
          </h2>
          <p className="text-slate-500 font-sans text-xs uppercase tracking-widest mt-1">/now/knowledge-center/knowledge-hub</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchArticles(activeArticleId || undefined)} 
            disabled={loading}
            className="text-slate-400 hover:text-cyan-400 transition-colors p-2 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-cyan-500/30"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={handleNewClick}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2 px-4 rounded-lg uppercase tracking-wider text-xs transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Plus size={16} /> New Article
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 z-10 overflow-hidden min-h-0">
        
        {/* Left Side: Article List */}
        <div className="w-1/3 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Filter knowledge entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                <RefreshCw size={24} className="animate-spin text-cyan-400" />
                <span className="text-xs uppercase tracking-widest">Querying DB...</span>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-10 text-slate-600 text-xs">
                No matching knowledge articles found.
              </div>
            ) : (
              filteredArticles.map(art => {
                const isActive = activeArticleId === art.sys_id;
                return (
                  <button
                    key={art.sys_id}
                    onClick={() => {
                      if (!isEditing && !isCreating) {
                        setActiveArticleId(art.sys_id);
                      }
                    }}
                    disabled={isEditing || isCreating}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col relative overflow-hidden group ${
                      isActive 
                        ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)] text-white' 
                        : 'bg-slate-950/50 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                    } ${(isEditing || isCreating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-900 text-slate-500'
                      }`}>
                        {art.number}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(art.sys_updated_on).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-200 mb-1 group-hover:text-white transition-colors">{art.topic}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{art.short_description}</p>
                    
                    {art.u_tags && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {art.u_tags.split(',').map((tag, idx) => (
                          <span key={idx} className="text-[9px] bg-slate-900/80 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Tag size={8} className="text-cyan-500" />
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Article Details & Editor */}
        <div className="flex-1 bg-slate-900/20 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col backdrop-blur-sm relative">
          {isEditing || isCreating ? (
            /* EDITOR FORM */
            <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-[#E0BC68] uppercase tracking-wider">
                  {isCreating ? "Deploy New Knowledge Article" : `Edit Article: ${activeArticle?.number}`}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancel}
                    disabled={saving}
                    className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1 active:scale-95"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#E0BC68] hover:bg-[#cdaf5d] text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1 active:scale-95 shadow-[0_0_15px_rgba(224,188,104,0.2)]"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Article
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Topic / Title</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    placeholder="e.g. FanStack Background Scripts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Source / Author</label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    placeholder="e.g. system_operations"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Short Description</label>
                <textarea
                  value={editShortDesc}
                  onChange={(e) => setEditShortDesc(e.target.value)}
                  placeholder="Provide a brief, single-sentence summary of the document purpose."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 h-16 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Tags (Comma-Separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g. fanstack, runbook, hibernation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1 flex-1 flex flex-col min-h-[250px]">
                <label className="block text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Markdown Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="# Runbook title..."
                  className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                />
              </div>
            </div>
          ) : loadingDetail ? (
            /* DETAIL LOADING STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
              <RefreshCw size={32} className="animate-spin text-cyan-400" />
              <span className="text-xs uppercase tracking-widest">Accessing secure files...</span>
            </div>
          ) : activeArticle ? (
            /* ARTICLE DETAILS READER */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-800/60 bg-slate-900/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-lg">
                    {activeArticle.number}
                  </span>
                  {activeArticle.u_source && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
                      <Globe size={12} className="text-slate-600" />
                      {activeArticle.u_source}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleEditClick}
                    className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1.5 hover:border-cyan-500/30 hover:text-cyan-400 cursor-pointer active:scale-95"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="bg-slate-950 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              {/* Reader Container */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Article Title */}
                  <div className="border-b border-slate-800/80 pb-6">
                    <h1 className="text-3xl font-bold text-white tracking-wide leading-tight mb-3">
                      {activeArticle.topic}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Created: {new Date(activeArticle.sys_created_on).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Updated: {new Date(activeArticle.sys_updated_on).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Summary Callout */}
                  <div className="bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-xl flex gap-3 text-cyan-100/90 text-xs leading-relaxed">
                    <FileText size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-cyan-300 uppercase tracking-widest text-[9px] mb-1">Abstract Summary</div>
                      {activeArticle.short_description}
                    </div>
                  </div>

                  {/* Markdown Content */}
                  <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-mono prose-headings:font-bold prose-p:text-slate-300 prose-p:leading-relaxed prose-code:text-cyan-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkGithubAlerts]}>
                      {activeArticle.text || ""}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INITIAL EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <BookOpen className="w-16 h-16 text-slate-800 mb-4 animate-pulse" />
              <h3 className="text-white font-bold text-base uppercase tracking-wider mb-2">Knowledge Gateway</h3>
              <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
                Select an article from the index, or click <span className="text-cyan-400 font-bold">New Article</span> to document system operations, runbooks, or playcall guidelines.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </div>
  );
}
