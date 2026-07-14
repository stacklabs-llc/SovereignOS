import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, Calendar, Tag, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkGithubAlerts from "remark-github-alerts";

export interface KBArticle {
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

interface ReleaseSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: KBArticle[];
}

export default function ReleaseSpotlightModal({ isOpen, onClose, articles }: ReleaseSpotlightModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  const handleNext = () => {
    if (currentIndex < articles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      
      {/* Modal Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl max-w-3xl w-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden relative backdrop-blur-xl max-h-[85vh]">
        
        {/* Header Accents */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/20 via-cyan-500 to-cyan-500/20"></div>
        <div className="absolute top-[2px] left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-slate-950 font-mono text-[9px] font-bold tracking-widest uppercase rounded-b-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1">
          <Sparkles size={10} className="animate-pulse" />
          Sovereign Spotlight Release
        </div>

        {/* Top Control Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] font-bold font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
              {currentArticle.number}
            </span>
            <span className="text-[10px] text-slate-500 font-mono ml-3">
              Updated: {new Date(currentArticle.sys_updated_on).toLocaleDateString()}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800/60 p-1.5 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin select-text">
          
          {/* Abstract Summary callout */}
          <div className="bg-cyan-950/15 border border-cyan-500/20 p-4 rounded-xl flex gap-3 text-cyan-200/90 text-xs leading-relaxed font-sans">
            <FileText size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono font-bold text-cyan-400 uppercase tracking-widest text-[9px] mb-1">Feature Abstract</div>
              {currentArticle.short_description}
            </div>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-mono prose-headings:font-bold prose-p:text-slate-300 prose-p:leading-relaxed prose-code:text-cyan-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkGithubAlerts]}>
              {currentArticle.text || ""}
            </ReactMarkdown>
          </div>

        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between shrink-0">
          
          {/* Pagination Counter */}
          <div className="text-slate-500 font-mono text-xs">
            UPDATE <span className="text-cyan-400 font-bold">{currentIndex + 1}</span> OF <span className="text-slate-300">{articles.length}</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {articles.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`p-2 rounded-lg border font-mono text-xs transition-all flex items-center gap-1 ${
                    currentIndex === 0
                      ? "border-slate-900 text-slate-700 cursor-not-allowed"
                      : "border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 bg-slate-900/40"
                  }`}
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === articles.length - 1}
                  className={`p-2 rounded-lg border font-mono text-xs transition-all flex items-center gap-1 ${
                    currentIndex === articles.length - 1
                      ? "border-slate-900 text-slate-700 cursor-not-allowed"
                      : "border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 bg-slate-900/40"
                  }`}
                >
                  Next <ChevronRight size={14} />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2 px-4 rounded-lg uppercase tracking-wider text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)] ml-2"
            >
              Acknowledge & Close
            </button>
          </div>

        </div>

      </div>
      
    </div>
  );
}
