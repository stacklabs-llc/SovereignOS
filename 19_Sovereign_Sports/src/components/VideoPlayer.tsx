import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import axios from 'axios';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Radio, Activity, 
  Phone, PhoneOff, Send, MessageSquare, Paperclip,
  Terminal, Trash2, RefreshCw, ChevronDown, ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { JinxOverlay } from './JinxOverlay';
import { SpideyMetOverlay } from './SpideyMetOverlay';


interface InningDetail {
  num: number;
  ordinalNum: string;
  home: { runs: number; hits: number; errors: number; leftOnBase: number };
  away: { runs: number; hits: number; errors: number; leftOnBase: number };
}

interface RecentPlay {
  inning: string;
  event: string;
  description: string;
}

interface GameState {
  game_pk: number;
  away_team: string;
  home_team: string;
  away_score: number;
  home_score: number;
  inning: string;
  outs: number;
  balls: number;
  strikes: number;
  pitcher: string;
  batter: string;
  pitch_name: string;
  pitch_speed: number;
  hit_speed: number;
  hit_distance: number;
  status_msg: string;
  innings_detail: InningDetail[];
  recent_plays: RecentPlay[];
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isPersona: boolean;
  color?: string;
  image?: string;
}

function playSystemAudio(filename: string) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.15);
  } catch (audioErr) {
    console.warn("Dynamic Web Audio fallback failed:", audioErr);
  }

  try {
    const audio = new Audio(`/sounds/${filename}`);
    audio.play().catch(() => {});
  } catch (e) {
    // Silent catch
  }
}

function triggerSpideyTakeover() {
  const portalContainer = document.getElementById('main-dashboard-viewport');
  if (!portalContainer) return;
  
  portalContainer.classList.add('tmi-window-shatter');
  
  const existingOverlay = document.getElementById('spidey-overlay-layer');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'spidey-overlay-layer';
  canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; pointer-events:none;";
  document.body.appendChild(canvas);
  
  try {
    playSystemAudio('thwip_loud.mp3');
  } catch (e) {
    console.warn("[TMI SYSTEM] Audio asset failed or benched. Proceeding with visual-only sequence.");
  }
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let frame = 0;
    const maxFrames = 75;
    
    function drawWebBlast() {
      if (!ctx || !document.getElementById('spidey-overlay-layer')) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const progress = Math.min(frame / maxFrames, 1.0);
      const alpha = 1.0 - progress;
      ctx.strokeStyle = `rgba(240, 240, 245, ${alpha * 0.85})`;
      ctx.lineWidth = (3 + Math.sin(frame * 0.5) * 2) * (1.0 - progress * 0.5);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(centerX * progress, centerY * progress);
      ctx.moveTo(canvas.width, 0); ctx.lineTo(canvas.width - (canvas.width - centerX) * progress, centerY * progress);
      ctx.moveTo(0, canvas.height); ctx.lineTo(centerX * progress, canvas.height - (canvas.height - centerY) * progress);
      ctx.moveTo(canvas.width, canvas.height); ctx.lineTo(canvas.width - (canvas.width - centerX) * progress, canvas.height - (canvas.height - centerY) * progress);
      ctx.stroke();

      ctx.beginPath();
      for (let r = 1; r <= 4; r++) {
        const radius = (canvas.width * 0.1 * r) * progress;
        ctx.moveTo(centerX + radius, centerY);
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      }
      ctx.stroke();
      
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(drawWebBlast);
      }
    }
    drawWebBlast();
  }
  
  setTimeout(() => {
    portalContainer.classList.remove('tmi-window-shatter');
    canvas.remove();
    console.log("[TMI SYSTEM] Spidey-Sense Takeover concluded successfully. Environment normalized.");
  }, 2500);
}

function triggerAirBenderTakeover() {
  const portalContainer = document.getElementById('main-dashboard-viewport');
  if (!portalContainer) return;
  
  portalContainer.classList.add('tmi-airbender-shatter');
  
  const existingOverlay = document.getElementById('airbender-overlay-layer');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'airbender-overlay-layer';
  canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; pointer-events:none;";
  document.body.appendChild(canvas);
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioContext.sampleRate * 2.0;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 2.0;
    
    const gainNode = audioContext.createGain();
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.6);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.5);
    
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.8);
    
    noise.start();
    noise.stop(now + 2.0);
  } catch (err) {
    console.warn("Web Audio wind synthesis failed:", err);
  }
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let frame = 0;
    const maxFrames = 150;
    
    const img = new Image();
    img.src = '/images/devin_williams_airbender.png';
    
    const particles: Array<{
      angle: number;
      radius: number;
      speed: number;
      size: number;
      color: string;
    }> = [];
    
    for (let i = 0; i < 40; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 100 + Math.random() * 300,
        speed: 0.05 + Math.random() * 0.05,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? 'rgba(186, 230, 253, 0.8)' : 'rgba(255, 255, 255, 0.9)'
      });
    }
    
    function drawAirBender() {
      if (!ctx || !document.getElementById('airbender-overlay-layer')) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const progress = Math.min(frame / maxFrames, 1.0);
      const alpha = progress < 0.2 ? progress / 0.2 : (progress > 0.8 ? (1.0 - progress) / 0.2 : 1.0);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      particles.forEach(p => {
        p.angle += p.speed;
        p.radius -= 1.0;
        if (p.radius < 10) {
          p.radius = 300 + Math.random() * 100;
        }
        
        const px = centerX + Math.cos(p.angle) * p.radius;
        const py = centerY + Math.sin(p.angle) * p.radius * 0.6;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      
      if (img.complete) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const scale = 0.8 + Math.sin(frame * 0.1) * 0.05;
        const imgW = 260 * scale;
        const imgH = 260 * scale;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY - 40, imgW / 2, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.drawImage(img, centerX - imgW / 2, centerY - 40 - imgH / 2, imgW, imgH);
        ctx.restore();
        
        ctx.strokeStyle = '#00FFCC';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00FFCC';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 40, imgW / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "bold 2.5rem Inter, system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#00FFCC";
      ctx.shadowBlur = 15;
      ctx.fillText("🌪️ DEVON WILLIAMS 🌪️", centerX, centerY + 140);
      
      ctx.font = "italic 1.5rem Inter, system-ui";
      ctx.fillStyle = "#00FFCC";
      ctx.fillText("THE AIR BENDER PITCH!", centerX, centerY + 180);
      ctx.restore();
      
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(drawAirBender);
      }
    }
    
    drawAirBender();
  }
  
  setTimeout(() => {
    portalContainer.classList.remove('tmi-airbender-shatter');
    canvas.remove();
    console.log("[TMI SYSTEM] Air Bender Takeover concluded. Environment normalized.");
  }, 4000);
}

