import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle, XCircle, File as FileIcon, 
  Image as ImageIcon, Loader2, Mic, Square, ChevronUp, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalDropZone() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'file' | 'voice'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  interface UploadTask {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    errorMsg?: string;
    type?: string;
  }
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Monitor drag/drop events globally on the window
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsOpen(true);
        setIsDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only set dragging false if we leave the window boundary
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (mode === 'file') setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (mode === 'file' && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `VoiceTicket_${Date.now()}.webm`, { type: 'audio/webm' });
        processFiles([file]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone access is required to record voice tickets.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processFiles = async (files: File[]) => {
    setUploading(true);
    setResultMessage(null);

    const initialTasks: UploadTask[] = files.map((file, idx) => ({
      id: `${file.name}-${idx}-${Date.now()}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
      type: file.type
    }));
    setUploadTasks(initialTasks);

    const uploadNext = (currentIndex: number, currentTasksList: UploadTask[]) => {
      if (currentIndex >= files.length) {
        setUploading(false);
        const hasError = currentTasksList.some(t => t.status === 'error');
        const successCount = currentTasksList.filter(t => t.status === 'success').length;
        setResultMessage({
          type: hasError ? 'error' : 'success',
          text: hasError 
            ? `Ingestion complete. ${successCount}/${files.length} assets synced successfully.` 
            : `All ${files.length} assets synced successfully to Node .73.`
        });
        return;
      }

      setActiveTaskIndex(currentIndex);
      setUploadTasks(prev => prev.map((t, idx) => idx === currentIndex ? { ...t, status: 'uploading' } : t));

      const file = files[currentIndex];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/system/dropzone/upload', true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadTasks(prev => prev.map((t, idx) => idx === currentIndex ? { ...t, progress: percentComplete } : t));
          }
        };

        xhr.onload = () => {
          let success = false;
          let msg = 'Upload failed.';
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.status === 'success') {
                success = true;
                msg = response.message || 'Asset processed successfully.';
              } else {
                msg = response.message || 'Upload failed.';
              }
            } catch (err) {
              success = true;
              msg = 'Asset processed successfully.';
            }
          } else {
            msg = `Upload failed (HTTP ${xhr.status}).`;
          }

          const targetStatus: 'success' | 'error' = success ? 'success' : 'error';
          const nextTasksList = currentTasksList.map((t, idx) => 
            idx === currentIndex ? { ...t, status: targetStatus, progress: 100, errorMsg: success ? undefined : msg } : t
          );
          
          setUploadTasks(nextTasksList);
          uploadNext(currentIndex + 1, nextTasksList);
        };

        xhr.onerror = () => {
          const nextTasksList = currentTasksList.map((t, idx) => 
            idx === currentIndex ? { ...t, status: 'error' as const, errorMsg: 'Network connection failure.' } : t
          );
          setUploadTasks(nextTasksList);
          uploadNext(currentIndex + 1, nextTasksList);
        };

        xhr.send(formData);
      } catch (err) {
        const nextTasksList = currentTasksList.map((t, idx) => 
          idx === currentIndex ? { ...t, status: 'error' as const, errorMsg: 'Local processing error.' } : t
        );
        setUploadTasks(nextTasksList);
        uploadNext(currentIndex + 1, nextTasksList);
      }
    };

    uploadNext(0, initialTasks);
  };

  const resetUploader = () => {
    setUploadTasks([]);
    setActiveTaskIndex(-1);
    setResultMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xl border-t-2 border-[#00d4ff]/40 shadow-[0_-8px_30px_rgba(0,212,255,0.15)] text-white transition-all duration-300 ease-in-out"
      style={{ height: isOpen ? '220px' : '40px' }}
    >
      {/* Drawer Header / Toggle Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-[40px] px-6 flex items-center justify-between cursor-pointer border-b border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#00d4ff] uppercase">
            [ PIXEL DROP ZONE ]
          </span>
          <span className="font-mono text-[9px] text-white/30 hidden md:inline tracking-wider">
            STAGING MATRIX // NODE .73
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          {uploadTasks.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-white/80">
              {uploadTasks.filter(t => t.status === 'success').length} / {uploadTasks.length} Done
            </span>
          )}
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Expanded Area */}
      {isOpen && (
        <div className="flex-1 h-[180px] p-4 flex gap-4 overflow-hidden relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
            multiple
          />

          {/* Column 1: Mode Switcher */}
          <div className="w-[150px] flex flex-col gap-2 border-r border-white/5 pr-4 shrink-0">
            <button
              onClick={() => { setMode('file'); resetUploader(); }}
              className={`w-full py-2 px-3 rounded-lg text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 border ${
                mode === 'file' 
                  ? 'bg-[#00d4ff]/10 border-[#00d4ff] text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.2)]' 
                  : 'bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              File Drop
            </button>
            <button
              onClick={() => { setMode('voice'); resetUploader(); }}
              className={`w-full py-2 px-3 rounded-lg text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-200 border ${
                mode === 'voice' 
                  ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                  : 'bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              Voice Ticket
            </button>
            
            {(uploadTasks.length > 0 || resultMessage) && (
              <button
                onClick={resetUploader}
                className="w-full mt-auto py-1.5 px-3 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono uppercase tracking-widest text-white/80 transition-colors"
              >
                Clear Queue
              </button>
            )}
          </div>

          {/* Column 2: Drag/Drop / Interaction Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              {/* Idle File Drop */}
              {mode === 'file' && !uploading && !resultMessage && (
                <motion.div 
                  key="file_idle"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-[#00d4ff] bg-[#00d4ff]/10 shadow-[inset_0_0_20px_rgba(0,212,255,0.15)]' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00d4ff]/50'
                  }`}
                >
                  <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-[#00d4ff]' : 'text-white/40'}`} />
                  <span className="text-xs font-bold text-white mb-1">Drag & Drop Files Here</span>
                  <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">or click to browse local storage</span>
                </motion.div>
              )}

              {/* Idle Voice Ticket */}
              {mode === 'voice' && !uploading && !resultMessage && (
                <motion.div 
                  key="voice_idle"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center p-3"
                >
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      isRecording 
                        ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105' 
                        : 'bg-purple-500/10 border border-purple-500/30 hover:scale-105'
                    }`}
                  >
                    {isRecording ? <Square className="w-5 h-5 text-red-500 fill-red-500" /> : <Mic className="w-6 h-6 text-purple-400" />}
                  </button>
                  <span className="text-[11px] font-bold text-white">
                    {isRecording ? 'Recording Soundscape...' : 'Tap Mic to Submit Voice Ticket'}
                  </span>
                  <span className="font-mono text-[8px] text-white/30 uppercase tracking-widest mt-1">
                    {isRecording ? 'Click stop button to compile & sync' : 'Auto-stages in local Dead Drop directory'}
                  </span>
                </motion.div>
              )}

              {/* Uploading Queue View */}
              {uploading && (
                <motion.div 
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-center"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 text-[#00d4ff] animate-spin" />
                    <span className="text-xs font-mono text-[#00d4ff] uppercase tracking-wider">
                      Staging {uploadTasks.length} Assets...
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#00d4ff] to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${
                          activeTaskIndex >= 0 
                            ? ((activeTaskIndex + (uploadTasks[activeTaskIndex]?.progress || 0) / 100) / uploadTasks.length) * 100 
                            : 0
                        }%` 
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Ingestion Results view */}
              {resultMessage && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col justify-center items-center text-center p-2"
                >
                  {resultMessage.type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400 mb-2" />
                  )}
                  <span className={`text-xs font-bold ${resultMessage.type === 'success' ? 'text-white' : 'text-red-400'}`}>
                    {resultMessage.type === 'success' ? 'Ingest Succeeded' : 'Ingest Failures Detected'}
                  </span>
                  <p className="font-mono text-[9px] text-white/50 tracking-wider mt-1 px-4 max-w-[400px] truncate">
                    {resultMessage.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Column 3: Scrollable Queue List */}
          {uploadTasks.length > 0 && (
            <div className="w-[220px] flex flex-col gap-1.5 border-l border-white/5 pl-4 overflow-y-auto shrink-0 pr-1 select-none">
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 mb-0.5">
                Staging Inventory
              </span>
              {uploadTasks.map((task, idx) => {
                const isCurrent = idx === activeTaskIndex;
                const isImage = task.type?.startsWith('image/');
                return (
                  <div 
                    key={task.id} 
                    className={`flex flex-col p-1.5 rounded border transition-all duration-200 ${
                      isCurrent 
                        ? 'bg-[#00d4ff]/5 border-[#00d4ff]/30 shadow-[0_0_8px_rgba(0,212,255,0.05)]' 
                        : 'bg-black/20 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <div className="flex items-center gap-1.5 truncate">
                        {isImage ? (
                          <ImageIcon className="w-3 h-3 text-[#00d4ff] shrink-0" />
                        ) : (
                          <FileIcon className="w-3 h-3 text-purple-400 shrink-0" />
                        )}
                        <span className="font-mono text-[10px] text-white/80 truncate max-w-[120px]" title={task.name}>
                          {task.name}
                        </span>
                      </div>
                      <span className="font-mono text-[8px] text-white/40 shrink-0">
                        {task.status === 'success' && 'OK'}
                        {task.status === 'error' && 'FAIL'}
                        {task.status === 'uploading' && `${task.progress}%`}
                        {task.status === 'pending' && 'WAIT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
