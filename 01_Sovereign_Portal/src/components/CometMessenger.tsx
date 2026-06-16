import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Check, Square, CheckSquare, AlertTriangle, Radio, Send, LifeBuoy, Clock, User } from 'lucide-react';

interface CometMessage {
  id: number;
  sender_id: string;
  message_text: string;
  channel_name: string;
  created_at: string;
}

interface GroceryItem {
  id: number;
  item_name: string;
  quantity: string;
  status: string;
  compiled_at: string;
}

interface PriorityAlert {
  id: number;
  alert_type: string;
  status: string;
  sys_ticket_id: string;
  avatar_url?: string;
}

export default function CometMessenger() {
  const [activeTab, setActiveTab] = useState<'chat' | 'grocery' | 'alert'>('chat');
  const [messages, setMessages] = useState<CometMessage[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  
  const [chatInput, setChatInput] = useState('');
  const [groceryItem, setGroceryItem] = useState('');
  const [groceryQty, setGroceryQty] = useState('1');
  
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Get current user details from token
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('sovereign_session_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || 'Anonymous';
      }
    } catch (e) {
      console.error(e);
    }
    return 'Anonymous';
  };

  const username = getCurrentUser();

  useEffect(() => {
    const isSecure = window.location.protocol === 'https:';
    const wsUrl = isSecure 
      ? `wss://${window.location.host}/ws-comet`
      : `ws://${window.location.hostname || 'localhost'}:8015`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('Comet WebSocket connected to:', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          setMessages(data.messages || []);
          setGroceries(data.groceries || []);
          setAlerts(data.alerts || []);
        } else if (data.type === 'chat') {
          setMessages(prev => [...prev, data]);
        } else if (data.type === 'grocery_add') {
          setGroceries(prev => [...prev, data]);
        } else if (data.type === 'grocery_toggle') {
          setGroceries(prev => 
            prev.map(item => item.id === data.id ? { ...item, status: data.status } : item)
          );
        } else if (data.type === 'priority_alert') {
          setAlerts(prev => [...prev, data]);
        } else if (data.type === 'priority_resolve') {
          setAlerts(prev => prev.filter(alert => alert.id !== data.id));
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('Comet WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wsRef.current || !connected) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      sender_id: username,
      message_text: chatInput,
      channel_name: 'general'
    }));
    setChatInput('');
  };

  const addGroceryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groceryItem.trim() || !wsRef.current || !connected) return;

    wsRef.current.send(JSON.stringify({
      type: 'grocery_add',
      item_name: groceryItem,
      quantity: groceryQty
    }));
    setGroceryItem('');
    setGroceryQty('1');
  };

  const toggleGroceryItem = (id: number, currentStatus: string) => {
    if (!wsRef.current || !connected) return;
    const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
    wsRef.current.send(JSON.stringify({
      type: 'grocery_toggle',
      id,
      status: newStatus
    }));
  };

  const sendPriorityAlert = (alertType: string) => {
    if (!wsRef.current || !connected) return;
    
    // Prevent double submissions of active alerts
    if (alerts.some(a => a.alert_type === alertType && a.status === 'ACTIVE')) {
      alert(`An active alert for ${alertType} is already pending.`);
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'priority_alert',
      alert_type: alertType
    }));
  };

  const resolvePriorityAlert = (id: number) => {
    if (!wsRef.current || !connected) return;
    wsRef.current.send(JSON.stringify({
      type: 'priority_resolve',
      id
    }));
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#fdf6e3] border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] text-slate-900 font-mono">
      {/* Retro Header Accent */}
      <div className="bg-[#de5d3b] border-b-4 border-slate-900 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio size={24} className="animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-slate-900" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg tracking-wider uppercase">SPUTNIK COMET-90</h3>
            <p className="text-[10px] opacity-90 tracking-widest font-bold">MID-CENTURY DIAL RELAY</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/30 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[#5cd08e]' : 'bg-[#e54b4b]'} border border-slate-900`} />
          <span className="text-[10px] uppercase font-bold tracking-wider">{connected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Retro Tabs Selection */}
      <div className="flex bg-[#eddcb9] border-b-4 border-slate-900 text-xs font-bold">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 border-r-4 border-slate-900 transition-all uppercase tracking-wider ${
            activeTab === 'chat' ? 'bg-[#fdf6e3] text-[#de5d3b]' : 'hover:bg-[#f3e3c3]'
          }`}
        >
          <MessageSquare size={14} />
          COMET FEED
        </button>
        <button
          onClick={() => setActiveTab('grocery')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 border-r-4 border-slate-900 transition-all uppercase tracking-wider ${
            activeTab === 'grocery' ? 'bg-[#fdf6e3] text-[#de5d3b]' : 'hover:bg-[#f3e3c3]'
          }`}
        >
          <Plus size={14} />
          PROVISIONS
        </button>
        <button
          onClick={() => setActiveTab('alert')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 transition-all uppercase tracking-wider ${
            activeTab === 'alert' ? 'bg-[#e54b4b] text-white' : 'hover:bg-[#f3e3c3]'
          }`}
        >
          <AlertTriangle size={14} />
          ALERTS
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#fdf6e3]">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <Radio size={32} className="mx-auto mb-2 opacity-30 text-[#de5d3b]" />
                  <p className="text-xs uppercase font-bold tracking-wider">Awaiting transmissions...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${msg.sender_id === username ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 mb-0.5 flex items-center gap-1 uppercase tracking-wider">
                      <User size={10} />
                      {msg.sender_id}
                    </span>
                    <div 
                      className={`p-3 rounded-2xl border-2 border-slate-900 text-xs shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                        msg.sender_id === username 
                          ? 'bg-[#de5d3b] text-white' 
                          : 'bg-white text-slate-900'
                      }`}
                    >
                      {msg.message_text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChatMessage} className="mt-3 flex gap-2 border-t-2 border-slate-900 pt-3">
              <input
                type="text"
                placeholder="TYPE DISPATCH TRANSMISSION..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-white border-2 border-slate-900 px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#de5d3b] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              />
              <button
                type="submit"
                className="bg-[#de5d3b] hover:bg-[#c24828] border-2 border-slate-900 text-white px-4 py-2 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'grocery' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-2.5">
              <h4 className="text-xs uppercase font-extrabold text-[#de5d3b] mb-2 tracking-widest border-b-2 border-slate-200 pb-1 flex items-center gap-1">
                🛒 PROVISION CHECKLIST
              </h4>
              {groceries.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-8 uppercase tracking-widest">No provisions registered.</p>
              ) : (
                groceries.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleGroceryItem(item.id, item.status)}
                    className={`flex items-center justify-between p-3 bg-white border-2 border-slate-900 rounded-xl cursor-pointer hover:bg-slate-50 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                      item.status === 'COMPLETED' ? 'opacity-60 bg-slate-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.status === 'COMPLETED' ? (
                        <CheckSquare size={16} className="text-[#de5d3b]" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                      <span className={`text-xs font-bold ${item.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                        {item.item_name}
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full font-bold uppercase">
                      QTY: {item.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addGroceryItem} className="mt-3 flex gap-2 border-t-2 border-slate-900 pt-3">
              <input
                type="text"
                placeholder="PROVISION ITEM..."
                value={groceryItem}
                onChange={(e) => setGroceryItem(e.target.value)}
                className="flex-1 bg-white border-2 border-slate-900 px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#de5d3b] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              />
              <input
                type="text"
                placeholder="QTY"
                value={groceryQty}
                onChange={(e) => setGroceryQty(e.target.value)}
                className="w-12 bg-white border-2 border-slate-900 px-2 py-2 text-xs rounded-xl focus:outline-none text-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              />
              <button
                type="submit"
                className="bg-[#de5d3b] hover:bg-[#c24828] border-2 border-slate-900 text-white px-4 py-2 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
              >
                ADD
              </button>
            </form>
          </div>
        )}

        {activeTab === 'alert' && (
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h4 className="text-xs uppercase font-extrabold text-[#e54b4b] mb-1.5 tracking-widest border-b-2 border-slate-200 pb-1 flex items-center gap-1">
                🚨 ONE-TAP PRIORITY DISPATCH
              </h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 leading-relaxed">
                TRIGGER IMMEDIATE PRIORITY ASSISTANCE. SUBMITS TICKETS TO CLIO LEDGER.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { label: '🏃‍♂️ WALKER REQUEST', type: 'Walker Request' },
                  { label: '📚 HIGH SHELF TRIAGE', type: 'High Shelf Triage' },
                  { label: '🥑 GROCERY ASSIST', type: 'Groceries List' }
                ].map((alertBtn) => {
                  const isActive = alerts.some(a => a.alert_type === alertBtn.type && a.status === 'ACTIVE');
                  return (
                    <button
                      key={alertBtn.type}
                      onClick={() => sendPriorityAlert(alertBtn.type)}
                      disabled={isActive}
                      className={`py-3 px-2 border-2 border-slate-900 rounded-2xl font-extrabold text-[10px] uppercase shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] ${
                        isActive 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none active:translate-x-0 active:translate-y-0' 
                          : 'bg-[#e54b4b] text-white hover:bg-[#c93f3f]'
                      }`}
                    >
                      {alertBtn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h4 className="text-xs uppercase font-extrabold text-slate-600 mb-2 tracking-widest border-b-2 border-slate-200 pb-1">
                ⏳ PENDING ALERTS ({alerts.length})
              </h4>
              {alerts.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-4 uppercase tracking-widest">No active alerts.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="p-3 bg-red-50 border-2 border-[#e54b4b] rounded-xl flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(229,75,75,0.2)] animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        {alert.avatar_url && (
                          <img 
                            src={alert.avatar_url} 
                            alt="Expression Avatar" 
                            className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" 
                          />
                        )}
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 uppercase">
                            ⚠️ {alert.alert_type}
                          </span>
                          {alert.sys_ticket_id && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                              <Clock size={10} />
                              CLIO REF: {alert.sys_ticket_id}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => resolvePriorityAlert(alert.id)}
                        className="bg-[#5cd08e] hover:bg-[#49b97a] border-2 border-slate-900 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                      >
                        RESOLVE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
