import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, XCircle, File as FileIcon, Image as ImageIcon, Loader2, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PixelDropZone() {
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
      
      // Update state to mark current file as uploading
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
    <div className="flex-1 bg-[#0B0E14] text-white p-6 md:p-12 min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38bdf8]/30 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#38bdf8]/5 via-[#0B0E14] to-[#0B0E14] pointer-events-none"></div>
      
      <div className="max-w-3xl w-full mx-auto flex flex-col h-full z-10">
        <header className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold tracking-[0.2em] text-[#38bdf8] uppercase drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            Pixel Drop Zone
          </h1>
          <p className="font-mono text-xs text-white/50 tracking-[0.3em] mt-3 uppercase">
            Secure Asset Ingestion // Node .73
          </p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-black/40 border border-white/10 rounded-full p-1 flex gap-1 shadow-lg">
            <button 
              onClick={() => { setMode('file'); resetUploader(); }}
              className={`px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest uppercase transition-colors ${mode === 'file' ? 'bg-[#38bdf8] text-black shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              File Drop
            </button>
            <button 
              onClick={() => { setMode('voice'); resetUploader(); }}
              className={`px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest uppercase transition-colors ${mode === 'voice' ? 'bg-[#e879f9] text-black shadow-[0_0_15px_rgba(232,121,249,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              Voice Ticket
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div 
            onClick={() => mode === 'file' && !uploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full max-w-md aspect-square md:aspect-video rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 backdrop-blur-xl relative overflow-hidden group
              ${mode === 'file' && !uploading ? 'cursor-pointer' : ''}
              ${isDragging 
                ? 'border-[#38bdf8] bg-[#38bdf8]/10 shadow-[0_0_30px_rgba(56,189,248,0.2)]' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
              }
              ${mode === 'file' && !isDragging ? 'hover:border-[#38bdf8]/50' : ''}
              ${uploading ? 'pointer-events-none' : ''}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect}
              multiple
            />

            <AnimatePresence mode="wait">
              {mode === 'file' && !uploading && !resultMessage && (
                <motion.div 
                  key="file_idle"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                    <UploadCloud className="w-10 h-10 text-[#38bdf8]" />
                  </div>
                  <h3 className="font-sans text-xl font-bold text-white mb-2 tracking-wide">Tap or Drop Asset(s)</h3>
                  <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Images → Hailo NPU<br/>Media/Archives → Dead Drop</p>
                </motion.div>
              )}

              {mode === 'voice' && !uploading && !resultMessage && (
                <motion.div 
                  key="voice_idle"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-center"
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      isRecording ? stopRecording() : startRecording();
                    }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-lg cursor-pointer
                      ${isRecording 
                        ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110' 
                        : 'bg-[#e879f9]/10 border border-[#e879f9]/30 hover:scale-105 hover:shadow-[0_0_20px_rgba(232,121,249,0.3)]'}
                    `}
                  >
                    {isRecording ? <Square className="w-10 h-10 text-red-500 fill-red-500" /> : <Mic className="w-12 h-12 text-[#e879f9]" />}
                  </div>
                  <h3 className="font-sans text-xl font-bold text-white mb-2 tracking-wide">
                    {isRecording ? 'Recording...' : 'Tap to Record Ticket'}
                  </h3>
                  <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                    {isRecording ? 'Tap square to stop and upload' : 'Voice will be transcribed and submitted'}
                  </p>
                  
                  {isRecording && (
                    <div className="mt-4 flex gap-1 items-center justify-center h-4">
                       <span className="w-1 h-full bg-red-500 animate-pulse delay-75"></span>
                       <span className="w-1 h-3/4 bg-red-500 animate-pulse delay-150"></span>
                       <span className="w-1 h-full bg-red-500 animate-pulse delay-300"></span>
                       <span className="w-1 h-1/2 bg-red-500 animate-pulse delay-75"></span>
                       <span className="w-1 h-full bg-red-500 animate-pulse delay-150"></span>
                    </div>
                  )}
                </motion.div>
              )}

              {uploading && (
                <motion.div 
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col w-full max-h-[350px] overflow-y-auto px-2"
                >
                  <div className="flex flex-col items-center mb-6">
                    <Loader2 className="w-12 h-12 text-[#38bdf8] animate-spin mb-4" />
                    <h3 className="font-mono text-sm text-[#38bdf8] tracking-widest uppercase">
                      Ingesting {uploadTasks.length} Assets...
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                    {uploadTasks.map((task, idx) => {
                      const isCurrent = idx === activeTaskIndex;
                      const isImage = task.type?.startsWith('image/');
                      return (
                        <div key={task.id} className={`flex flex-col p-3 rounded-xl border transition-all duration-300 ${isCurrent ? 'bg-[#38bdf8]/5 border-[#38bdf8]/30 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'bg-black/30 border-white/5 opacity-60'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 truncate">
                              {isImage ? <ImageIcon className="w-4 h-4 text-white/40" /> : <FileIcon className="w-4 h-4 text-white/40" />}
                              <span className="font-mono text-xs text-white/80 truncate max-w-[200px]">{task.name}</span>
                            </div>
                            <span className="font-mono text-[9px] text-white/40">
                              {task.status === 'success' && 'COMPLETE'}
                              {task.status === 'error' && 'FAILED'}
                              {task.status === 'uploading' && `${task.progress}%`}
                              {task.status === 'pending' && 'QUEUED'}
                            </span>
                          </div>
                          {task.status === 'uploading' && (
                            <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-[#38bdf8] to-[#e879f9]"
                                initial={{ width: 0 }}
                                animate={{ width: `${task.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {resultMessage && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center w-full max-h-[400px] overflow-y-auto px-2"
                >
                  {resultMessage.type === 'success' ? (
                    <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                      <XCircle className="w-10 h-10 text-red-400" />
                    </div>
                  )}
                  
                  <h3 className={`font-sans text-xl font-bold mb-2 ${resultMessage.type === 'success' ? 'text-white' : 'text-red-400'}`}>
                    {resultMessage.type === 'success' ? 'Batch Ingested' : 'Ingestion Completed'}
                  </h3>
                  <p className="font-mono text-[11px] text-[#38bdf8] tracking-widest mb-6 px-4">{resultMessage.text}</p>
                  
                  <div className="flex flex-col gap-2 w-full max-w-xs mb-6">
                    {uploadTasks.map(task => {
                      const isImage = task.type?.startsWith('image/');
                      return (
                        <div key={task.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg p-2.5">
                          <div className="flex items-center gap-2 truncate">
                            {isImage ? <ImageIcon className="w-3.5 h-3.5 text-white/40" /> : <FileIcon className="w-3.5 h-3.5 text-white/40" />}
                            <span className="font-mono text-[11px] text-white/70 truncate max-w-[150px]">{task.name}</span>
                          </div>
                          {task.status === 'success' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" title={task.errorMsg} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); resetUploader(); }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest px-6 py-2 rounded-full transition-colors"
                  >
                    Upload Another Batch
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
