import React, { useState, useRef } from 'react';
import { getWsUrl } from '../api-host';
import { Send, Code } from 'lucide-react';

export const VocalMatrixPayload = () => {
    const [payload, setPayload] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    
    const sendPayload = () => {
        try {
            const parsed = JSON.parse(payload);
            const ws = new WebSocket(getWsUrl('/ws'));
            
            ws.onopen = () => {
                ws.send(JSON.stringify(parsed));
                setStatus('success');
                setStatusMsg('Payload injected successfully.');
                setTimeout(() => {
                    ws.close();
                    setStatus('idle');
                    setStatusMsg('');
                }, 1000);
            };
            
            ws.onerror = () => {
                setStatus('error');
                setStatusMsg('WebSocket connection failed.');
            };
            
        } catch (err: any) {
            setStatus('error');
            setStatusMsg('Invalid JSON Payload: ' + err.message);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center bg-[#050505] p-6 rounded-xl border border-purple-500/30">
            <div className="w-full flex items-center justify-between mb-4 border-b border-purple-500/20 pb-4">
                <div className="flex items-center gap-3">
                    <Code className="text-purple-400" size={24} />
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest font-mono">Vocal Matrix Proxy</h2>
                        <p className="text-xs text-purple-400/60 uppercase tracking-widest font-mono mt-1">Direct LLM JSON Injection Node</p>
                    </div>
                </div>
            </div>
            
            <div className="w-full flex-1 flex flex-col">
                <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 font-mono">Payload Content</label>
                <textarea 
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    className="flex-1 w-full bg-black/80 border border-purple-500/30 rounded p-4 text-sm font-mono text-green-400 outline-none focus:border-purple-400  resize-none"
                    placeholder="Paste JSON payload here..."
                    spellCheck="false"
                />
            </div>
            
            <div className="w-full flex items-center justify-between mt-4">
                <div className={`text-xs font-mono uppercase tracking-widest ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-green-500' : 'text-transparent'}`}>
                    {statusMsg || 'READY'}
                </div>
                
                <button 
                    onClick={sendPayload}
                    disabled={!payload.trim() || status === 'success'}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-sm  transition-all"
                >
                    <Send size={16} />
                    Inject Payload
                </button>
            </div>
        </div>
    );
};
