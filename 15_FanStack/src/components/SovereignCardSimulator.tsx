import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Shield, AlertTriangle, Play, RefreshCw, Cpu, Database, Eye } from 'lucide-react';

interface Card {
  rank: string;
  suit: string;
}

interface BlackjackState {
  player_score: number;
  dealer_up: string;
  player_cards?: string[];
  dealer_cards?: string[];
  recommendation?: string;
  ev?: number;
  is_warning?: boolean;
}

export default function SovereignCardSimulator() {
  const [blackjackState, setBlackjackState] = useState<BlackjackState>({
    player_score: 16,
    dealer_up: 'Ts',
    player_cards: ['10s', '6d'],
    dealer_cards: ['Ts'],
  });

  const [omegaGateApproved, setOmegaGateApproved] = useState(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<string>('');

  // Local helper to map state to recommendation/EV (GTO Strategy Engine)
  const getGtoDecision = (score: number, dealerUp: string): { recommendation: string; ev: number; isWarning: boolean } => {
    const upCardChar = dealerUp.trim().charAt(0).toUpperCase();
    
    // Player has 16
    if (score === 16) {
      if (['T', 'J', 'Q', 'K', 'A', '1'].includes(upCardChar)) {
        return { recommendation: 'SURRENDER', ev: -0.54, isWarning: true };
      }
      if (['7', '8', '9'].includes(upCardChar)) {
        return { recommendation: 'HIT', ev: -0.48, isWarning: false };
      }
      return { recommendation: 'STAND', ev: -0.28, isWarning: false };
    }
    
    // Player has 11
    if (score === 11) {
      if (['A', '1'].includes(upCardChar)) {
        return { recommendation: 'HIT', ev: 0.15, isWarning: false };
      }
      return { recommendation: 'DOUBLE', ev: 0.32, isWarning: false };
    }

    // Player has 12 to 15
    if (score >= 12 && score <= 15) {
      if (['2', '3', '4', '5', '6'].includes(upCardChar)) {
        return { recommendation: 'STAND', ev: -0.25, isWarning: false };
      }
      return { recommendation: 'HIT', ev: -0.42, isWarning: false };
    }

    // High hands
    if (score >= 17) {
      return { recommendation: 'STAND', ev: 0.45, isWarning: false };
    }

    // Low hands
    if (score <= 10) {
      return { recommendation: 'HIT', ev: -0.12, isWarning: false };
    }

    return { recommendation: 'HIT', ev: -0.35, isWarning: false };
  };

  const decision = getGtoDecision(blackjackState.player_score, blackjackState.dealer_up);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      setWsStatus('connecting');
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/ws`);

        ws.onopen = () => {
          console.log('[Simulator Websocket] Connected to relay host');
          setWsStatus('connected');
          // Join Global room
          ws?.send(JSON.stringify({ type: 'JOIN_ROOM', target_game_pk: 'GLOBAL' }));
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            setLastMessage(event.data);
            
            // Check for simulated Blackjack state
            if (parsed.type === 'BLACKJACK_STATE' || parsed.dealer_up !== undefined) {
              const pScore = parsed.player_score || 16;
              const dUp = parsed.dealer_up || 'Ts';
              
              // Synthesize cards if not provided
              const pCards = parsed.player_cards || (pScore === 16 ? ['10s', '6d'] : ['9s', `${pScore - 9}d`]);
              const dCards = parsed.dealer_cards || [dUp];
              
              setBlackjackState({
                player_score: pScore,
                dealer_up: dUp,
                player_cards: pCards,
                dealer_cards: dCards,
              });
            }
          } catch (err) {
            console.error('Failed to parse WS data:', err);
          }
        };

        ws.onclose = () => {
          console.warn('[Simulator Websocket] Connection closed');
          setWsStatus('disconnected');
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        ws.onerror = (err) => {
          console.error('[Simulator Websocket] Error:', err);
          ws?.close();
        };
      } catch (err) {
        console.error('WebSocket connection setup failed:', err);
        setWsStatus('disconnected');
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Manual hand overrides for testing (UAT validation)
  const triggerManualHand = (score: number, dealerCard: string, playerCard1: string, playerCard2: string) => {
    setBlackjackState({
      player_score: score,
      dealer_up: dealerCard,
      player_cards: [playerCard1, playerCard2],
      dealer_cards: [dealerCard],
    });
  };

  const getSuitSymbol = (cardStr: string): string => {
    const lastChar = cardStr.trim().slice(-1).toLowerCase();
    if (lastChar === 's') return '♠';
    if (lastChar === 'h') return '♥';
    if (lastChar === 'd') return '♦';
    if (lastChar === 'c') return '♣';
    return '';
  };

  const getCardValue = (cardStr: string): string => {
    return cardStr.trim().slice(0, -1);
  };

  const getCardColor = (cardStr: string): string => {
    const lastChar = cardStr.trim().slice(-1).toLowerCase();
    return (lastChar === 'h' || lastChar === 'd') ? 'text-red-500' : 'text-slate-200';
  };

  return (
    <div className="w-full bg-[#0b0d13] text-slate-200 p-6 font-mono select-none">
      
      {/* Title & Connection Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 border-b border-[#00b4d8]/20">
        <div>
          <h1 className="text-3xl font-bold tracking-[0.25em] text-[#00b4d8] uppercase flex items-center gap-3">
            <Cpu className="w-8 h-8 animate-pulse text-[#00b4d8]" />
            SOVEREIGN CARD SIMULATOR
          </h1>
          <p className="text-xs text-slate-400 tracking-widest mt-1">
            ARGO CV DETECTION ENGINE // CLIO PROBABILISTIC GTO SYSTEM
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0 bg-slate-900/60 border border-white/5 p-3 backdrop-blur rounded">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></div>
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Relay: {wsStatus.toUpperCase()}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <span className="text-xs text-[#00b4d8] font-bold">PORT 8008</span>
        </div>
      </div>

      {/* Dual Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* LEFT PANEL: Holographic Card Ingress */}
        <div className="flex flex-col bg-slate-950/80 border-2 border-slate-800 p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,180,216,0.02)]">
          <div className="absolute top-2 left-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest">[PANEL_01: INGRESS_CV]</div>
          
          <h2 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6 mt-2 border-b border-white/5 pb-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#00b4d8]" />
            HOLOGRAPHIC CARD INGRESS
          </h2>
          
          {/* Blackjack Felt Table Simulation */}
          <div className="flex-1 min-h-[350px] bg-slate-900/50 border-2 border-dashed border-[#00b4d8]/20 rounded-xl relative flex flex-col justify-between p-6">
            
            {/* Dealer section */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 tracking-wider uppercase font-bold mb-3">[DEALER INGRESS ZONE]</span>
              <div className="flex gap-4">
                {blackjackState.dealer_cards && blackjackState.dealer_cards.map((card, i) => (
                  <div key={i} className="w-20 h-28 bg-[#161a25]/90 border-2 border-[#00b4d8]/40 shadow-[0_0_15px_rgba(0,180,216,0.1)] flex flex-col justify-between p-2 rounded backdrop-blur relative group">
                    <div className="flex justify-between items-start">
                      <span className={`font-bold text-lg ${getCardColor(card)}`}>{getCardValue(card)}</span>
                      <span className={`text-base ${getCardColor(card)}`}>{getSuitSymbol(card)}</span>
                    </div>
                    <div className="text-center text-3xl opacity-85 select-none">{getSuitSymbol(card)}</div>
                    <div className="flex justify-end items-end">
                      <span className={`font-bold text-xs ${getCardColor(card)}`}>{card}</span>
                    </div>
                    {/* Bounding box visual aid */}
                    <div className="absolute -inset-1 border border-cyan-500 opacity-20 pointer-events-none rounded"></div>
                  </div>
                ))}
                {/* Hole card simulation if only one dealer card */}
                {blackjackState.dealer_cards && blackjackState.dealer_cards.length === 1 && (
                  <div className="w-20 h-28 bg-slate-950 border-2 border-dashed border-slate-700/80 flex items-center justify-center p-2 rounded relative">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider text-center">HIDDEN HOLE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bounding lines or radar sweep */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-[#00b4d8]/10"></div>
              <div className="text-[9px] text-[#00b4d8]/30 font-bold uppercase tracking-widest mt-1">ARGO CORE CAMERA SWEEP ACTIVE</div>
            </div>

            {/* Player section */}
            <div className="flex flex-col items-center">
              <div className="flex gap-4 mb-3">
                {blackjackState.player_cards && blackjackState.player_cards.map((card, i) => (
                  <div key={i} className="w-20 h-28 bg-[#161a25]/90 border-2 border-[#00b4d8]/40 shadow-[0_0_15px_rgba(0,180,216,0.1)] flex flex-col justify-between p-2 rounded backdrop-blur relative">
                    <div className="flex justify-between items-start">
                      <span className={`font-bold text-lg ${getCardColor(card)}`}>{getCardValue(card)}</span>
                      <span className={`text-base ${getCardColor(card)}`}>{getSuitSymbol(card)}</span>
                    </div>
                    <div className="text-center text-3xl opacity-85 select-none">{getSuitSymbol(card)}</div>
                    <div className="flex justify-end items-end">
                      <span className={`font-bold text-xs ${getCardColor(card)}`}>{card}</span>
                    </div>
                    {/* Bounding box visual aid */}
                    <div className="absolute -inset-1 border border-[#00b4d8] opacity-20 pointer-events-none rounded"></div>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase font-bold">[PLAYER INGRESS ZONE]</span>
            </div>

          </div>

          {/* Quick preset scenario overrides */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button 
              onClick={() => triggerManualHand(16, 'Ts', '10s', '6d')}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] border border-white/5 uppercase rounded"
            >
              16 vs Dealer Ten
            </button>
            <button 
              onClick={() => triggerManualHand(11, '8c', '6h', '5d')}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] border border-white/5 uppercase rounded"
            >
              11 vs Dealer Eight
            </button>
            <button 
              onClick={() => triggerManualHand(14, '5s', 'Jd', '4c')}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] border border-white/5 uppercase rounded"
            >
              14 vs Dealer Five
            </button>
          </div>

        </div>

        {/* RIGHT PANEL: Clio Decision Spool */}
        <div className="flex flex-col bg-slate-950/80 border-2 border-slate-800 p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,180,216,0.02)]">
          <div className="absolute top-2 left-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest">[PANEL_02: DECISION_SPOOL]</div>
          
          <h2 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6 mt-2 border-b border-white/5 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00b4d8]" />
            CLIO DECISION ENGINE
          </h2>

          <div className="flex-1 flex flex-col justify-between gap-6">
            
            {/* Live Stats Table */}
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5 rounded">
                <span className="text-slate-400">PLAYER TOTAL SCORE</span>
                <span className="text-white font-bold text-lg">{blackjackState.player_score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5 rounded">
                <span className="text-slate-400">DEALER INGRESS UP CARD</span>
                <span className="text-white font-bold text-lg">{blackjackState.dealer_up}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5 rounded">
                <span className="text-slate-400">EXPECTED VALUE (EV)</span>
                <span className={`font-bold text-lg ${decision.ev >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {decision.ev > 0 ? '+' : ''}{decision.ev}
                </span>
              </div>
            </div>

            {/* Recommendation Flasher */}
            <div className={`p-6 border-2 flex flex-col items-center justify-center rounded-xl transition-all duration-300 ${
              decision.isWarning 
                ? 'bg-rose-950/20 border-rose-500/40 shadow-[inset_0_0_30px_rgba(239,68,68,0.1)] text-rose-500 animate-pulse' 
                : decision.recommendation === 'STAND' 
                  ? 'bg-cyan-950/20 border-[#00b4d8]/40 shadow-[inset_0_0_30px_rgba(0,180,216,0.1)] text-[#00b4d8]'
                  : 'bg-emerald-950/20 border-emerald-500/40 shadow-[inset_0_0_30px_rgba(16,185,129,0.1)] text-emerald-400'
            }`}>
              {decision.isWarning ? (
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                  <span className="text-xs uppercase tracking-widest font-bold">GTO WARNING EVENT</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-bold">GTO OPTIMAL PLAY</span>
                </div>
              )}
              <div className="text-4xl font-extrabold tracking-widest uppercase mb-1">{decision.recommendation}</div>
              <div className="text-[10px] text-white/50 tracking-wider">EV OUTPUT VALUE: {decision.ev}</div>
            </div>

            {/* Omega Gate Confirmation */}
            <div className="p-4 bg-slate-900/60 border border-white/5 rounded flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">HUMAN IN THE LOOP APPROVAL</span>
                <button 
                  onClick={() => setOmegaGateApproved(!omegaGateApproved)}
                  className="focus:outline-none transition-transform duration-200 hover:scale-105"
                >
                  {omegaGateApproved ? (
                    <ToggleRight className="w-14 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-14 h-8 text-slate-600" />
                  )}
                </button>
              </div>
              <div className={`p-2 rounded text-[10px] text-center font-bold tracking-widest uppercase border ${
                omegaGateApproved 
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
              }`}>
                {omegaGateApproved ? 'OMEGA GATE: UNLOCKED & READY FOR SUBMISSION' : 'OMEGA GATE: HUMAN LOCK ENGAGED'}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Terminal log panel */}
      <div className="mt-8 bg-slate-950 border-2 border-slate-800 p-4 rounded relative">
        <div className="absolute top-2 left-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest">[DEBUG_CONSOLE]</div>
        <div className="mt-4 h-24 overflow-y-auto text-xs text-slate-500 space-y-1 font-mono p-2 bg-black/40 rounded scrollbar-thin">
          <div>[INFO] Clio card simulation interface listening on WS relay endpoint...</div>
          {wsStatus === 'connected' && <div>[INFO] WebSocket handshake resolved. Connected.</div>}
          {lastMessage && <div className="text-cyan-400/70 truncate">[WS INCOMING] {lastMessage}</div>}
          <div>[GTO] Calculated Ev: {decision.ev} Action: {decision.recommendation}</div>
        </div>
      </div>

    </div>
  );
}