function triggerMetsBlowItTakeover() {
  const portalContainer = document.getElementById('main-dashboard-viewport');
  if (!portalContainer) return;
  
  portalContainer.classList.add('tmi-window-shatter');
  
  const existingOverlay = document.getElementById('mets-blow-it-overlay-layer');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'mets-blow-it-overlay-layer';
  canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; pointer-events:none;";
  document.body.appendChild(canvas);
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioContext.sampleRate * 2.5;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / audioContext.sampleRate;
      const freq = 500 - (t * 120) + Math.sin(t * Math.PI * 8) * 60;
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.25 * (1.0 - t/2.5);
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (err) {
    console.warn("Mets Blow It audio synthesis failed:", err);
  }

  const ctx = canvas.getContext('2d');
  if (ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let frame = 0;
    const maxFrames = 180;
    
    function drawBlowIt() {
      if (!ctx || !document.getElementById('mets-blow-it-overlay-layer')) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const progress = Math.min(frame / maxFrames, 1.0);
      const alpha = progress < 0.15 ? progress / 0.15 : (progress > 0.85 ? (1.0 - progress) / 0.15 : 1.0);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const flashAlpha = Math.sin(frame * 0.15) * 0.25 + 0.25;
      ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha * alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const stripeHeight = 35;
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, stripeHeight);
      ctx.fillRect(0, canvas.height - stripeHeight, canvas.width, stripeHeight);
      
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      const stripeWidth = 20;
      for (let x = -stripeHeight; x < canvas.width + stripeHeight; x += stripeWidth * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeWidth, 0);
        ctx.lineTo(x + stripeWidth - 15, stripeHeight);
        ctx.lineTo(x - 15, stripeHeight);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - stripeHeight);
        ctx.lineTo(x + stripeWidth, canvas.height - stripeHeight);
        ctx.lineTo(x + stripeWidth - 15, canvas.height);
        ctx.lineTo(x - 15, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(centerX, centerY - 60);
      
      ctx.fillStyle = "#FBBF24";
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#D97706";
      ctx.stroke();
      
      ctx.strokeStyle = "#451A03";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 45, 25, Math.PI, 0, false);
      ctx.stroke();
      
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-30, -15);
      ctx.quadraticCurveTo(-20, -25, -10, -15);
      ctx.moveTo(10, -15);
      ctx.quadraticCurveTo(20, -25, 30, -15);
      ctx.stroke();
      
      ctx.fillStyle = "#60A5FA";
      ctx.beginPath();
      ctx.arc(-20, 10 + Math.sin(frame * 0.1) * 5, 8, 0, Math.PI * 2);
      ctx.arc(20, 15 + Math.sin(frame * 0.1 + 1) * 5, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-20, -10);
      ctx.lineTo(-20, 50);
      ctx.moveTo(20, -10);
      ctx.lineTo(20, 50);
      ctx.stroke();
      
      ctx.restore();
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "bold 3rem Impact, Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#EF4444";
      ctx.shadowBlur = 20;
      
      const glitchX = (Math.random() - 0.5) * 4;
      const glitchY = (Math.random() - 0.5) * 4;
      ctx.fillText("🚨 METS BLOW IT OVERLAY 🚨", centerX + glitchX, centerY + 90 + glitchY);
      
      ctx.font = "bold 2rem Inter, sans-serif";
      ctx.fillStyle = "#FBBF24";
      ctx.shadowBlur = 10;
      ctx.fillText("9TH INNING COLLAPSE IN PROGRESS!", centerX, centerY + 145);
      
      ctx.font = "italic 1.4rem Inter, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("OMG OMG WE ARE GOING TO BLOW THE LEAD!!!", centerX, centerY + 190);
      ctx.restore();
      
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(drawBlowIt);
      }
    }
    
    drawBlowIt();
  }
  
  setTimeout(() => {
    portalContainer.classList.remove('tmi-window-shatter');
    canvas.remove();
    console.log("[TMI SYSTEM] Mets Blow It Takeover concluded. Environment normalized.");
  }, 4000);
}

