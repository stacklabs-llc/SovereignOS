import React, { useState, useEffect } from 'react';
import { Target, Download, Link as LinkIcon, CheckCircle2, AlertCircle, RefreshCcw, FileText, Trash2, Eye, X, Copy, Play, Zap } from 'lucide-react';

export default function StreamSniperConsole() {
  const [url, setUrl] = useState('');
  const [includeComments, setIncludeComments] = useState(true);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'complete' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<{file?: string, filename?: string, error?: string, progress?: number} | null>(null);
  
  const [transcribeStatus, setTranscribeStatus] = useState<'idle' | 'transcribing' | 'complete' | 'error'>('idle');
  const [transcribeJobId, setTranscribeJobId] = useState<string | null>(null);
  const [transcriptResult, setTranscriptResult] = useState<{file?: string, filename?: string, error?: string} | null>(null);

  const [summarizeStatus, setSummarizeStatus] = useState<'idle' | 'summarizing' | 'complete' | 'error'>('idle');
  const [summarizeJobId, setSummarizeJobId] = useState<string | null>(null);
  const [summarizeModel, setSummarizeModel] = useState<'gemini' | 'llama3'>('gemini');

  const [history, setHistory] = useState<{filename: string, size: number, mtime: number}[]>([]);
  const [activeJobs, setActiveJobs] = useState<Record<string, any>>({});
  
  const [viewFileName, setViewFileName] = useState<string | null>(null);
  const [viewFileContent, setViewFileContent] = useState<string | null>(null);
  const [viewMediaFilename, setViewMediaFilename] = useState<string | null>(null);

  const handleFormatComments = async (filename: string) => {
      try {
          const res = await fetch(`/api/format_comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filepath: filename })
          });
          const data = await res.json();
          if (data.error) {
              alert("Comment formatting failed: " + data.error);
          } else {
              fetchHistory();
              handleViewTranscript(data.filename);
          }
      } catch (e) {
          alert("Comment formatting failed: Network error");
      }
  };

  const handleTranscribeHistory = async (filename: string) => {
      setTranscribeStatus('transcribing');
      setTranscriptResult(null);
      setTranscribeJobId(null);
      
      try {
          const res = await fetch(`/api/transcribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filepath: filename })
          });
          const data = await res.json();
          if (data.error) {
              setTranscribeStatus('error');
              setTranscriptResult(data);
          } else {
              setTranscribeJobId(data.job_id);
          }
      } catch (e) {
          setTranscribeStatus('error');
          setTranscriptResult({ error: 'Network error' });
      }
  };

  const handleSummarizeHistory = async (filename: string) => {
      setSummarizeStatus('summarizing');
      setSummarizeJobId(null);
      
      try {
          const res = await fetch(`/api/summarize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filepath: filename, model: summarizeModel })
          });
          const data = await res.json();
          if (data.error) {
              setSummarizeStatus('error');
              alert("Summarize failed: " + data.error);
          } else {
              setSummarizeJobId(data.job_id);
          }
      } catch (e) {
          setSummarizeStatus('error');
          alert("Summarize failed: Network error");
      }
  };

  const handleViewTranscript = async (filename: string) => {
      try {
          const res = await fetch(`/api/snipe/read/${encodeURIComponent(filename)}`);
          if (res.ok) {
              const data = await res.json();
              setViewFileName(filename);
              setViewFileContent(data.content);
          } else {
              console.error("Failed to read file");
          }
      } catch (e) {
          console.error("Failed to fetch file content", e);
      }
  };
  
  const handleCopy = () => {
      if (viewFileContent) {
          navigator.clipboard.writeText(viewFileContent);
      }
  };

  const fetchHistory = async () => {
      try {
          const res = await fetch('/api/snipe/history');
          if (res.ok) {
              const data = await res.json();
              setHistory(data.files || []);
          }
      } catch (e) {
          console.error("Failed to fetch history", e);
      }
  };

  const fetchActiveJobs = async () => {
      try {
          const res = await fetch('/api/snipe/active_jobs');
          if (res.ok) {
              const data = await res.json();
              setActiveJobs(data);
              
              // Attempt to restore global preview state if idle
              for (const [jid, jobValue] of Object.entries(data)) {
                  const job = jobValue as any;
                  if (job.status === 'downloading' && status === 'idle' && job.url) {
                      setStatus('downloading');
                      setJobId(jid);
                      setUrl(job.url);
                  }
              }

              // Synchronize transcription state
              let activeTranscribing = false;
              for (const [jid, jobValue] of Object.entries(data)) {
                  const job = jobValue as any;
                  if (jid.startsWith('transcribe_')) {
                      if (job.status === 'transcribing') {
                          activeTranscribing = true;
                          if (transcribeStatus !== 'transcribing') {
                              setTranscribeStatus('transcribing');
                              setTranscribeJobId(jid);
                          }
                      } else if (job.status === 'complete' && transcribeStatus === 'transcribing') {
                          setTranscribeStatus('complete');
                          setTranscriptResult(job);
                      } else if (job.status === 'error' && transcribeStatus === 'transcribing') {
                          setTranscribeStatus('error');
                          setTranscriptResult(job);
                      }
                  }
              }
              if (!activeTranscribing && transcribeStatus === 'transcribing') {
                  setTranscribeStatus('idle');
              }
          }
      } catch (e) {
          console.error("Failed to fetch active jobs", e);
      }
  };

  const handleDelete = async (filename: string) => {
      try {
          const res = await fetch(`/api/snipe/history/${encodeURIComponent(filename)}`, { method: 'DELETE' });
          if (res.ok) {
              fetchHistory();
          }
      } catch (e) {
          console.error("Failed to delete", e);
      }
  };

  useEffect(() => {
      fetchHistory();
      fetchActiveJobs();
      const hInterval = setInterval(() => {
          fetchHistory();
          fetchActiveJobs();
      }, 5000);
      return () => clearInterval(hInterval);
  }, [status]);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (status === 'downloading' && jobId) {
          interval = setInterval(async () => {
              try {
                  const res = await fetch(`/api/snipe/${jobId}`);
                  const data = await res.json();
                  if (data.status === 'complete') {
                      setStatus('complete');
                      setResult(data);
                      clearInterval(interval);
                      
                      // Auto-trigger transcription once downloaded successfully!
                      if (data.file) {
                          setTranscribeStatus('transcribing');
                          setTranscriptResult(null);
                          setTranscribeJobId(null);
                          
                          try {
                              const transRes = await fetch(`/api/transcribe`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ filepath: data.file })
                              });
                              const transData = await transRes.json();
                              if (transData.error) {
                                  setTranscribeStatus('error');
                                  setTranscriptResult(transData);
                              } else {
                                  setTranscribeJobId(transData.job_id);
                              }
                          } catch (e) {
                              setTranscribeStatus('error');
                              setTranscriptResult({ error: 'Network error triggering auto-transcribe' });
                          }
                      }
                  } else if (data.status === 'error') {
                      setStatus('error');
                      setResult(data);
                      clearInterval(interval);
                  } else {
                      setResult(data);
                  }
              } catch (e) {
                  console.error(e);
              }
          }, 2000);
      }
      return () => clearInterval(interval);
  }, [status, jobId]);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (transcribeStatus === 'transcribing' && transcribeJobId) {
          interval = setInterval(async () => {
              try {
                  const res = await fetch(`/api/snipe/${transcribeJobId}`);
                  const data = await res.json();
                  if (data.status === 'complete') {
                      setTranscribeStatus('complete');
                      setTranscriptResult(data);
                      clearInterval(interval);
                      
                      // Auto-trigger Llama 3 summarization once transcription completes successfully!
                      if (data.file) {
                          setSummarizeStatus('summarizing');
                          setSummarizeJobId(null);
                          
                          try {
                              const sumRes = await fetch(`/api/summarize`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ filepath: data.file, model: summarizeModel })
                              });
                              const sumData = await sumRes.json();
                              if (sumData.error) {
                                  setSummarizeStatus('error');
                              } else {
                                  setSummarizeJobId(sumData.job_id);
                              }
                          } catch (e) {
                              setSummarizeStatus('error');
                          }
                      }
                  } else if (data.status === 'error') {
                      setTranscribeStatus('error');
                      setTranscriptResult(data);
                      clearInterval(interval);
                  }
              } catch (e) {
                  console.error(e);
              }
          }, 2000);
      }
      return () => clearInterval(interval);
  }, [transcribeStatus, transcribeJobId]);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (summarizeStatus === 'summarizing' && summarizeJobId) {
          interval = setInterval(async () => {
              try {
                  const res = await fetch(`/api/snipe/${summarizeJobId}`);
                  const data = await res.json();
                  if (data.status === 'complete') {
                      setSummarizeStatus('complete');
                      clearInterval(interval);
                      handleViewTranscript(data.filename);
                  } else if (data.status === 'error') {
                      setSummarizeStatus('error');
                      clearInterval(interval);
                      alert("Summarize failed: " + data.error);
                  }
              } catch (e) {
                  console.error(e);
              }
          }, 2000);
      }
      return () => clearInterval(interval);
  }, [summarizeStatus, summarizeJobId]);

  const handleSnipe = async () => {
      if (!url) return;
      setStatus('downloading');
      setResult(null);
      setJobId(null);
      
      try {
          const res = await fetch(`/api/snipe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, include_comments: includeComments })
          });
          const data = await res.json();
          if (data.error) {
              setStatus('error');
              setResult(data);
          } else {
              setJobId(data.job_id);
          }
      } catch (e) {
          setStatus('error');
          setResult({ error: 'Network error or Daemon offline' });
      }
  };

  const handleTranscribe = async () => {
      if (!result?.file) return;
      setTranscribeStatus('transcribing');
      setTranscriptResult(null);
      setTranscribeJobId(null);
      
      try {
          const res = await fetch(`/api/transcribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filepath: result.file })
          });
          const data = await res.json();
          if (data.error) {
              setTranscribeStatus('error');
              setTranscriptResult(data);
          } else {
              setTranscribeJobId(data.job_id);
          }
      } catch (e) {
          setTranscribeStatus('error');
          setTranscriptResult({ error: 'Network error' });
      }
  };

  return (
    <div className="h-[85vh] w-full flex flex-col p-6 bg-[#0B0E14] text-[#c5c6c7] font-['Segoe_UI',sans-serif] overflow-y-auto">
      
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="w-10 h-10 rounded bg-[#ff0033]/20 flex items-center justify-center border border-[#ff0033]/50 ">
          <Target className="w-6 h-6 text-[#ff0033]" />
        </div>
        <div>
          <h1 className="text-white uppercase font-black tracking-[0.15em] text-2xl drop-shadow-md">
            Stream Sniper
          </h1>
          <p className="text-[12px] text-[#8E9CAA] uppercase tracking-widest font-mono">
            Direct IP Extraction & Content Ingestion Pipeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-[#38bdf8]" /> Target Acquisition
                </h3>
                
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-[#8E9CAA] uppercase tracking-widest font-bold">Content URL (YouTube, Twitter, etc)</label>
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="bg-black/50 border border-white/10 rounded p-3 text-white font-mono text-xs focus:border-[#ff0033]  outline-none transition-all"
                    />
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-2 text-[#8E9CAA] font-mono text-[10px] uppercase tracking-widest hover:text-white transition-colors w-fit">
                    <input 
                        type="checkbox" 
                        checked={includeComments} 
                        onChange={(e) => setIncludeComments(e.target.checked)} 
                        className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#ff0033] focus:ring-[#ff0033]"
                    />
                    Include Chat/Comments Data
                </label>

                <div className="flex flex-col gap-2 mt-2">
                    <label className="text-[10px] text-[#8E9CAA] uppercase tracking-widest font-bold">TL;DR LLM Engine</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[#8E9CAA] font-mono text-[10px] uppercase hover:text-white transition-colors">
                            <input 
                                type="radio" 
                                name="summarizeModel"
                                value="gemini"
                                checked={summarizeModel === 'gemini'} 
                                onChange={() => setSummarizeModel('gemini')} 
                                className="w-3.5 h-3.5 border-white/20 bg-black/50 text-[#38bdf8] focus:ring-[#38bdf8]"
                            />
                            Vertex AI (Instant)
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[#8E9CAA] font-mono text-[10px] uppercase hover:text-white transition-colors">
                            <input 
                                type="radio" 
                                name="summarizeModel"
                                value="llama3"
                                checked={summarizeModel === 'llama3'} 
                                onChange={() => setSummarizeModel('llama3')} 
                                className="w-3.5 h-3.5 border-white/20 bg-black/50 text-[#f2a900] focus:ring-[#f2a900]"
                            />
                            Local Llama 3 (CPU)
                        </label>
                    </div>
                </div>

                <button 
                    onClick={handleSnipe}
                    disabled={status === 'downloading' || !url}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-[#ff0033] hover:bg-[#cc0000] disabled:bg-[#ff0033]/50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-widest rounded-md  transition-all border-none"
                >
                    {status === 'downloading' ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    {status === 'downloading' ? 'Extracting Payload...' : 'Initiate Snipe'}
                </button>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex-1 flex flex-col">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                    Console Telemetry
                </h3>
                <div className="flex-1 bg-black/50 border border-white/5 rounded p-4 font-mono text-[10px] text-[#38bdf8] overflow-y-auto space-y-2">
                    <p className="text-gray-500">&gt; SYSTEM INITIALIZED.</p>
                    <p className="text-gray-500">&gt; AWAITING TARGET URL.</p>
                    
                    {status === 'downloading' && (
                        <>
                            <p className="text-[#f2a900]">&gt; TARGET ACQUIRED: {url}</p>
                            <p className="text-[#f2a900] animate-pulse">&gt; ENGAGING yt-dlp INGESTION PIPELINE...</p>
                        </>
                    )}
                    
                    {status === 'complete' && result && (
                        <>
                            <p className="text-[#f2a900]">&gt; TARGET ACQUIRED: {url}</p>
                            <p className="text-[#f2a900]">&gt; PIPELINE COMPLETE.</p>
                            <p className="text-[#00ff00]">&gt; ASSET SECURED: {result.filename}</p>
                            <p className="text-[#00ff00]">&gt; SAVED TO: /media_vault/01_Ingest/</p>
                        </>
                    )}
                    
                    {status === 'error' && result && (
                        <>
                            <p className="text-[#ff0033]">&gt; SNIPE FAILED.</p>
                            <p className="text-[#ff0033] whitespace-pre-wrap">{result.error}</p>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Right Col: Video Preview */}
        <div className="lg:col-span-2 bg-[#111827] border border-white/10 rounded-xl shadow-lg flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-[#0B0E14]">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                     Asset Preview
                </h3>
                {status === 'complete' && (
                    <span className="flex items-center gap-1 text-[10px] text-[#00ff00] font-bold tracking-widest uppercase bg-[#00ff00]/10 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3 h-3" /> SECURED
                    </span>
                )}
            </div>
            <div className="flex-1 bg-black relative flex items-center justify-center p-4">
                {status === 'idle' && (
                    <div className="text-center text-[#8E9CAA] font-mono text-sm uppercase tracking-widest flex flex-col items-center gap-4 opacity-50">
                        <Download className="w-16 h-16 mb-2" />
                        No Asset Loaded
                    </div>
                )}
                
                {status === 'downloading' && (
                    <div className="w-full flex flex-col items-center justify-center gap-6 p-8 bg-black/40 rounded-xl border border-[#f2a900]/30 shadow-inner">
                        <div className="flex flex-col items-center gap-3 text-[#f2a900] font-bold text-sm uppercase tracking-widest text-center">
                            <RefreshCcw className="w-12 h-12 animate-spin mb-2" />
                            <p>Extracting Web Asset...</p>
                            <p className="text-[10px] text-[#8E9CAA] normal-case tracking-normal">Direct IP Tunnel Active</p>
                        </div>
                        
                        <div className="w-full max-w-md bg-white/5 rounded-full h-4 border border-white/10 overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                            <div 
                                className="h-full bg-gradient-to-r from-[#f2a900]/50 to-[#f2a900]  rounded-full transition-all duration-300" 
                                style={{ width: `${result?.progress || 0}%` }}
                            ></div>
                        </div>
                        
                        <div className="text-[#f2a900] font-mono text-2xl font-black tracking-widest drop-">
                            {(result?.progress || 0).toFixed(1)}%
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center text-[#ff0033] font-mono text-sm uppercase tracking-widest flex flex-col items-center gap-4">
                        <AlertCircle className="w-16 h-16" />
                        Extraction Failed
                    </div>
                )}
                
                {status === 'complete' && (
                    <div className="w-full h-full border border-[#00ff00]/30 rounded-lg overflow-hidden relative  flex items-center justify-center bg-[#0B0E14] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff00]/10 via-[#0B0E14] to-[#0B0E14]">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                             <div className="bg-black/60 border border-[#00ff00]/50 p-8 w-full max-w-md rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center">
                                 <div className="w-20 h-20 rounded-full bg-[#00ff00]/20 flex items-center justify-center mb-6  animate-[pulse_2s_ease-in-out_infinite]">
                                     <CheckCircle2 className="w-10 h-10 text-[#00ff00]" />
                                 </div>
                                 <h2 className="text-white font-black text-2xl uppercase tracking-[0.2em] mb-2 drop-">Video Ingested</h2>
                                 <p className="text-[#38bdf8] font-mono text-xs mb-8 break-all max-w-xs">{result?.filename}</p>
                                 
                                 {transcribeStatus === 'idle' && (
                                    <button 
                                        onClick={handleTranscribe}
                                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#00ff00]/20 hover:bg-[#00ff00]/40 border border-[#00ff00]/50 text-[#00ff00] font-bold text-sm uppercase tracking-widest rounded-xl transition-all  hover:scale-105"
                                    >
                                        <FileText className="w-5 h-5" /> Generate Transcript
                                    </button>
                                 )}
                                 
                                 {transcribeStatus === 'transcribing' && (
                                    <div className="w-full flex flex-col items-center gap-3 mt-4 bg-black/40 p-4 rounded-xl border border-[#f2a900]/30">
                                        <div className="flex items-center gap-2 text-[#f2a900] font-bold text-[10px] uppercase tracking-widest">
                                            <RefreshCcw className="w-4 h-4 animate-spin" /> Processing Audio...
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-[#f2a900] w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full"></div>
                                        </div>
                                    </div>
                                 )}
                                 
                                 {transcribeStatus === 'complete' && transcriptResult && (
                                    <a 
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); alert('Transcript saved: ' + transcriptResult.file); }}
                                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#38bdf8]/20 hover:bg-[#38bdf8]/40 border border-[#38bdf8]/50 text-[#38bdf8] font-bold text-sm uppercase tracking-widest rounded-xl transition-all  hover:scale-105"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> View Transcript
                                    </a>
                                 )}
                                 
                                 {transcribeStatus === 'error' && (
                                    <div className="text-[#ff0033] bg-[#ff0033]/10 p-3 rounded border border-[#ff0033]/30 font-bold text-[10px] uppercase tracking-widest mt-4 w-full">
                                        Transcript generation failed
                                    </div>
                                 )}
                                 
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Far Right Col: Media Vault History */}
        <div className="lg:col-span-1 bg-[#111827] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col min-h-0">
            <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#00ff00]" /> Media Vault
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-[#8E9CAA] text-xs font-mono uppercase text-center mt-10">No streams saved yet</div>
                ) : (
                    history.map((file, idx) => (
                        <div key={idx} className="bg-black/50 border border-white/5 p-3 rounded-lg flex flex-col gap-2 hover:border-[#38bdf8]/50 transition-colors group">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-[#38bdf8] font-mono text-xs break-words line-clamp-2 group-hover:text-white transition-colors flex-1">{file.filename}</span>
                                <div className="flex items-center gap-1">
                                    {(file.filename.endsWith('.md') || file.filename.endsWith('.json')) && (
                                        <>
                                            <button 
                                                onClick={() => handleViewTranscript(file.filename)}
                                                className="text-[#38bdf8]/50 hover:text-[#38bdf8] transition-colors p-1"
                                                title="View File"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            {file.filename.endsWith('.json') && (
                                                <button 
                                                    onClick={() => handleFormatComments(file.filename)}
                                                    className="text-[#00ff00]/50 hover:text-[#00ff00] transition-colors p-1"
                                                    title="Format Comments to Markdown"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {file.filename.endsWith('_transcript.md') && (() => {
                                        const isSummarizing = Object.values(activeJobs).some(j => j.status === 'summarizing' && j.filepath?.endsWith(file.filename));
                                        return (
                                            <button 
                                                onClick={() => handleSummarizeHistory(file.filename)}
                                                className="text-[#f2a900]/50 hover:text-[#f2a900] transition-colors p-1"
                                                title={isSummarizing ? "Summarizing..." : "Generate TL;DR (Vertex/Llama)"}
                                            >
                                                {isSummarizing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                            </button>
                                        );
                                    })()}
                                    {file.filename.endsWith('.mp4') && (() => {
                                        const isTranscribing = Object.values(activeJobs).some(j => j.status === 'transcribing' && j.filepath?.endsWith(file.filename));
                                        return (
                                            <>
                                                <button 
                                                    onClick={() => setViewMediaFilename(file.filename)}
                                                    className="text-[#ff0033]/50 hover:text-[#ff0033] transition-colors p-1"
                                                    title="Play Video"
                                                >
                                                    <Play className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => !isTranscribing && handleTranscribeHistory(file.filename)}
                                                    className="text-[#00ff00]/50 hover:text-[#00ff00] transition-colors p-1"
                                                    title={isTranscribing ? "Transcribing in background..." : "Generate Transcript on Node 183"}
                                                >
                                                    {isTranscribing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                                </button>
                                            </>
                                        );
                                    })()}
                                    <button 
                                        onClick={() => handleDelete(file.filename)}
                                        className="text-[#ff0033]/50 hover:text-[#ff0033] transition-colors p-1"
                                        title="Delete file"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[#8E9CAA] font-mono text-[9px] uppercase tracking-wider">
                                <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                <span>{new Date(file.mtime * 1000).toLocaleString([], {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
      
      {viewFileName && viewFileContent !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
              <div className="bg-[#111827] border border-[#38bdf8]/30 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col ">
                  <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                      <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4 text-[#38bdf8]" /> {viewFileName}
                      </h3>
                      <button onClick={() => {setViewFileName(null); setViewFileContent(null);}} className="text-white/50 hover:text-white p-1">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0a0d13]">
                      <pre className="text-[#c5c6c7] font-mono text-xs whitespace-pre-wrap">{viewFileContent}</pre>
                  </div>
                  <div className="p-4 border-t border-white/10 flex justify-end shrink-0">
                      <button onClick={handleCopy} className="flex items-center gap-2 py-2 px-4 bg-[#38bdf8]/20 hover:bg-[#38bdf8]/40 border border-[#38bdf8]/50 text-[#38bdf8] font-bold text-sm uppercase tracking-widest rounded transition-all">
                          <Copy className="w-4 h-4" /> Copy to Clipboard
                      </button>
                  </div>
              </div>
          </div>
      )}

      {viewMediaFilename && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
              <div className="bg-[#111827] border border-[#ff0033]/30 rounded-xl w-full max-w-5xl flex flex-col  overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-black/50">
                      <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                          <Play className="w-4 h-4 text-[#ff0033]" /> {viewMediaFilename}
                      </h3>
                      <button onClick={() => setViewMediaFilename(null)} className="text-white/50 hover:text-white p-1">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="w-full bg-black flex items-center justify-center relative aspect-video">
                      <video 
                          src={`/api/snipe/media/${encodeURIComponent(viewMediaFilename)}`} 
                          controls 
                          autoPlay 
                          className="w-full h-full outline-none"
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
