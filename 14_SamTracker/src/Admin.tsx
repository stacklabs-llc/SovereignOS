import React, { useState, useEffect } from 'react';

export default function Admin() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  const [config, setConfig] = useState({
    note_title: '',
    note_text: '',
    status_text: '',
    daily_naps: '',
    adventures: '',
    tuna_snacks: '',
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${protocol}//${window.location.host}/sam/ws`);
        
        socket.onopen = () => {
          setWs(socket);
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'STATE_UPDATE' && payload.data) {
              setConfig(prev => ({
                note_title: payload.data.note_title ?? prev.note_title,
                note_text: payload.data.note_text ?? prev.note_text,
                status_text: payload.data.status_text ?? prev.status_text,
                daily_naps: payload.data.daily_naps ?? prev.daily_naps,
                adventures: payload.data.adventures ?? prev.adventures,
                tuna_snacks: payload.data.tuna_snacks ?? prev.tuna_snacks,
              }));
            }
          } catch (err) {}
        };

        socket.onclose = () => {
          setWs(null);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.error("WebSocket init failed:", e);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size (limit to 8MB)
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file. Videos are too large to process directly.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 8MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'CMD_UPDATE_CONFIG', 
        config: config,
        image_base64: selectedImage 
      }));
      setSaveStatus('Configuration Saved Successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
      setSelectedImage(null); // Clear pending image
    } else {
      setSaveStatus('Error: Not connected to server');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex justify-center text-slate-800">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-serif text-amber-700">🐾 SamTracker Admin Portal</h1>
          <button 
            onClick={() => { window.location.hash = ''; window.location.reload(); }} 
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-colors"
          >
            ← Back to Tracker
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Status Text</label>
            <input 
              type="text" 
              name="status_text"
              value={config.status_text} 
              onChange={handleChange}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Note Title</label>
            <input 
              type="text" 
              name="note_title"
              value={config.note_title} 
              onChange={handleChange}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-400 mb-4"
            />
            
            <label className="block text-sm font-bold uppercase mb-2">Note Content</label>
            <textarea 
              name="note_text"
              value={config.note_text} 
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase mb-2">Daily Naps</label>
              <input 
                type="text" 
                name="daily_naps"
                value={config.daily_naps} 
                onChange={handleChange}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase mb-2">Adventures</label>
              <input 
                type="text" 
                name="adventures"
                value={config.adventures} 
                onChange={handleChange}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase mb-2">Tuna Snacks</label>
              <input 
                type="text" 
                name="tuna_snacks"
                value={config.tuna_snacks} 
                onChange={handleChange}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Main Display Picture</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
            {selectedImage && (
              <div className="mt-4">
                <p className="text-sm text-amber-600 mb-2">Pending Upload Preview:</p>
                <img src={selectedImage} alt="Preview" className="h-32 rounded-lg border-2 border-slate-200" />
              </div>
            )}
          </div>

          <div className="pt-6 border-t-2 border-slate-100 flex items-center justify-between">
            <button 
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors"
            >
              Save Configuration
            </button>
            {saveStatus && (
              <span className={`font-bold ${saveStatus.includes('Error') ? 'text-red-500' : 'text-emerald-500'}`}>
                {saveStatus}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