function triggerMetsWinTakeover() {
  const portalContainer = document.getElementById('main-dashboard-viewport');
  if (!portalContainer) return;
  
  portalContainer.classList.add('tmi-ghost-shatter');
  
  const existingOverlay = document.getElementById('mets-win-overlay-layer');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'mets-win-overlay-layer';
  canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; pointer-events:none;";
  document.body.appendChild(canvas);
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioContext.sampleRate * 3.0;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / audioContext.sampleRate;
      if (t < 1.0) {
        data[i] = Math.sin(2 * Math.PI * 1200 * t) * 0.15;
      } else {
        const localT = (t - 1.0) % 0.6;
        if (localT < 0.1) {
          data[i] = Math.sin(2 * Math.PI * 60 * localT) * 0.5 * Math.exp(-localT * 40);
        } else if (localT > 0.15 && localT < 0.25) {
          const lT2 = localT - 0.15;
          data[i] = Math.sin(2 * Math.PI * 55 * lT2) * 0.4 * Math.exp(-lT2 * 40);
        } else {
          data[i] = 0;
        }
      }
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (err) {
    console.warn("Mets Win audio synthesis failed:", err);
  }

  const ctx = canvas.getContext('2d');
  if (ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let frame = 0;
    const maxFrames = 240;
    
    const img = new Image();
    img.src = '/images/mets_cardiac_win.png';
    
    const ecgPoints: Array<{x: number, y: number}> = [];
    for (let x = 0; x < canvas.width; x += 5) {
      let y = 0;
      const centerX = canvas.width / 2;
      const dist = Math.abs(x - centerX);
      if (dist < 100 && dist > 80) {
        y = Math.sin(x * 0.1) * 30;
      } else if (dist <= 80 && dist > 40) {
        y = -Math.sin(x * 0.2) * 120;
      } else if (dist <= 40 && dist > 20) {
        y = Math.sin(x * 0.3) * 60;
      }
      ecgPoints.push({ x, y });
    }
    
    function drawWin() {
      if (!ctx || !document.getElementById('mets-win-overlay-layer')) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const progress = Math.min(frame / maxFrames, 1.0);
      const alpha = progress < 0.15 ? progress / 0.15 : (progress > 0.85 ? (1.0 - progress) / 0.15 : 1.0);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const pulse = Math.sin(frame * 0.2) * 0.15 + 0.15;
      ctx.fillStyle = `rgba(252, 92, 29, ${pulse * alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#00D4FF';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00D4FF';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ecgPoints.forEach((pt, idx) => {
        const drawX = pt.x;
        const drawY = centerY + pt.y + Math.sin(frame * 0.1 + pt.x * 0.01) * 10;
        if (idx === 0) ctx.moveTo(drawX, drawY);
        else ctx.lineTo(drawX, drawY);
      });
      ctx.stroke();
      ctx.restore();
      
      if (img.complete) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const scale = 0.95 + Math.sin(frame * 0.15) * 0.04;
        const imgW = 320 * scale;
        const imgH = 320 * scale;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY - 60, imgW / 2, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.drawImage(img, centerX - imgW / 2, centerY - 60 - imgH / 2, imgW, imgH);
        ctx.restore();
        
        ctx.strokeStyle = '#FC5C1D';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#FC5C1D';
        ctx.shadowBlur = 25;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 60, imgW / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "bold 3.5rem Impact, Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#002D62";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#FC5C1D";
      ctx.shadowBlur = 15;
      
      const glitchX = (Math.random() - 0.5) * 3;
      ctx.fillText("🎉 METS WIN! 🎉", centerX + glitchX, centerY + 140);
      ctx.strokeText("🎉 METS WIN! 🎉", centerX + glitchX, centerY + 140);
      
      ctx.font = "bold 2.2rem Inter, sans-serif";
      ctx.fillStyle = "#00D4FF";
      ctx.fillText("QUEENS CARDIAC ARREST SPECIAL!", centerX, centerY + 190);
      
      ctx.font = "italic 1.5rem Inter, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("I survived the 9th inning heart attack!", centerX, centerY + 235);
      ctx.restore();
      
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(drawWin);
      }
    }
    
    drawWin();
  }
  
  setTimeout(() => {
    portalContainer.classList.remove('tmi-ghost-shatter');
    canvas.remove();
    console.log("[TMI SYSTEM] Mets Win Takeover concluded. Environment normalized.");
  }, 4500);
}

const checkLinguisticOverlap = (_textA: string, _textB: string): boolean => {
  return false;
};

export default function VideoPlayer() {
  const { activeTheme, setActiveTheme } = useTheme();
  const { gameId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeJinx, setActiveJinx] = useState<{ userA: string; userB: string; timestamp: string } | null>(null);
  const [silencedUsers, setSilencedUsers] = useState<{ [username: string]: number }>({});
  const [spideyOverlayActive, setSpideyOverlayActive] = useState(false);

  const startSpideyTakeover = () => {
    triggerSpideyTakeover();
    setSpideyOverlayActive(true);
  };

  const startAirBenderTakeover = () => {
    triggerAirBenderTakeover();
  };

  const startMetsBlowItTakeover = () => {
    triggerMetsBlowItTakeover();
  };

  const startMetsWinTakeover = () => {
    triggerMetsWinTakeover();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success' && data.mediaUrl) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "CHAT_MESSAGE",
            user: 'james (Pilot)',
            text: inputText || "",
            mediaUrl: data.mediaUrl,
            target_game_pk: gameId || "GLOBAL"
          }));
        } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            user: 'james (Pilot)',
            text: inputText || "",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isPersona: false,
            image: data.mediaUrl
          }]);
        }
        setInputText('');
      } else {
        alert("Upload failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error uploading file");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamHeaders, setStreamHeaders] = useState<Record<string, string> | null>(null);
  const [availableStreams, setAvailableStreams] = useState<any[]>([]);
  const [customStreamInput, setCustomStreamInput] = useState('');
  const [isUpdatingStream, setIsUpdatingStream] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // Statcast Telemetry Debug Console states
  const [debugMode, setDebugMode] = useState(false);
  const [liveTelemetryLogs, setLiveTelemetryLogs] = useState<any[]>([]);
  const [historicalTelemetryLogs, setHistoricalTelemetryLogs] = useState<any[]>([]);
  const [activeDebugTab, setActiveDebugTab] = useState<'live' | 'poller'>('live');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [availableGames, setAvailableGames] = useState<any[]>([]);

  // Split-Screen & Tavern Chat states
  const [activeTab, setActiveTab] = useState<'feed' | 'chat'>('feed');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      user: 'Scruffy (Bartender)', 
      text: "Welcome to Scruffy's Tavern. Tag a fan with @ (like @barf, @dot, or @UncleStevieStan) to start the chat. Now buy a drink or get out.", 
      time: 'Now', 
      isPersona: true, 
      color: '#8B4513' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [roomPersonas, setRoomPersonas] = useState<string[]>(['@barf', '@dot', '@UncleStevieStan', '@coach_shrubbs', '@scruffy', '@wardy']);
  const [mentionState, setMentionState] = useState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
  const [isSending, setIsSending] = useState(false);
  const [activeRoster, setActiveRoster] = useState<any[]>([]);
  const [roomGeminiTokens, setRoomGeminiTokens] = useState<number>(0);
  const [roomLocalTokens, setRoomLocalTokens] = useState<number>(0);
  const [roomSysTokens, setRoomSysTokens] = useState<number>(0);
  const [showRosterHover, setShowRosterHover] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const filteredPersonas = (activeRoster && activeRoster.length > 0
    ? activeRoster.map(u => `@${u.user_name}`)
    : roomPersonas
  ).filter(p => p.toLowerCase().includes(mentionState.filter));

  // HoloLink WebRTC Calling states
  const [activeCall, setActiveCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHoloLinkExpanded, setIsHoloLinkExpanded] = useState(false);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // 1. Initial REST loads
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await axios.get(`/api/stream/${gameId}`);
        setStreamUrl(response.data.m3u8_url);
        if (response.data.stream_headers) {
          setStreamHeaders(response.data.stream_headers);
        } else {
          setStreamHeaders(null);
        }
        if (response.data.available_streams) {
          setAvailableStreams(response.data.available_streams);
        } else {
          setAvailableStreams([]);
        }
      } catch (err) {
        console.error('Failed to get stream url', err);
      }
    };

    const fetchInitialGameState = async () => {
      try {
        const response = await axios.get(`/api/sports/game_state/${gameId}`);
        setGameState(response.data);
      } catch (err) {
        console.warn('Failed to load initial cache game state:', err);
      }
    };

    const fetchRoomPersonas = async () => {
      try {
        const response = await axios.get(`/api/room_personas?gamePk=${gameId}`);
        if (response.data) {
          if (response.data.personas && response.data.personas.length > 0) {
            setRoomPersonas(response.data.personas);
          }
          setActiveRoster(response.data.roster || []);
          setRoomGeminiTokens(response.data.room_gemini_tokens || 0);
          setRoomLocalTokens(response.data.room_local_tokens || 0);
          setRoomSysTokens(response.data.room_sys_tokens || 0);
        }
      } catch (err) {
        console.warn('Failed to load room personas, using defaults');
      }
    };

    if (gameId) {
      fetchStream();
      fetchInitialGameState();
      fetchRoomPersonas();
      const interval = setInterval(fetchRoomPersonas, 10000);
      return () => clearInterval(interval);
    }
  }, [gameId]);

  useEffect(() => {
    const fetchActiveGames = async () => {
      try {
        const res = await axios.get('/api/sports/active_games');
        if (res.data && Array.isArray(res.data)) {
          setAvailableGames(res.data);
          
          // Hydration / auto-selection hook
          if (res.data.length > 0) {
            if (res.data.length === 1 || !gameId || gameId === 'default') {
              const defaultGameId = String(res.data[0].game_pk);
              console.log(`[STATE SYNC] Single or default game auto-load triggered: ${defaultGameId}`);
              navigate(`/stream/${defaultGameId}`);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load active games:", err);
      }
    };
    fetchActiveGames();
  }, [gameId, navigate]);

  // 2. Video Player Native Setup (HLS.js / Safari native HLS)
  useEffect(() => {
    if (streamUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr) => {
            if (streamHeaders) {
              Object.entries(streamHeaders).forEach(([key, val]) => {
                xhr.setRequestHeader(key, val as string);
              });
            }
          }
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.warn('Autoplay blocked', e));
          setIsPlaying(true);
        });

        return () => {
          hls.destroy();
        };
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play().catch(e => console.warn('Autoplay blocked', e));
          setIsPlaying(true);
        });
      }
    }
  }, [streamUrl, streamHeaders]);

  // Statcast Telemetry Debug Console helpers
  const fetchHistoricalLogs = async () => {
    if (!gameId) return;
    setIsLoadingHistorical(true);
    try {
      const response = await axios.get(`/api/sports/telemetry_logs?game_pk=${gameId}&limit=40`);
      setHistoricalTelemetryLogs(response.data);
    } catch (err) {
      console.warn('Failed to fetch historical telemetry logs:', err);
    } finally {
      setIsLoadingHistorical(false);
    }
  };

  useEffect(() => {
    if (debugMode) {
      fetchHistoricalLogs();
    }
  }, [debugMode, gameId]);

  // 3. TMI Telemetry WebSocket (Port 8008 Proxy)
  useEffect(() => {
    if (!gameId) return;

    let ws: WebSocket | null = null;
    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log(`Connecting to TMI Telemetry WS: ${wsUrl}`);
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to TMI Telemetry WS Relay');
        setWsConnected(true);
        ws?.send(JSON.stringify({ type: 'JOIN_ROOM', target_game_pk: gameId, room: gameId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // Buffer to live telemetry debug logs
          const logEntry = {
            id: Date.now().toString() + Math.random().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: msg.type || 'UNKNOWN',
            raw: msg
          };
          setLiveTelemetryLogs(prev => [logEntry, ...prev].slice(0, 50));

          if (msg.type === 'STATE_UPDATE' && msg.target_game_pk === gameId && msg.data) {
            console.log('Telemetry state update received:', msg.data);
            setGameState(msg.data);
          } else if (msg.type === 'CHAT_MESSAGE' && (msg.target_game_pk === gameId || msg.target_game_pk === 'GLOBAL')) {
            const newMsg: ChatMessage = {
              id: msg.id || Date.now().toString() + Math.random().toString(),
              user: msg.user || 'Advocate',
              text: msg.text || '',
              time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isPersona: msg.isPersona ?? true,
              color: msg.color,
              image: msg.mediaUrl || msg.media_url || msg.image
            };
            setMessages(prev => {
              if (prev.some(m => m.text === newMsg.text && m.user === newMsg.user && m.image === newMsg.image)) {
                return prev;
              }

              // Check if we have a Jinx trigger: eligible users post overlapping tokens in the same second
              const isEligibleUser = (username: string) => {
                return username && username !== 'SYSTEM' && !username.toLowerCase().includes('pilot') && !username.toLowerCase().includes('james');
              };

              if (isEligibleUser(newMsg.user)) {
                const jinxMatch = prev.find(m => 
                  m.time === newMsg.time && 
                  isEligibleUser(m.user) && 
                  m.user !== newMsg.user && 
                  checkLinguisticOverlap(m.text, newMsg.text)
                );

                if (jinxMatch) {
                  console.log(`[JINX DETECTED] ${jinxMatch.user} and ${newMsg.user} at ${newMsg.time}`);
                  setTimeout(() => {
                    setActiveJinx({
                      userA: jinxMatch.user,
                      userB: newMsg.user,
                      timestamp: newMsg.time
                    });

                    // Silence userB (slower agent) for 30 seconds
                    setSilencedUsers(prevSilenced => ({
                      ...prevSilenced,
                      [newMsg.user]: Date.now() + 30000
                    }));

                    // Insert local SYSTEM message notifying room
                    setMessages(messagesPrev => [...messagesPrev, {
                      id: `jinx-sys-${Date.now()}`,
                      user: "SYSTEM",
                      text: `🚫 [SILENCED BY COKE FACTOR] @${newMsg.user} has been locked out for 30 seconds for duplicate tag-teaming!`,
                      time: newMsg.time,
                      color: "#FF5910",
                      isPersona: true
                    }]);
                  }, 50);
                }
              }

              return [...prev, newMsg];
            });
          } else if (msg.type === 'webslinger_trigger') {
            const eventName = msg.event_name;
            const eventData = msg.data || {};
            
            if (eventName === 'SPIDEY_THWIP_OVERLAY' || eventData.animation === 'web_blast' || eventName === 'EMIT_CHAT_FLASH_SPIDY') {
              startSpideyTakeover();
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: eventName === 'EMIT_CHAT_FLASH_SPIDY'
                  ? "💥 Spidy Blast triggered! Swinging through the chat!"
                  : "🕸️ Spidey Web Blast activated! Multi-mesh overlay active.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#38BDF8",
                isPersona: true
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'OUTRAGE_PROXY_ALERT' || eventData.animation === 'screen_shake') {
              try {
                playSystemAudio('dirt_kick_loud.mp3');
              } catch (e) {
                console.warn("[TMI SYSTEM] Audio asset failed. Proceeding with visual-only sequence.");
              }
              
              const portalContainer = document.getElementById('main-dashboard-viewport');
              if (portalContainer) {
                portalContainer.classList.add('tmi-window-shatter');
                setTimeout(() => {
                  portalContainer.classList.remove('tmi-window-shatter');
                }, 3000);
              }
              
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🚨 Umpire Outrage Proxy Alert! Visual and Audio stethoscopes triggered mesh-wide.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#EF4444",
                isPersona: true
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'SIREN_PHYSICAL_OVERRIDE') {
              try {
                playSystemAudio('siren_alert.mp3');
              } catch (e) {
                console.warn("[TMI SYSTEM] Audio asset failed.");
              }
              const portalContainer = document.getElementById('main-dashboard-viewport');
              if (portalContainer) {
                portalContainer.classList.add('tmi-siren-flash');
                setTimeout(() => {
                  portalContainer.classList.remove('tmi-siren-flash');
                }, 4000);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🚨 SIREN OVERRIDE TRIGGERED: Govee smart bulbs flashing mesh-wide!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#EF4444",
                isPersona: true
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'EMIT_CHAT_AUDIO_GHOST' || eventName === 'EMIT_CHAT_GHOST_OVERLAY') {
              try {
                playSystemAudio('ghost_fx.mp3');
              } catch (e) {
                console.warn("[TMI SYSTEM] Audio asset failed.");
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "👻 Ghost Protocol Senga Active! Forkball splitter coordinates synchronized.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#A78BFA",
                isPersona: true
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'AIRBENDER_OVERLAY' || eventData.animation === 'airbender') {
              try {
                startAirBenderTakeover();
              } catch (e) {
                console.error("[TMI SYSTEM] Air Bender Takeover animation failed:", e);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🌪️ Devon Williams Air Bender Overlay activated!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#00FFCC",
                isPersona: true
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'METS_BLOW_IT_OVERLAY' || eventData.animation === 'mets_blow_it') {
              try {
                startMetsBlowItTakeover();
              } catch (e) {
                console.error("[TMI SYSTEM] Mets Blow It Takeover animation failed:", e);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🔥 Mets 9th Inning meltdown in progress! PANIC IN QUEENS! 🔥",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#FF5910",
                isPersona: true
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'METS_WIN_OVERLAY' || eventData.animation === 'mets_win') {
              try {
                startMetsWinTakeover();
              } catch (e) {
                console.error("[TMI SYSTEM] Mets Win Takeover animation failed:", e);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🎉 Mets Win! Queens Cardiac Arrest Special triggered! 🎉",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#FC5C1D",
                isPersona: true
              };
              setMessages(prev => [...prev, newMsg]);
            }
          }
        } catch (e) {
          console.error('Error parsing TMI state message', e);
        }
      };

      ws.onclose = () => {
        console.log('TMI Telemetry WS disconnected. Reconnecting...');
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = (err) => {
        console.error('TMI WS error:', err);
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
    };
  }, [gameId]);

  // 4. Remote Control Command WebSocket (Port 8090 Proxy)
  useEffect(() => {
    let theaterWs: WebSocket | null = null;
    const connectTheater = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/theater`;
      console.log(`Connecting to Theater Remote WS: ${wsUrl}`);
      theaterWs = new WebSocket(wsUrl);

      theaterWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'THEATER_COMMAND') {
            const cmd = data.command;
            console.log(`Remote command received: ${cmd}`);
            
            if (videoRef.current) {
              if (cmd === 'pause') {
                if (videoRef.current.paused) {
                  videoRef.current.play().catch(console.warn);
                  setIsPlaying(true);
                } else {
                  videoRef.current.pause();
                  setIsPlaying(false);
                }
              } else if (cmd === 'seek_fwd') {
                videoRef.current.currentTime += 10;
              } else if (cmd === 'seek_back') {
                videoRef.current.currentTime -= 10;
              } else if (cmd === 'quit') {
                navigate('/mlb');
              } else if (cmd === 'volume_up') {
                videoRef.current.volume = Math.min(videoRef.current.volume + 0.1, 1.0);
                setIsMuted(false);
              } else if (cmd === 'volume_down') {
                videoRef.current.volume = Math.max(videoRef.current.volume - 0.1, 0.0);
              } else if (cmd === 'mute') {
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse remote command', e);
        }
      };

      theaterWs.onclose = () => {
        setTimeout(connectTheater, 3000);
      };
    };

    connectTheater();

    return () => {
      if (theaterWs) theaterWs.close();
    };
  }, [navigate]);

  // Call Duration Timer
  useEffect(() => {
    let interval: any;
    if (activeCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  // UI Control Handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.warn);
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Base Runner Parsing Logic
  const parseRunners = (description: string) => {
    const state = { first: false, second: false, third: false };
    if (!description) return state;

    const desc = description.toLowerCase();
    if (desc.includes('homers') || desc.includes('home run')) {
      return state;
    }
    if (desc.includes('singles') || desc.includes('walks') || desc.includes('hit by pitch')) {
      state.first = true;
    }
    if (desc.includes('doubles')) {
      state.second = true;
    }
    if (desc.includes('triples')) {
      state.third = true;
    }
    if (desc.includes('to 2nd') || desc.includes('to second')) {
      state.second = true;
    }
    if (desc.includes('to 3rd') || desc.includes('to third')) {
      state.third = true;
    }
    return state;
  };

  const runners = gameState ? parseRunners(gameState.status_msg || '') : { first: false, second: false, third: false };

  const getTotals = () => {
    let awayRuns = 0, awayHits = 0, awayErrors = 0;
    let homeRuns = 0, homeHits = 0, homeErrors = 0;

    if (gameState?.innings_detail) {
      gameState.innings_detail.forEach(inn => {
        awayRuns += inn.away.runs || 0;
        awayHits += inn.away.hits || 0;
        awayErrors += inn.away.errors || 0;
        homeRuns += inn.home.runs || 0;
        homeHits += inn.home.hits || 0;
        homeErrors += inn.home.errors || 0;
      });
    } else if (gameState) {
      awayRuns = gameState.away_score || 0;
      homeRuns = gameState.home_score || 0;
    }

    return {
      away: { runs: awayRuns, hits: awayHits, errors: awayErrors },
      home: { runs: homeRuns, hits: homeHits, errors: homeErrors }
    };
  };

  const totals = getTotals();

  // Chat message submit handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText;
    setInputText('');
    setMentionState(prev => ({ ...prev, active: false }));

    // 1. Add user message locally
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user: 'james (Pilot)',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPersona: false
    };
    setMessages(prev => [...prev, userMsg]);

    setIsSending(true);

    try {
      // 2. Call backend chat API
      const response = await axios.post('/api/chat', { message: text });
      if (response.data && response.data.text) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user: response.data.persona || 'Scruffy',
          text: response.data.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPersona: true,
          color: response.data.color
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Tavern chat API failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Mention Autocomplete logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ -]*)$/);

    if (match) {
      setMentionState({
        active: true,
        filter: match[1].toLowerCase(),
        cursorIndex: match.index as number,
        selectedIndex: 0
      });
    } else {
      setMentionState({
        active: false,
        filter: '',
        cursorIndex: -1,
        selectedIndex: 0
      });
    }
  };

  const selectMention = (persona: string) => {
    const cleanPersona = persona.startsWith('@') ? persona : `@${persona}`;
    const before = inputText.slice(0, mentionState.cursorIndex);
    const after = inputText.slice(mentionState.cursorIndex + mentionState.filter.length + 1);
    const updated = `${before}${cleanPersona} ${after}`;
    setInputText(updated);
    setMentionState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        const cursorPoint = before.length + cleanPersona.length + 1;
        chatInputRef.current.setSelectionRange(cursorPoint, cursorPoint);
      }
    }, 50);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionState.active && filteredPersonas.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredPersonas.length }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredPersonas.length) % filteredPersonas.length }));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectMention(filteredPersonas[mentionState.selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
      }
    }
  };

  // HoloLink WebRTC Dial Call handlers
  const handleDialCall = async () => {
    if (activeCall) {
      // Hang up
      try {
        if (sessionId) {
          await axios.post('/api/persona-call/hangup', { session_id: sessionId });
        }
      } catch (err) {
        console.warn('Hangup request failed:', err);
      }
      cleanupCall();
      return;
    }

    try {
      // Request mic permission
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      const pc = new RTCPeerConnection();
      peerConnRef.current = pc;

      // Add local audio tracks
      micStream.getTracks().forEach(track => pc.addTrack(track, micStream));

      // Handle incoming voice track from the persona
      pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.play().catch(e => console.error('Failed to play persona audio track:', e));
        }
      };

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Post offer to HoloLink server on port 8090 proxy
      const response = await axios.post('/api/persona-call/offer', {
        sdp: pc.localDescription?.sdp,
        type: pc.localDescription?.type,
        room_id: 'scruffys_tavern',
        fan_id: 'james'
      });

      if (response.data && response.data.sdp) {
        // Apply local SDP answer returned by HoloLink
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: response.data.type,
          sdp: response.data.sdp
        }));
        
        setSessionId(response.data.session_id);
        setActiveCall(true);
      }
    } catch (err) {
      console.error('Failed to negotiate WebRTC dial call:', err);
      alert('Could not establish WebRTC voice link. Verify mic permissions.');
      cleanupCall();
    }
  };

  const cleanupCall = () => {
    setActiveCall(false);
    setSessionId(null);
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupCall();
  }, []);

  const handleApplyStreamOverride = async () => {
    if (!customStreamInput.trim()) return;
    setIsUpdatingStream(true);
    try {
      const response = await axios.post(`/api/stream/${gameId}`, {
        stream_url: customStreamInput,
        stream_source: "Manual Override",
        stream_headers: {}
      });
      if (response.data && response.data.status === 'success') {
        setStreamUrl(customStreamInput);
        setStreamHeaders({});
        setCustomStreamInput('');
        alert("Live stream override applied successfully!");
      } else {
        alert("Failed to update stream URL.");
      }
    } catch (err) {
      console.error("Failed to update stream link:", err);
      alert("Error updating stream URL. Check console for details.");
    } finally {
      setIsUpdatingStream(false);
    }
  };

  const handleSelectStream = async (url: string, name: string) => {
    setIsUpdatingStream(true);
    try {
      const response = await axios.post(`/api/stream/${gameId}`, {
        stream_url: url,
        stream_source: name,
        stream_headers: {}
      });
      if (response.data && response.data.status === 'success') {
        setStreamUrl(url);
        setStreamHeaders({});
      }
    } catch (err) {
      console.error("Failed to select stream:", err);
    } finally {
      setIsUpdatingStream(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div id="main-dashboard-viewport" className="sports-live-hub" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Upper Navigation / Environment Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div 
            style={{ 
              cursor: 'pointer', 
              padding: '0.6rem', 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onClick={() => navigate('/mlb')}
          >
            <ArrowLeft size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.5px' }}>
                {gameState ? `${gameState.away_team} @ ${gameState.home_team}` : 'Live Game Room'}
              </h2>
              <span style={{ fontSize: '0.65rem', background: '#FF3366', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>PROD</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              Sovereign Sports Predictive Engine
            </span>
          </div>
        </div>

        {/* Global Roster Token usage / Telemetry badges */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {availableGames.length > 0 && (
            <select
              value={gameId}
              onChange={(e) => {
                const newPk = e.target.value;
                console.log(`[STATE SYNC] Swapping game PK to: ${newPk}`);
                if (!newPk) {
                  navigate('/mlb');
                } else {
                  navigate(`/stream/${newPk}`);
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.75rem',
                padding: '0.4rem 0.8rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}
            >
              <option value="" style={{ background: '#1e293b', color: '#fff' }}>
                -- Select a Game Room --
              </option>
              {availableGames.map((game: any) => (
                <option 
                   key={game.game_pk} 
                  value={game.game_pk}
                  style={{ background: '#1e293b', color: '#fff' }}
                >
                  {game.away_team} @ {game.home_team} ({game.game_pk})
                </option>
              ))}
            </select>
          )}
          <span 
            className="badge-live" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(255, 51, 102, 0.1)',
              color: '#FF3366',
              border: '1px solid rgba(255, 51, 102, 0.2)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem',
              animation: 'pulse-live 2s infinite'
            }}
          >
            <Activity size={14} /> LIVE SLATE
          </span>
          <span 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: wsConnected ? 'rgba(0,255,204,0.1)' : 'rgba(255,102,102,0.1)',
              color: wsConnected ? '#00FFCC' : '#FF6666',
              border: wsConnected ? '1px solid rgba(0,255,204,0.2)' : '1px solid rgba(255,102,102,0.2)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem' 
            }}
          >
            <Radio size={14} />
            {wsConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.6)' }}>THEME:</span>
            <select 
              value={activeTheme} 
              onChange={(e) => setActiveTheme(e.target.value)}
              style={{
                background: '#090e1a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '4px',
                padding: '4px 8px',
                outline: 'none',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <option value="sovereign-cyan">Sovereign Cyan</option>
              <option value="retro-16bit">16-Bit Retro</option>
              <option value="the-show-sim">The Show Sim</option>
              <option value="sny-cinematic">SNY Cinematic</option>
              <option value="muppet-hell">Muppet Hell</option>
            </select>
          </div>
          <button
            onClick={() => setDebugMode(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: debugMode ? 'rgba(255, 170, 0, 0.15)' : 'rgba(255,255,255,0.03)',
              color: debugMode ? '#FFAA00' : 'rgba(255,255,255,0.4)',
              border: debugMode ? '1px solid rgba(255, 170, 0, 0.3)' : '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: debugMode ? '0 0 10px rgba(255, 170, 0, 0.1)' : 'none'
            }}
          >
            <Terminal size={14} />
            {debugMode ? 'DEBUG: ON' : 'TELEMETRY DEBUG'}
          </button>
        </div>
      </div>

      {/* Mobile view responsive tabs */}
      <div className="mobile-only-tabs" style={{ display: 'none', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('feed')}
          style={{ flex: 1, padding: '0.75rem', background: activeTab === 'feed' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Game Feed
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{ flex: 1, padding: '0.75rem', background: activeTab === 'chat' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Tavern Chat
        </button>
      </div>

      {/* Responsive Grid Layout */}
      <div 
        className="live-grid-responsive" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        
        {/* Left Column: Video & Telemetry Game stats */}
        <div className={`grid-feed-pane ${activeTab !== 'feed' ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Glassmorphic Video Box */}
          <div className="video-container" style={{ position: 'relative', overflow: 'hidden', background: '#000', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '16/9' }}>
            {streamUrl ? (
              <>
                <video ref={videoRef} autoPlay muted={isMuted} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                
                {/* Embedded controls HUD inside the player */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', 
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <button 
                      onClick={handlePlayPause}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button 
                      onClick={handleMuteToggle}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    DECRYPTION: ACTIVE
                  </span>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '300px' }}>
                <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid #00FFCC', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Resolving Authenticated Stream url...</p>
              </div>
            )}
          </div>

          {/* Custom Stream Override Panel */}
          <div className="vm-panel-glass" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Custom Stream Override
              </span>
              {streamUrl && (
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', wordBreak: 'break-all', maxWidth: '70%', textAlign: 'right' }}>
                  Current: {streamUrl.length > 50 ? streamUrl.substring(0, 47) + '...' : streamUrl}
                </span>
              )}
            </div>

            {availableStreams && availableStreams.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Broadcast Feed
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {availableStreams.map((stream: any) => {
                    const isActive = streamUrl === stream.url;
                    return (
                      <button
                        key={stream.name}
                        onClick={() => handleSelectStream(stream.url, stream.name)}
                        disabled={isUpdatingStream}
                        style={{
                          background: isActive 
                            ? 'linear-gradient(135deg, rgba(0, 180, 216, 0.2) 0%, rgba(0, 180, 216, 0.05) 100%)' 
                            : 'rgba(255,255,255,0.03)',
                          border: isActive 
                            ? '1px solid rgba(0, 180, 216, 0.6)' 
                            : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: isActive ? '0 0 10px rgba(0, 180, 216, 0.15)' : 'none',
                          borderRadius: '20px',
                          padding: '0.35rem 0.9rem',
                          color: isActive ? '#00b4d8' : 'rgba(255,255,255,0.7)',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        className="feed-selector-pill"
                      >
                        <span style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: isActive ? '#00b4d8' : 'rgba(255,255,255,0.3)',
                          boxShadow: isActive ? '0 0 8px #00b4d8' : 'none'
                        }} />
                        {stream.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Paste .m3u8 HLS Live Stream URL..."
                value={customStreamInput}
                onChange={(e) => setCustomStreamInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleApplyStreamOverride}
                disabled={isUpdatingStream || !customStreamInput.trim()}
                style={{
                  background: 'linear-gradient(135deg, #0A84FF 0%, #0056B3 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  opacity: (isUpdatingStream || !customStreamInput.trim()) ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {isUpdatingStream ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </div>

          {/* Admin Telemetry Debug Console Panel */}
          {debugMode && (
            <div 
              className="vm-panel-glass" 
              style={{ 
                padding: '1.25rem', 
                background: 'rgba(10, 10, 15, 0.6)', 
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 170, 0, 0.2)', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Terminal size={16} style={{ color: '#FFAA00' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    📡 Statcast Telemetry Debugger
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {activeDebugTab === 'poller' && (
                    <button
                      onClick={fetchHistoricalLogs}
                      disabled={isLoadingHistorical}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        color: '#fff',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <RefreshCw 
                        size={10} 
                        style={{
                          animation: isLoadingHistorical ? 'spin 2s linear infinite' : 'none'
                        }} 
                      />
                      {isLoadingHistorical ? 'Syncing...' : 'Sync Log'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (activeDebugTab === 'live') {
                        setLiveTelemetryLogs([]);
                      } else {
                        setHistoricalTelemetryLogs([]);
                      }
                    }}
                    style={{
                      background: 'rgba(255, 51, 102, 0.1)',
                      border: '1px solid rgba(255, 51, 102, 0.2)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      color: '#FF3366',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Trash2 size={10} />
                    Clear
                  </button>
                </div>
              </div>

              {/* Debug Console Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '1rem' }}>
                <button
                  onClick={() => setActiveDebugTab('live')}
                  style={{
                    padding: '0.5rem 0.25rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeDebugTab === 'live' ? '2px solid #FFAA00' : '2px solid transparent',
                    color: activeDebugTab === 'live' ? '#FFAA00' : 'rgba(255,255,255,0.4)',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Live Streams ({liveTelemetryLogs.length})
                </button>
                <button
                  onClick={() => setActiveDebugTab('poller')}
                  style={{
                    padding: '0.5rem 0.25rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeDebugTab === 'poller' ? '2px solid #FFAA00' : '2px solid transparent',
                    color: activeDebugTab === 'poller' ? '#FFAA00' : 'rgba(255,255,255,0.4)',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Poller File Tail ({historicalTelemetryLogs.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                {activeDebugTab === 'live' ? (
                  liveTelemetryLogs.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1.5rem 0' }}>
                      Awaiting live Statcast events via WebSocket...
                    </span>
                  ) : (
                    liveTelemetryLogs.map(log => {
                      const isExpanded = expandedLogId === log.id;
                      const isStateUpdate = log.type === 'STATE_UPDATE';
                      const isSysLog = log.type === 'SYS_LOG';
                      const badgeColor = isStateUpdate ? '#00FFCC' : isSysLog ? '#FFAA00' : '#0A84FF';
                      return (
                        <div key={log.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div 
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                              {isExpanded ? <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>[{log.timestamp}]</span>
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '3px', background: `${badgeColor}22`, color: badgeColor, fontWeight: 'bold' }}>{log.type}</span>
                              <span style={{ fontSize: '0.75rem', color: '#eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {isStateUpdate ? `${log.raw.data?.away_team} ${log.raw.data?.away_score} - ${log.raw.data?.home_score} ${log.raw.data?.home_team} | ${log.raw.data?.status_msg}` : log.raw.text || log.raw.message || ''}
                              </span>
                            </div>
                          </div>
                          {isExpanded && (
                            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <pre style={{ margin: 0, fontSize: '0.7rem', color: '#00FFCC', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(log.raw, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  historicalTelemetryLogs.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1.5rem 0' }}>
                      No historical logs found for this game.
                    </span>
                  ) : (
                    historicalTelemetryLogs.map((log, idx) => {
                      const logId = `hist-${idx}`;
                      const isExpanded = expandedLogId === logId;
                      return (
                        <div key={logId} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div 
                            onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                              {isExpanded ? <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>[{log.timestamp}]</span>
                              <span style={{ fontSize: '0.75rem', color: '#eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {log.state_summary}
                              </span>
                            </div>
                          </div>
                          {isExpanded && (
                            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {log.statcast_info && (
                                <div style={{ fontSize: '0.7rem', color: '#FFAA00', fontFamily: 'monospace', paddingBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  📡 {log.statcast_info}
                                </div>
                              )}
                              <pre style={{ margin: 0, fontSize: '0.7rem', color: '#00FFCC', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(log.raw_payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          )}

          {/* Glass Scoreboard */}
          <div className="vm-panel-glass" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Sovereign Scoreboard
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ textAlign: 'left' }}>TEAM</div>
                <div>R</div>
                <div>H</div>
                <div>E</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', textAlign: 'center', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <div style={{ textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>
                  {gameState?.away_team || 'AWAY'}
                </div>
                <div style={{ color: '#00FFCC', textShadow: '0 0 8px rgba(0,255,204,0.4)' }}>
                  {totals.away.runs}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.away.hits}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.away.errors}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', textAlign: 'center', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <div style={{ textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>
                  {gameState?.home_team || 'HOME'}
                </div>
                <div style={{ color: '#00FFCC', textShadow: '0 0 8px rgba(0,255,204,0.4)' }}>
                  {totals.home.runs}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.home.hits}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.home.errors}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Current Inning
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 300, color: '#fff' }}>
                  {gameState?.inning || 'Warmups'}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '45px', color: 'rgba(255,255,255,0.4)' }}>BALLS</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(3)].map((_, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: gameState && i < gameState.balls ? '#00FFCC' : 'rgba(255,255,255,0.15)',
                          boxShadow: gameState && i < gameState.balls ? '0 0 8px #00FFCC' : 'none' 
                        }} 
                      />
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '45px', color: 'rgba(255,255,255,0.4)' }}>STRIKES</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(2)].map((_, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: gameState && i < gameState.strikes ? '#FFCC00' : 'rgba(255,255,255,0.15)',
                          boxShadow: gameState && i < gameState.strikes ? '0 0 8px #FFCC00' : 'none' 
                        }} 
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '45px', color: 'rgba(255,255,255,0.4)' }}>OUTS</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(3)].map((_, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: gameState && i < gameState.outs ? '#FF4136' : 'rgba(255,255,255,0.15)',
                          boxShadow: gameState && i < gameState.outs ? '0 0 8px #FF4136' : 'none' 
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Neon SVG Baseball Diamond */}
          <div className="vm-panel-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <h3 style={{ alignSelf: 'flex-start', margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Base runners
            </h3>

            <svg width="180" height="180" viewBox="0 0 100 100" style={{ margin: '0.5rem 0' }}>
              <path 
                d="M 50 90 L 90 50 L 50 10 L 10 50 Z" 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.08)" 
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              <polygon 
                points="50,14 54,18 50,22 46,18" 
                fill={runners.second ? '#00FFCC' : 'rgba(0,0,0,0.5)'} 
                stroke={runners.second ? '#00FFCC' : 'rgba(255,255,255,0.2)'} 
                strokeWidth="1.5" 
                style={{ 
                  transition: 'all 0.3s ease',
                  filter: runners.second ? 'drop-shadow(0px 0px 4px #00FFCC)' : 'none'
                }}
              />

              <polygon 
                points="86,50 90,54 86,58 82,54" 
                fill={runners.first ? '#00FFCC' : 'rgba(0,0,0,0.5)'} 
                stroke={runners.first ? '#00FFCC' : 'rgba(255,255,255,0.2)'} 
                strokeWidth="1.5" 
                style={{ 
                  transition: 'all 0.3s ease',
                  filter: runners.first ? 'drop-shadow(0px 0px 4px #00FFCC)' : 'none'
                }}
              />

              <polygon 
                points="14,50 18,54 14,58 10,54" 
                fill={runners.third ? '#00FFCC' : 'rgba(0,0,0,0.5)'} 
                stroke={runners.third ? '#00FFCC' : 'rgba(255,255,255,0.2)'} 
                strokeWidth="1.5" 
                style={{ 
                  transition: 'all 0.3s ease',
                  filter: runners.third ? 'drop-shadow(0px 0px 4px #00FFCC)' : 'none'
                }}
              />

              <polygon 
                points="50,86 53,89 53,92 47,92 47,89" 
                fill="rgba(255,255,255,0.2)" 
                stroke="rgba(255,255,255,0.4)" 
                strokeWidth="1" 
              />
            </svg>

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.15rem' }}>PITCHER</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{gameState?.pitcher || '---'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.15rem' }}>BATTER</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{gameState?.batter || '---'}</span>
              </div>
            </div>

            {gameState && gameState.pitch_speed > 0 && (
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', fontSize: '0.75rem', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>PITCH</span>
                  <span style={{ fontWeight: 'bold', color: '#00FFCC' }}>{gameState.pitch_speed} mph</span>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{gameState.pitch_name || 'Fastball'}</span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>EXIT VELO</span>
                  <span style={{ fontWeight: 'bold', color: '#FFCC00' }}>{gameState.hit_speed > 0 ? `${gameState.hit_speed} mph` : '---'}</span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>DISTANCE</span>
                  <span style={{ fontWeight: 'bold', color: '#FF4136' }}>{gameState.hit_distance > 0 ? `${gameState.hit_distance} ft` : '---'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scruffy's Chat Panel & HoloLink Dial (Split Screen) */}
        <div className={`grid-chat-pane ${activeTab !== 'chat' ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* HoloLink WebRTC dial card */}
          <div className="vm-panel-glass" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: isHoloLinkExpanded ? '1rem' : '0' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setIsHoloLinkExpanded(!isHoloLinkExpanded)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: '#FF3366' }} />
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>HoloLink Telepresence</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeCall && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,51,102,0.15)', color: '#FF3366', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', animation: 'pulse-live 1.5s infinite' }}>
                    CALL ACTIVE ({formatTime(callDuration)})
                  </span>
                )}
                {isHoloLinkExpanded ? <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.6)' }} /> : <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />}
              </div>
            </div>

            {isHoloLinkExpanded && (
              <>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                  Establish a secure 1-on-1 WebRTC audio link with the room's primary persona (Barf). Dial directly from your microphone.
                </p>

                <button 
                  onClick={handleDialCall}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: 'none',
                    background: activeCall ? '#FF3366' : 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: activeCall ? '0 0 12px rgba(255,51,102,0.4)' : 'none'
                  }}
                >
                  {activeCall ? (
                    <>
                      <PhoneOff size={16} /> Hang Up (Barf)
                    </>
                  ) : (
                    <>
                      <Phone size={16} /> Dial Barf (Underpants Bandito)
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Embedded chat list panel */}
          <div className="vm-panel-glass" style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ 
              padding: '1rem', 
              borderBottom: '1px solid rgba(255,255,255,0.06)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              position: 'relative' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} style={{ color: '#00FFCC' }} />
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Scruffy's Tavern Chat</h3>
              </div>
              
              <div 
                onMouseEnter={() => setShowRosterHover(true)}
                onMouseLeave={() => setShowRosterHover(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                  {roomPersonas.length + 1} ACTIVE
                </span>
                <div style={{ display: 'flex', marginLeft: '0.2rem' }}>
                  {[...roomPersonas.slice(0, 3), "You"].map((p, i) => {
                    const rawName = p.replace('@', '').toLowerCase().trim();
                    const isUser = p === 'You';
                    const imgSrc = `/api/persona_image/${rawName.replace(/[\s-]/g, '_')}`;
                    const rosterItem = activeRoster.find(r => r.user_name.toLowerCase() === rawName);
                    const color = rosterItem?.color || '#38bdf8';
                    const initial = (rosterItem?.user_name || rawName || '?').charAt(0).toUpperCase();

                    return (
                      <div 
                        key={i} 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '1.5px solid #111827',
                          marginLeft: i > 0 ? '-8px' : '0',
                          backgroundColor: isUser ? '#38bdf8' : color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#fff',
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                          zIndex: 4 - i
                        }}
                      >
                        {isUser ? (
                          'Y'
                        ) : (
                          <img 
                            src={imgSrc} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            alt={p} 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallbackText = document.createTextNode(initial);
                              e.currentTarget.parentElement?.appendChild(fallbackText);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                  {roomPersonas.length > 3 && (
                    <div 
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '1.5px solid #111827',
                        marginLeft: '-8px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: 'rgba(255,255,255,0.7)',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 0
                      }}
                    >
                      +{roomPersonas.length - 3}
                    </div>
                  )}
                </div>

                {/* Hover Popover */}
                {showRosterHover && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    background: 'rgba(10, 12, 16, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
                    minWidth: '200px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                      padding: '0 0.25rem 0.25rem 0.25rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '8px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>In The Bar</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#22c55e' }}>🦙 {roomLocalTokens.toLocaleString()}</span>
                        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#f59e0b' }}>⚡ {roomGeminiTokens.toLocaleString()}</span>
                        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#38bdf8' }}>🤖 {roomSysTokens.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {activeRoster.length > 0 ? (
                      activeRoster.map((p, idx) => {
                        const rawName = p.user_name.toLowerCase();
                        const imgSrc = `/api/persona_image/${rawName.replace(/[\s-]/g, '_')}`;
                        const color = p.color || '#38bdf8';
                        const initial = (p.user_name || '?').charAt(0).toUpperCase();

                        return (
                          <div 
                            key={idx} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backgroundColor: color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                color: '#fff',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}>
                                <img 
                                  src={imgSrc} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  alt={rawName}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallbackText = document.createTextNode(initial);
                                    e.currentTarget.parentElement?.appendChild(fallbackText);
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {rawName}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      [...roomPersonas, 'you'].map((p, idx) => {
                        const rawName = p.replace('@', '').toLowerCase();
                        const imgSrc = `/api/persona_image/${rawName.replace(/[\s-]/g, '_')}`;
                        const color = '#38bdf8';
                        const initial = (rawName || '?').charAt(0).toUpperCase();

                        return (
                          <div 
                            key={idx} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.25rem',
                              borderRadius: '4px'
                            }}
                          >
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              backgroundColor: color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              color: '#fff',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              <img 
                                  src={imgSrc} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  alt={rawName}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallbackText = document.createTextNode(initial);
                                    e.currentTarget.parentElement?.appendChild(fallbackText);
                                  }}
                              />
                            </div>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>
                              {rawName === 'you' ? '👤 you' : rawName}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Message Area */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px' }}>
              {messages.filter(m => m.user !== 'SYSTEM').map((m) => (
                <div 
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.isPersona ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    alignSelf: m.isPersona ? 'flex-start' : 'flex-end'
                  }}
                >
                  <span style={{ fontSize: '0.65rem', color: m.color || 'rgba(255,255,255,0.4)', marginBottom: '2px', fontWeight: 'bold' }}>
                    {m.user} &bull; {m.time} {silencedUsers[m.user] && silencedUsers[m.user] > Date.now() && <span style={{ color: '#EF4444' }}>(silenced)</span>}
                  </span>
                  <div 
                    style={{
                      background: m.isPersona ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #FF3366, #FF5910)',
                      border: m.isPersona ? `1px solid ${m.color || 'rgba(255,255,255,0.08)'}` : 'none',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      color: m.isPersona ? 'rgba(255,255,255,0.85)' : '#fff',
                      lineHeight: 1.4
                    }}
                  >
                    {m.text}
                    {m.image && (
                      <div style={{ marginTop: '0.5rem', overflow: 'hidden', borderRadius: '6px' }}>
                        {m.image.endsWith('.mp4') ? (
                          <video 
                            src={m.image} 
                            controls 
                            autoPlay 
                            loop 
                            muted
                            style={{ maxWidth: '100%', height: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} 
                          />
                        ) : (
                          <img 
                            src={m.image} 
                            alt="Play Replay" 
                            style={{ maxWidth: '100%', height: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} 
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input field area */}
            <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              
              {/* Autocomplete mention list overlay */}
              {mentionState.active && filteredPersonas.length > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '0.75rem',
                  right: '0.75rem',
                  background: '#121212',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  zIndex: 10
                }}>
                  {filteredPersonas.map((p, idx) => (
                    <div 
                      key={idx}
                      onClick={() => selectMention(p)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: '#fff',
                        background: idx === mentionState.selectedIndex ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                        borderBottom: idx < filteredPersonas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                      }}
                      onMouseEnter={() => {
                        setMentionState(prev => ({ ...prev, selectedIndex: idx }));
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,video/*" 
                  style={{ display: 'none' }} 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  title="Attach media"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                >
                  <Paperclip size={16} />
                </button>
                <input 
                  type="text"
                  ref={chatInputRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type @ to mention a fan..."
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.85rem',
                    minWidth: 0
                  }}
                />
                <button 
                  type="submit"
                  disabled={isSending}
                  style={{
                    background: 'linear-gradient(135deg, #00FFCC, #00E676)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#000',
                    boxShadow: '0 0 8px rgba(0,255,204,0.3)'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

          </div>

        </div>

      </div>

      <SpideyMetOverlay triggerEvent={spideyOverlayActive} onAnimationComplete={() => setSpideyOverlayActive(false)} />
      <JinxOverlay activeJinx={activeJinx} onClear={() => setActiveJinx(null)} />
    </div>
  );
}
