import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, XCircle, File as FileIcon, Image as ImageIcon, Loader2, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PixelDropZone() {
  const [mode, setMode] = useState<'file' | 'voice'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
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
        processFile(file);
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

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setUploading(true);
    setUploadProgress(0);
    setResultMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/system/dropzone/upload', true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.status === 'success') {
              setResultMessage({ type: 'success', text: response.message || 'Asset processed successfully.' });
            } else {
              setResultMessage({ type: 'error', text: response.message || 'Upload failed.' });
            }
          } catch (err) {
            setResultMessage({ type: 'success', text: 'Asset processed successfully.' });
          }
        } else {
          setResultMessage({ type: 'error', text: `Upload failed. Server returned ${xhr.status}.` });
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setResultMessage({ type: 'error', text: 'Network error occurred during upload.' });
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      setResultMessage({ type: 'error', text: 'Unexpected error occurred.' });
      setUploading(false);
    }
  };

  const resetUploader = () => {
    setUploadedFile(null);
    setResultMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = uploadedFile && uploadedFile.type.startsWith('image/');

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
            Secure Asset Ingestion // Clio // Node .183
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
                  <h3 className="font-sans text-xl font-bold text-white mb-2 tracking-wide">Tap or Drop Asset</h3>
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
                  className="flex flex-col items-center w-full"
                >
                  <Loader2 className="w-12 h-12 text-[#38bdf8] animate-spin mb-6" />
                  <h3 className="font-mono text-sm text-[#38bdf8] mb-4 tracking-widest uppercase">
                    {mode === 'voice' ? 'Transmitting Audio...' : 'Uploading Asset...'}
                  </h3>
                  <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#38bdf8] to-[#e879f9] shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-white/50 mt-3">{uploadProgress}%</p>
                </motion.div>
              )}

              {resultMessage && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center w-full"
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
                    {resultMessage.type === 'success' ? 'Transfer Complete' : 'Transfer Failed'}
                  </h3>
                  <p className="font-mono text-[11px] text-[#38bdf8] tracking-widest mb-6 px-4">{resultMessage.text}</p>
                  
                  {uploadedFile && (
                    <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg p-3 w-full max-w-[80%]">
                      {isImage ? <ImageIcon className="w-5 h-5 text-white/40" /> : <FileIcon className="w-5 h-5 text-white/40" />}
                      <span className="font-mono text-xs text-white/70 truncate">{uploadedFile.name}</span>
                    </div>
                  )}

                  <button 
                    onClick={(e) => { e.stopPropagation(); resetUploader(); }}
                    className="mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest px-6 py-2 rounded-full transition-colors"
                  >
                    Upload Another
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
