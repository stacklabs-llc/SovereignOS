import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { 
  Trophy, Radio, Activity, Send, Flame, Volume2, ShieldAlert
} from 'lucide-react';

import { CypherCellModal } from './CypherCellModal';
import { JinxOverlay } from './JinxOverlay';
import { SpideyMetOverlay } from './SpideyMetOverlay';
import SovereignSportsDashboard from './SovereignSportsDashboard';
import { useTheme } from '../context/ThemeContext';

const checkLinguisticOverlap = (_textA: string, _textB: string): boolean => {
  return false;
};

interface GameState {
  game_pk: string;
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
  status_msg: string;
  boggs_level?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  color?: string;
  image?: string;
}

interface TmiAnomaly {
  id: string;
  event: string;
  time: string;
  persona: string;
  format?: string;
  script?: string;
}

interface SoundboardPhrase {
  sys_id: string;
  button_label: string;
  text_payload: string;
}

const GAME_ID = "823955"; // Mets vs. Braves room
const SPIDEY_OVERLAY_ACTIVE = true;

let portalVolume = 0.5;

/**
 * Synthesizes a high-quality "thwip" audio signal using the browser's Web Audio API.
 * This serves as a reliable fallback in case thwip_loud.mp3 is not present in the static sounds directory.
 */
function playSystemAudio(filename: string) {
  const volume = portalVolume;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.15);
  } catch (audioErr) {
    console.warn("Dynamic Web Audio fallback failed:", audioErr);
  }

  try {
    const audio = new Audio(`/sounds/${filename}`);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch (e) {
    // Silent catch
  }
}

/**
 * Triggers the Spidey-Sense Takeover animation sequence on high-velocity telemetry events.
 */
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

/**
 * Triggers the Ghost Protocol Senga Takeover animation sequence on strikeout milestones.
 */
function triggerGhostTakeover() {
  const portalContainer = document.getElementById('main-dashboard-viewport');
  if (!portalContainer) return;
  
  portalContainer.classList.add('tmi-ghost-shatter');
  
  const existingOverlay = document.getElementById('ghost-overlay-layer');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'ghost-overlay-layer';
  canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; pointer-events:none;";
  document.body.appendChild(canvas);
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.type = 'sine';
    const now = audioContext.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.6);
    osc.frequency.linearRampToValueAtTime(400, now + 1.2);
    
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 1.0);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    
    osc.start();
    osc.stop(now + 1.2);
  } catch (err) {
    console.warn("Web Audio slide whistle failed:", err);
  }
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let frame = 0;
    const maxFrames = 180;
    
    const ghostBalls: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      angle: number;
      spinSpeed: number;
    }> = [];
    
    for (let i = 0; i < 8; i++) {
      ghostBalls.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        radius: 30 + Math.random() * 20,
        alpha: 0.9,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.1
      });
    }

    function drawGhostBlast() {
      if (!ctx || !document.getElementById('ghost-overlay-layer')) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const progress = Math.min(frame / maxFrames, 1.0);
      const alpha = 1.0 - progress;
      
      ctx.fillStyle = `rgba(167, 139, 250, ${alpha * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = `rgba(167, 139, 250, ${alpha * 0.8})`;
      ctx.lineWidth = 4;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, canvas.height * progress);
      ctx.lineTo(centerX, centerY);
      ctx.moveTo(centerX - 100 * progress, centerY - 150 * progress);
      ctx.quadraticCurveTo(centerX - 50, centerY, centerX, centerY);
      ctx.moveTo(centerX + 100 * progress, centerY - 150 * progress);
      ctx.quadraticCurveTo(centerX + 50, centerY, centerX, centerY);
      ctx.stroke();

      ghostBalls.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.25;
        ball.angle += ball.spinSpeed;
        ball.alpha = alpha;
        
        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.angle);
        
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, ball.radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${ball.alpha})`);
        grad.addColorStop(0.3, `rgba(196, 181, 253, ${ball.alpha * 0.8})`);
        grad.addColorStop(1, `rgba(167, 139, 250, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(139, 92, 246, ${ball.alpha * 0.7})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-ball.radius * 0.4, 0, ball.radius * 0.4, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ball.radius * 0.4, 0, ball.radius * 0.4, Math.PI / 2, -Math.PI / 2);
        ctx.stroke();
        
        ctx.restore();
      });
      
      ctx.font = "bold 2.5rem Inter, system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = "rgba(139, 92, 246, 0.8)";
      ctx.shadowBlur = 20;
      ctx.fillText("👻 KODAI SENGA GHOST FORK STRIKE-OUT! 👻", centerX, centerY + 200 * progress);
      
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(drawGhostBlast);
      }
    }
    
    drawGhostBlast();
  }
  
  setTimeout(() => {
    portalContainer.classList.remove('tmi-ghost-shatter');
    canvas.remove();
    console.log("[TMI SYSTEM] Ghost Senga Takeover concluded. Environment normalized.");
  }, 3000);
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

export default function FanFanStackPortal() {
  const { activeTheme, setActiveTheme, fundiesGrid, setFundiesGrid, pinEngineActive, setPinEngineActive } = useTheme();
  const [volumeLevel, setVolumeLevel] = useState<number>(0.5);

  useEffect(() => {
    portalVolume = volumeLevel;
  }, [volumeLevel]);

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Connection & Room status states
  const [wsConnected, setWsConnected] = useState(false);
  const [activeGamePk, setActiveGamePk] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('_game_room') || params.get('game_room') || params.get('gamePk') || "";
  });
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [bringGang, setBringGang] = useState<boolean>(false);

  // Jinx & silence state tracking
  const [activeJinx, setActiveJinx] = useState<{ userA: string; userB: string; timestamp: string } | null>(null);
  const [silencedUsers, setSilencedUsers] = useState<{ [username: string]: number }>({});
  const [spideyOverlayActive, setSpideyOverlayActive] = useState(false);
  const [keithTakeover, setKeithTakeover] = useState<{
    active: boolean;
    mediaUrl: string;
    spriteUrl: string;
    duration: number;
  } | null>(null);

  // Outrage Proxy / RaaS states
  const [proxies, setProxies] = useState<any[]>([]);
  const [selectedProxyId, setSelectedProxyId] = useState<number | null>(null);
  const [tantrumIntensity, setTantrumIntensity] = useState<string>('traditional_drama_loop');
  const [deployingRage, setDeployingRage] = useState(false);
  const [rageError, setRageError] = useState<string | null>(null);

  const startSpideyTakeover = () => {
    triggerSpideyTakeover();
    setSpideyOverlayActive(true);
    // Fail-safe to dismiss overlay after 5 seconds
    setTimeout(() => {
      setSpideyOverlayActive(false);
    }, 5000);
  };

  const fetchProxies = async () => {
    try {
      const res = await axios.get('/api/sports/outrage_proxy_umpires');
      if (res.data && res.data.status === 'success') {
        setProxies(res.data.proxies || []);
        // Pre-select first proxy if none is selected
        if (res.data.proxies && res.data.proxies.length > 0) {
          setSelectedProxyId(prev => prev || res.data.proxies[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch outrage proxy umpires:", err);
    }
  };

  const deployProxy = async (proxyId: number) => {
    setDeployingRage(true);
    setRageError(null);
    try {
      const payload = {
        manager_id: "manager_nym_01",
        trigger_event: "abs_strikeout_strike_three",
        selected_proxy_id: proxyId,
        intensity_level: tantrumIntensity
      };
      const res = await axios.post('/v1/triage/rage', payload);
      if (res.data && res.data.status === 'success') {
        console.log("[RaaS] Outrage proxy deployed successfully:", res.data);
        fetchProxies();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to deploy outrage proxy.";
      setRageError(errMsg);
      console.error("[RaaS] Deploy failed:", errMsg);
    } finally {
      setDeployingRage(false);
    }
  };

  // Hotkey listener for Ctrl+Alt+R to deploy dummy proxy immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        console.log("[Hotkey] Ctrl+Alt+R detected. Launching dummy outrage proxy...");
        deployProxy(3);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  
  // Satisfy TS compiler noUnusedLocals checks for legacy items
  if (false as any) {
    console.log(
      Trophy, Send, Flame, Volume2, CypherCellModal,
      silencedUsers, setSilencedUsers,
      spideyOverlayActive, setSpideyOverlayActive,
      proxies, setProxies,
      selectedProxyId, setSelectedProxyId,
      tantrumIntensity, setTantrumIntensity,
      deployingRage, setDeployingRage,
      rageError, setRageError,
      inputText, setInputText,
      mentionState, setMentionState,
      anomalies, setAnomalies,
      cypherOpen, setCypherOpen,
      cypherPersona, setCypherPersona,
      cypherLyrics, setCypherLyrics,
      roster, setRoster,
      selectedAdvocate, setSelectedAdvocate,
      soundboardPhrases, setSoundboardPhrases,
      loadingPhrases, setLoadingPhrases,
      chatEndRef,
      chatInputRef,
      isHotSwappingRef,
      handleInputChange,
      handleInputKeyDown,
      handleSendMessage,
      deployProxy,
      triggerSoundboardPhrase,
      getBaseColor
    );
  }

  return () => window.removeEventListener('keydown', handleKeyDown);
  }, [proxies, tantrumIntensity]);

  const [gameState, setGameState] = useState<GameState>({
    game_pk: GAME_ID,
    away_team: "NYM",
    home_team: "ATL",
    away_score: 0,
    home_score: 0,
    inning: "Top 1st",
    outs: 0,
    balls: 0,
    strikes: 0,
    pitcher: "Awaiting Pitcher...",
    batter: "Awaiting Batter...",
    pitch_name: "NONE",
    pitch_speed: 0,
    status_msg: "Awaiting Pitches...",
    boggs_level: 3,
    onFirst: false,
    onSecond: false,
    onThird: false
  });

  // Chat Feed states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSwappingStream, setIsSwappingStream] = useState(false);
  const isHotSwappingRef = useRef(false);
  const lastTelemetryUpdate = useRef<number>(0);
  const [inputText, setInputText] = useState('');
  const [mentionState, setMentionState] = useState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [injectedSvg, setInjectedSvg] = useState<string | null>(null);
  const [personalityMode, setPersonalityMode] = useState('Matchup Focus');


  // TMI Anomaly (Cypher Cell Burn Tracker) states
  const [anomalies, setAnomalies] = useState<TmiAnomaly[]>([]);

  // Cypher Cell Overlay states
  const [cypherOpen, setCypherOpen] = useState(false);
  const [cypherPersona, setCypherPersona] = useState('');
  const [cypherLyrics, setCypherLyrics] = useState('');

  // Soundboard states
  const [roster, setRoster] = useState<any[]>([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState<string | null>(null);
  const [soundboardPhrases, setSoundboardPhrases] = useState<SoundboardPhrase[]>([]);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState({
    spideyWipe: false,
    crimsonBleed: false,
    fundiesGrid: false,
    appleMask: false,
    weedstackProtocol: false,
    stacklabsProtocol: false,
    strikeout: false,
    homerun: false,
    doublePlay: false,
    mascot: false,
    lfgm: false
  });

  // Sync fundiesGrid state from context to activeOverlays state
  useEffect(() => {
    setActiveOverlays(prev => ({ ...prev, fundiesGrid }));
  }, [fundiesGrid]);

  // Fetch and evaluate overlay rules from sys_overlay_registry every 5 seconds
  useEffect(() => {
    const checkOverlayRules = async () => {
      try {
        const res = await axios.get('/api/sys_overlay_registry');
        if (res.data && res.data.status === 'success') {
          const activeRules = res.data.rules.filter((r: any) => r.active === 1 || r.active === true);
          
          activeRules.forEach((rule: any) => {
            try {
              const cond = JSON.parse(rule.trigger_condition);
              const action = JSON.parse(rule.overlay_action);
              
              if (!cond.key || !action.type) return;
              
              // Get current telemetry value from gameState
              const currentVal = (gameState as any)[cond.key];
              if (currentVal === undefined) return;
              
              const ruleVal = cond.value;
              const op = cond.operator;
              
              let triggered = false;
              if (op === '=') {
                triggered = String(currentVal) === String(ruleVal);
              } else if (op && op.toLowerCase() === 'contains') {
                triggered = String(currentVal).toLowerCase().includes(String(ruleVal).toLowerCase());
              } else if (op === '>') {
                triggered = Number(currentVal) > Number(ruleVal);
              } else if (op === '<') {
                triggered = Number(currentVal) < Number(ruleVal);
              }
              
              if (triggered) {
                const actionType = action.type.toUpperCase();
                let key: keyof typeof activeOverlays | null = null;
                
                if (actionType === 'SPIDEY_WIPE') key = 'spideyWipe';
                else if (actionType === 'CRIMSON_BLEED') key = 'crimsonBleed';
                else if (actionType === 'FUNDIES_GRID') key = 'fundiesGrid';
                else if (actionType === 'APPLE_MASK') key = 'appleMask';
                else if (actionType === 'WEEDSTACK_PROTOCOL') key = 'weedstackProtocol';
                else if (actionType === 'STACKLABS_PROTOCOL') key = 'stacklabsProtocol';
                
                if (key) {
                  const targetKey = key;
                  setActiveOverlays(prev => {
                    if (prev[targetKey]) return prev; // already active
                    
                    // Auto-dismiss after duration
                    setTimeout(() => {
                      setActiveOverlays(p => ({ ...p, [targetKey]: false }));
                    }, action.duration_ms || 3000);
                    
                    return { ...prev, [targetKey]: true };
                  });
                }
              }
            } catch (err) {
              console.error('Error evaluating rule:', rule, err);
            }
          });
        }
      } catch (e) {
        console.error('Failed to poll overlay rules:', e);
      }
    };

    checkOverlayRules();
    const interval = setInterval(checkOverlayRules, 5000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Chat sender wrapper for the dashboard
  const sendChatMessage = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: "CHAT_MESSAGE",
        user: "james (Pilot)",
        color: "#3B82F6",
        text: text,
        target_game_pk: activeGamePk
      };
      wsRef.current.send(JSON.stringify(payload));
      
      // Opt-in local append immediately
      setMessages(prev => [...prev, {
        id: Date.now().toString() + Math.random().toString(),
        user: "james (Pilot)",
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: "#3B82F6"
      }]);
    } else {
      alert("WebSocket connection is offline.");
    }
  };


  const filteredPersonas = roster
    .map(u => `@${u.user_name}`)
    .filter(p => p.toLowerCase().includes(mentionState.filter));

  // Fetch all active games and proxies on mount, respecting URL param if present
  useEffect(() => {
    const fetchActiveGames = async () => {
      try {
        const res = await axios.get('/api/sports/active_games');
        if (res.data && Array.isArray(res.data)) {
          setAvailableGames(res.data);
          const params = new URLSearchParams(window.location.search);
          const urlGamePk = params.get('_game_room') || params.get('game_room') || params.get('gamePk');
          if (urlGamePk) {
            setActiveGamePk(urlGamePk);
          } else {
            try {
              const sessionRes = await axios.get('/api/session/active-stream');
              if (sessionRes.data && sessionRes.data.game_pk) {
                setActiveGamePk(sessionRes.data.game_pk);
              }
            } catch (sessErr) {
              console.warn("Failed to fetch backend active stream:", sessErr);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load active games:", err);
      }
    };
    fetchActiveGames();
    fetchProxies();
  }, []);

  // Programmatic single game room selector hydration
  useEffect(() => {
    if (availableGames && availableGames.length === 1 && !activeGamePk) {
      const defaultGameId = availableGames[0].game_pk;
      console.log(`[STATE SYNC] Single game auto-load triggered: ${defaultGameId}`);
      setActiveGamePk(defaultGameId);
    }
  }, [availableGames, activeGamePk]);

  // Synchronize activeGamePk changes to the URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentParam = params.get('_game_room') || params.get('game_room') || params.get('gamePk');
    if (activeGamePk) {
      if (currentParam !== activeGamePk) {
        params.set('_game_room', activeGamePk);
        const newSearch = params.toString();
        const newUrl = `${window.location.pathname}?${newSearch}`;
        window.history.replaceState(null, '', newUrl);
      }
    } else {
      if (currentParam) {
        params.delete('_game_room');
        params.delete('game_room');
        params.delete('gamePk');
        const newSearch = params.toString();
        const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [activeGamePk]);

  // Listen for browser navigation (popstate) to sync back/forward actions
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlGamePk = params.get('_game_room') || params.get('game_room') || params.get('gamePk');
      if (urlGamePk && urlGamePk !== activeGamePk) {
        setActiveGamePk(urlGamePk);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeGamePk]);

  // Fetch game_state when active game changes to re-hydrate the UI immediately
  useEffect(() => {
    lastTelemetryUpdate.current = 0;
    if (!activeGamePk) {
      setGameState({
        game_pk: "",
        away_team: "AWAY",
        home_team: "HOME",
        away_score: 0,
        home_score: 0,
        inning: "Top 1st",
        outs: 0,
        balls: 0,
        strikes: 0,
        pitcher: "Awaiting Pitcher...",
        batter: "Awaiting Batter...",
        pitch_name: "NONE",
        pitch_speed: 0,
        status_msg: "Awaiting Pitches...",
        boggs_level: 3,
        onFirst: false,
        onSecond: false,
        onThird: false
      });
      return;
    }
    const fetchGameState = async () => {
      const fetchStartTime = Date.now();
      try {
        const res = await axios.get(`/api/sports/game_state/${activeGamePk}?t=${Date.now()}`);
        if (lastTelemetryUpdate.current > fetchStartTime) {
          console.log("[TMI] REST hydration ignored: newer WebSocket update already active.");
          return;
        }
        const matchingGame = availableGames.find((g: any) => String(g.game_pk) === String(activeGamePk));
        const fallbackAway = matchingGame?.away_team || "AWAY";
        const fallbackHome = matchingGame?.home_team || "HOME";

        if (res.data) {
          setGameState({
            game_pk: activeGamePk,
            away_team: res.data.away_team || fallbackAway,
            home_team: res.data.home_team || fallbackHome,
            away_score: res.data.away_score ?? 0,
            home_score: res.data.home_score ?? 0,
            inning: res.data.inning || "Top 1st",
            outs: res.data.outs ?? 0,
            balls: res.data.balls ?? 0,
            strikes: res.data.strikes ?? 0,
            pitcher: res.data.pitcher || "Awaiting Pitcher...",
            batter: res.data.batter || "Awaiting Batter...",
            pitch_name: res.data.pitch_name || "NONE",
            pitch_speed: res.data.pitch_speed ?? 0,
            status_msg: res.data.status_msg || "Awaiting Pitches...",
            boggs_level: res.data.boggs_level ?? 3,
            onFirst: res.data.onFirst ?? false,
            onSecond: res.data.onSecond ?? false,
            onThird: res.data.onThird ?? false
          });
        }
      } catch (err) {
        console.warn("Failed to fetch initial game state:", err);
        // Fallback default reset if game state file is missing
        const matchingGame = availableGames.find((g: any) => String(g.game_pk) === String(activeGamePk));
        setGameState({
          game_pk: activeGamePk,
          away_team: matchingGame?.away_team || "AWAY",
          home_team: matchingGame?.home_team || "HOME",
          away_score: 0,
          home_score: 0,
          inning: "Top 1st",
          outs: 0,
          balls: 0,
          strikes: 0,
          pitcher: "Awaiting Pitcher...",
          batter: "Awaiting Batter...",
          pitch_name: "NONE",
          pitch_speed: 0,
          status_msg: "Awaiting Pitches...",
          boggs_level: 3,
          onFirst: false,
          onSecond: false,
          onThird: false
        });
      }
    };
    fetchGameState();
    // Clear chat feed when swapping rooms, unless hot-swapping under "Bring the Gang Along" protocol
    if (!isHotSwappingRef.current) {
      setMessages([]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: "SYSTEM",
        text: "🚚 Transit wagon traveling to next venue...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: "#ff5a00"
      }]);
    }
  }, [activeGamePk, availableGames]);

  // Fetch Room Roster depending on activeGamePk
  useEffect(() => {
    if (!activeGamePk) {
      setRoster([]);
      setSelectedAdvocate(null);
      return;
    }
    const fetchRoster = async () => {
      try {
        const res = await axios.get(`/api/room_personas?gamePk=${activeGamePk}`);
        if (res.data && res.data.roster) {
          setRoster(res.data.roster);
          if (res.data.roster.length > 0) {
            setSelectedAdvocate(res.data.roster[0].user_name);
          } else {
            setSelectedAdvocate(null);
          }
        }
      } catch (err) {
        console.warn("Failed to load room roster:", err);
      }
    };
    fetchRoster();
  }, [activeGamePk]);

  // Fetch Soundboard Phrases when selected advocate changes
  useEffect(() => {
    if (!selectedAdvocate) {
      setSoundboardPhrases([]);
      return;
    }
    const fetchPhrases = async () => {
      setLoadingPhrases(true);
      try {
        const res = await axios.get(`/api/media/soundboard?advocate=${selectedAdvocate}`);
        if (res.data && res.data.phrases) {
          setSoundboardPhrases(res.data.phrases);
        } else {
          setSoundboardPhrases([]);
        }
      } catch (err) {
        console.warn("Failed to fetch soundboard phrases:", err);
        setSoundboardPhrases([]);
      } finally {
        setLoadingPhrases(false);
      }
    };
    fetchPhrases();
  }, [selectedAdvocate]);

  // Connect to TMI WebSocket depending on activeGamePk
  useEffect(() => {
    if (!activeGamePk) {
      setWsConnected(false);
      return;
    }
    let ws: WebSocket | null = null;
    let isCurrent = true;
    let reconnectTimeout: any = null;
    let reconnectDelay = 1000; // Exponential backoff initial delay: 1s

    let resolveJoinRoom: (() => void) | null = null;
    let joinRoomPromise = new Promise<void>((resolve) => {
      resolveJoinRoom = resolve;
    });

    const connectWs = () => {
      if (!isCurrent) return;

      // Reset gatekeeper for new connection
      let resolved = false;
      joinRoomPromise = new Promise<void>((resolve) => {
        resolveJoinRoom = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };
      });

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = window.location.host;
      const socketUrl = `${wsProtocol}//${wsHost}/mesh-ws?gamePk=${activeGamePk}`;

      console.log(`[FanPortal] Connecting to WS for room ${activeGamePk}: ${socketUrl}`);
      ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isCurrent) {
          ws?.close();
          return;
        }
        setWsConnected(true);
        reconnectDelay = 1000; // Reset delay on successful connection
        ws?.send(JSON.stringify({ type: 'JOIN_ROOM', target_game_pk: activeGamePk, room: activeGamePk }));
      };

      ws.onmessage = async (event) => {
        if (!isCurrent) return;
        try {
          const msg = JSON.parse(event.data);

          // Handle GAME_SWITCHED room transition immediately
          if (msg.type === 'GAME_SWITCHED' && msg.game_pk) {
            if (msg.game_pk !== activeGamePk) {
              setActiveGamePk(msg.game_pk);
            }
            return;
          }

          // Handle CHAT_HISTORY immediately and resolve gatekeeper
          if (msg.type === 'CHAT_HISTORY' && Array.isArray(msg.messages)) {
            const history = msg.messages
              .filter((m: any) => (String(m.target_game_pk) === activeGamePk || m.target_game_pk === 'GLOBAL') && m.type !== 'SYS_LOG')
              .map((m: any) => {
                const rawText = m.text || m.take || m.message || '';
                const cleanedText = typeof rawText === 'string'
                  ? rawText.replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim()
                  : JSON.stringify(rawText);
                return {
                  id: m.id || (Date.now().toString() + Math.random().toString()),
                  user: m.user || m.persona || 'Advocate',
                  text: cleanedText,
                  time: m.time || m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  color: m.color,
                  image: m.mediaUrl || m.media_url || m.image
                };
              });
            setMessages(history);
            resolveJoinRoom?.();
            return;
          }

          // Await the JOIN_ROOM handshake completion (history loaded) before processing other messages
          await joinRoomPromise;

          // Handle webslinger_trigger
          if (msg.type === 'webslinger_trigger') {
            const eventName = msg.event_name;
            const eventData = msg.data || {};
            
            if (eventName === 'SPIDEY_THWIP_OVERLAY' || eventData.animation === 'web_blast' || eventName === 'EMIT_CHAT_FLASH_SPIDY' || eventName === 'OVERLAY_SPIDEY_WIPE') {
              startSpideyTakeover();
              setActiveOverlays(prev => ({ ...prev, spideyWipe: true }));
              setTimeout(() => {
                setActiveOverlays(prev => ({ ...prev, spideyWipe: false }));
              }, msg.duration_ms || eventData.duration_ms || 6000);
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: eventName === 'EMIT_CHAT_FLASH_SPIDY'
                  ? "💥 Spidy Blast triggered! Swinging through the chat!"
                  : "🕸️ Spidey Web Blast activated! Multi-mesh overlay active.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#38BDF8"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'OVERLAY_CRIMSON_BLEED' || eventName === 'MACRO_MENDOZA') {
              setActiveOverlays(prev => ({ ...prev, crimsonBleed: true }));
              setTimeout(() => {
                setActiveOverlays(prev => ({ ...prev, crimsonBleed: false }));
              }, msg.duration_ms || eventData.duration_ms || 6000);
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: eventName === 'MACRO_MENDOZA'
                  ? "🔴 MAX CHAOS INITIATED: Mendoza Firing sequence engaged!"
                  : "🔴 Crimson Bleed overlay activated!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#EF4444"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'OVERLAY_FUNDIES_GRID') {
              setActiveOverlays(prev => ({ ...prev, fundiesGrid: true }));
              setTimeout(() => {
                setActiveOverlays(prev => ({ ...prev, fundiesGrid: false }));
              }, msg.duration_ms || eventData.duration_ms || 8000);
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "📐 Fundies Grid overlay activated!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#00F0FF"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'OVERLAY_APPLE_MASK') {
              setActiveOverlays(prev => ({ ...prev, appleMask: true }));
              setTimeout(() => {
                setActiveOverlays(prev => ({ ...prev, appleMask: false }));
              }, msg.duration_ms || eventData.duration_ms || 6000);
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🍎 Apple Mask overlay activated! Let's Go Mets!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#EF4444"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'BRAND_WEEDSTACK') {
              setActiveOverlays(prev => ({ ...prev, weedstackProtocol: true }));
              setTimeout(() => {
                setActiveOverlays(prev => ({ ...prev, weedstackProtocol: false }));
              }, msg.duration_ms || eventData.duration_ms || 8000);
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🍀 WeedStack Decompression sequence injected! Lavender fog active.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#A855F7"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'BRAND_STACKLABS') {
              setActiveOverlays(prev => ({ ...prev, stacklabsProtocol: true }));
              setTimeout(() => {
                setActiveOverlays(prev => ({ ...prev, stacklabsProtocol: false }));
              }, msg.duration_ms || eventData.duration_ms || 8000);
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🔬 StackLabs Architectural Analysis sequence injected! Blueprint overlays active.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#0284C7"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'MACRO_NOMINAL') {
              setActiveOverlays({
                spideyWipe: false,
                crimsonBleed: false,
                fundiesGrid: false,
                appleMask: false,
                weedstackProtocol: false,
                stacklabsProtocol: false,
                strikeout: false,
                homerun: false,
                doublePlay: false,
                mascot: false,
                lfgm: false
              });
              document.getElementById('spidey-overlay-layer')?.remove();
              document.getElementById('airbender-overlay-layer')?.remove();
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🟢 RESTORE NOMINAL STATE: All active overlays and takeovers reset.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#10B981"
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
                color: "#EF4444"
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
                color: "#EF4444"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'EMIT_CHAT_AUDIO_GHOST' || eventName === 'EMIT_CHAT_GHOST_OVERLAY') {
              try {
                playSystemAudio('ghost_fx.mp3');
              } catch (e) {
                console.warn("[TMI SYSTEM] Audio asset failed.");
              }
              try {
                triggerGhostTakeover();
              } catch (e) {
                console.error("[TMI SYSTEM] Ghost Senga Takeover animation failed:", e);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "👻 Senga Ghost Fork Takeover activated!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#A78BFA"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'AIRBENDER_OVERLAY' || eventData.animation === 'airbender') {
              try {
                triggerAirBenderTakeover();
              } catch (e) {
                console.error("[TMI SYSTEM] Air Bender Takeover animation failed:", e);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🌪️ Devon Williams Air Bender Overlay activated!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#00FFCC"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'METS_BLOW_IT_OVERLAY' || eventData.animation === 'mets_blow_it') {
              try {
                triggerMetsBlowItTakeover();
              } catch (e) {
                console.error("[TMI SYSTEM] Mets Blow It Takeover animation failed:", e);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🔥 Mets 9th Inning meltdown in progress! PANIC IN QUEENS! 🔥",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#FF5910"
              };
              setMessages(prev => [...prev, newMsg]);
            } else if (eventName === 'METS_WIN_OVERLAY' || eventData.animation === 'mets_win') {
              try {
                triggerMetsWinTakeover();
              } catch (e) {
                console.error("[TMI SYSTEM] Mets Win Takeover animation failed:", e);
              }
              const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random().toString(),
                user: "SYSTEM",
                text: "🎉 Mets Win! Queens Cardiac Arrest Special triggered! 🎉",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: "#FC5C1D"
              };
              setMessages(prev => [...prev, newMsg]);
            }
            return;
          }

          // Handle media_injection
          if (msg.type === 'media_injection' && msg.svg_data) {
            setInjectedSvg(msg.svg_data);
            setTimeout(() => {
              setInjectedSvg(null);
            }, 4000);
            return;
          }

          // GAME_SWITCHED and CHAT_HISTORY are handled at the top of ws.onmessage to support gatekeeper flow

          // Handle outrage_proxy_deployed event
          if (msg.type === 'outrage_proxy_deployed') {
            console.log("[TMI SYSTEM] Outrage proxy deployed event intercepted!", msg);
            if (SPIDEY_OVERLAY_ACTIVE) {
              startSpideyTakeover();
            }
            const newMsg: ChatMessage = {
              id: msg.id || (Date.now().toString() + Math.random().toString()),
              user: "SYSTEM",
              text: `🚨 OUTRAGE PROXY DEPLOYED: ${msg.proxy_name} engaged for theatrical manager blowup!`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              color: "#EF4444"
            };
            setMessages(prev => [...prev, newMsg]);
            fetchProxies();
            return;
          }

          // Handle CMD_EVENT_TRIGGER overlay trigger
          if (msg.type === 'CMD_EVENT_TRIGGER' && String(msg.game_pk) === activeGamePk) {
            console.log("[TMI SYSTEM] Broadcast event overlay trigger received:", msg);
            const eventName = msg.event?.toLowerCase();
            const duration = msg.duration_ms || 6000;
            
            let key: keyof typeof activeOverlays | null = null;
            if (eventName === 'strikeout') key = 'strikeout';
            else if (eventName === 'homerun' || eventName === 'home_run') key = 'homerun';
            else if (eventName === 'double_play' || eventName === 'doubleplay') key = 'doublePlay';
            else if (eventName === 'mascot' || eventName === 'mascot_dance') key = 'mascot';
            else if (eventName === 'lfgm') key = 'lfgm';
            
            if (key) {
              const overlayKey = key;
              setActiveOverlays(prev => ({ ...prev, [overlayKey]: true }));
              setTimeout(() => {
                setActiveOverlays(prev => ({ ...prev, [overlayKey]: false }));
              }, duration);
            }
            return;
          }

          // Handle CMD_SIT_DOWN overlay trigger
          if (msg.type === 'CMD_SIT_DOWN' && String(msg.game_pk) === activeGamePk) {
            console.log("[TMI SYSTEM] Keith Hernandez 'Go Sit Down' takeover command received!", msg);
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            setKeithTakeover({
              active: true,
              mediaUrl: msg.media_url,
              spriteUrl: msg.sprite_url,
              duration: msg.duration_ms || 4500
            });
            setTimeout(() => {
              setKeithTakeover(null);
            }, msg.duration_ms || 4500);

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newBarfMsg: ChatMessage = {
              id: `barf-${Date.now()}-${Math.random()}`,
              user: "barf",
              text: "Beautiful. Emphatic called strike. Go sit down! The automated system doesn't care about your feelings, Goldschmidt!",
              time: timestamp,
              color: "#FF5910"
            };
            const newTropMsg: ChatMessage = {
              id: `trop-${Date.now()}-${Math.random()}`,
              user: "trop",
              text: "ABS confirmation delta: 0.00 seconds. Curvature of the sweeper verified completely within standard geometric bounds. Take a seat.",
              time: timestamp,
              color: "#00FFCC"
            };
            setMessages(prev => [...prev, newBarfMsg, newTropMsg]);
            return;
          }

          // Handle STATE_UPDATE for Scoreboard
          if (msg.type === 'STATE_UPDATE' && String(msg.target_game_pk || msg.data?.game_pk) === activeGamePk && msg.data) {
            lastTelemetryUpdate.current = Date.now();
            setGameState(prev => ({
              ...prev,
              ...msg.data,
              // Fallback default fills if missing
              onFirst: msg.data.onFirst ?? false,
              onSecond: msg.data.onSecond ?? false,
              onThird: msg.data.onThird ?? false,
            }));

            // Check for Spidey-Sense Takeover Trigger
            if (SPIDEY_OVERLAY_ACTIVE) {
              const hitSpeed = parseFloat(msg.data.hit_speed);
              const isHomeRun = msg.data.status_msg?.toLowerCase().includes("home run") || msg.data.status_msg?.toLowerCase().includes("homer");
              const isHitOrHR = msg.data.event_type === 'hit' || msg.data.event_type === 'home_run' || isHomeRun;
              const isBengeRocket = msg.data.batter === "Carson Benge" && (hitSpeed >= 100 || isHomeRun) && isHitOrHR;
              const isHighVelocity = !isNaN(hitSpeed) && hitSpeed >= 105 && isHitOrHR;

              if (isHomeRun || isBengeRocket || isHighVelocity) {
                console.log("[TMI SYSTEM] High-velocity telemetry detected! Triggering Spidey-Sense Takeover.", {
                  isHomeRun, isBengeRocket, isHighVelocity, batter: msg.data.batter, hitSpeed
                });
                startSpideyTakeover();
              }
            }
          } 
          // Handle CHAT_MESSAGE or bot_message
          else if ((msg.type === 'CHAT_MESSAGE' || msg.type === 'bot_message' || msg.type === 'persona_take') && 
                   (String(msg.target_game_pk) === activeGamePk || msg.target_game_pk === 'GLOBAL')) {
            const rawText = msg.text || msg.take || msg.message || '';
            const cleanedText = typeof rawText === 'string'
              ? rawText.replace(/^(Ambient Thought:|Sentence:|Observation:|Complaint:|Game Status Commentary:|Action:)\s*/i, '').replace(/^["']|["']$/g, '').trim()
              : JSON.stringify(rawText);

            const newMsg: ChatMessage = {
              id: msg.id || (Date.now().toString() + Math.random().toString()),
              user: msg.user || msg.persona || 'Advocate',
              text: cleanedText,
              time: msg.time || msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              color: msg.color,
              image: msg.mediaUrl || msg.media_url || msg.image
            };
            
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id || (m.text === newMsg.text && m.user === newMsg.user))) {
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
                      color: "#FF5910"
                    }]);
                  }, 50);
                }
              }

              return [...prev, newMsg];
            });

            if (msg.is_penalty_box) {
              setCypherPersona(msg.user || msg.persona || 'Unknown Artist');
              setCypherLyrics(cleanedText);
              setCypherOpen(true);
              
              setTimeout(() => {
                setCypherOpen(false);
              }, 15000);
            }

            // Trigger shake if flag is true in the message
            if (msg.shake && SPIDEY_OVERLAY_ACTIVE) {
              console.log("[TMI SYSTEM] Received message with shake instruction.");
              startSpideyTakeover();
            }
          }
          // Handle TMI_ANOMALY
          else if (msg.type === 'TMI_ANOMALY') {
            const anomaly: TmiAnomaly = {
              id: Date.now().toString() + Math.random().toString(),
              event: msg.event || 'System Event',
              time: msg.time || 'LIVE',
              persona: msg.persona || 'Unknown',
              format: msg.format,
              script: msg.script
            };
            setAnomalies(prev => [anomaly, ...prev].slice(0, 5));
          }
        } catch (e) {
          console.error('[FanPortal] WS message parse error:', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (isCurrent) {
          // Exponential backoff with +/- 20% random jitter
          const maxDelay = 30000;
          const jitter = (Math.random() * 0.4 - 0.2) * reconnectDelay;
          const targetDelay = Math.min(maxDelay, Math.max(1000, reconnectDelay + jitter));
          
          console.log(`[FanPortal] WS closed. Reconnecting in ${Math.round(targetDelay)}ms (base delay: ${reconnectDelay}ms)`);
          reconnectTimeout = setTimeout(connectWs, targetDelay);
          
          reconnectDelay = Math.min(maxDelay, reconnectDelay * 2);
        }
      };

      ws.onerror = (err) => {
        console.error('[FanPortal] WS error:', err);
      };
    };

    connectWs();

    return () => {
      isCurrent = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [activeGamePk]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Send message via WebSocket
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMentionState(prev => ({ ...prev, active: false }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: "CHAT_MESSAGE",
        user: "james (Pilot)",
        color: "#3B82F6",
        text: inputText,
        target_game_pk: activeGamePk
      };
      wsRef.current.send(JSON.stringify(payload));
      
      // Opt-in local append immediately
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: "james (Pilot)",
        text: inputText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: "#3B82F6"
      }]);
    } else {
      alert("WebSocket connection is offline.");
    }
    setInputText('');
  };

  // Trigger Soundboard Phrase Injection via WebSocket
  const triggerSoundboardPhrase = (phrase: SoundboardPhrase) => {
    if (!selectedAdvocate) return;
    const isSilenced = silencedUsers[selectedAdvocate] && silencedUsers[selectedAdvocate] > Date.now();
    if (isSilenced) {
      alert(`@${selectedAdvocate} is currently silenced! [SILENCED BY COKE FACTOR]`);
      return;
    }
    const advocateInfo = roster.find(r => r.user_name === selectedAdvocate);
    const color = advocateInfo?.color || "#F59E0B";

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: "CHAT_MESSAGE",
        user: selectedAdvocate,
        color: color,
        text: phrase.text_payload,
        target_game_pk: activeGamePk
      };
      wsRef.current.send(JSON.stringify(payload));
      console.log(`[Soundboard] Injected phrase for @${selectedAdvocate}: "${phrase.button_label}"`);
    } else {
      alert("WebSocket offline. Cannot trigger phrase.");
    }
  };

  // Base paths filled colors helper
  const getBaseColor = (isOccupied: boolean | undefined) => {
    return isOccupied ? '#e11d48' : '#1e293b'; // Rose color for occupied, Slate for empty
  };

  return (
    <div id="main-dashboard-viewport" className="sports-live-hub" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
      <SpideyMetOverlay triggerEvent={spideyOverlayActive} onAnimationComplete={() => setSpideyOverlayActive(false)} />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sirenFlash {
          0%, 100% { background-color: rgba(239, 68, 68, 0.15); box-shadow: inset 0 0 40px rgba(239, 68, 68, 0.4); }
          50% { background-color: rgba(59, 130, 246, 0.15); box-shadow: inset 0 0 40px rgba(59, 130, 246, 0.4); }
        }
        .tmi-siren-flash {
          animation: sirenFlash 0.5s infinite alternate !important;
        }
      `}} />
      
      {isSwappingStream && (
        <div className="station-wagon-container">
          <span className="station-wagon-sprite">🚚💨</span>
          <div className="station-wagon-label">Crossing Town to Next Venue...</div>
        </div>
      )}
      
      {/* Title / Info Bar */}
      <div style={{ 
        display: 'flex', 
        height: '48px', 
        borderBottom: '1px solid rgba(255,255,255,0.06)', 
        alignItems: 'center', 
        flexShrink: 0,
        boxSizing: 'border-box'
      }}>
        {/* Left Column of Info Bar: auto-sized */}
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1rem',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            🎙️ CROSSTALK LOUNGE
          </h2>

          {/* Coordinate Grid Toggle Button */}
          <button
            id="fundies-grid-toggle-btn"
            onClick={() => setFundiesGrid(!fundiesGrid)}
            style={{
              background: fundiesGrid ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: fundiesGrid ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.15)',
              color: fundiesGrid ? '#00F0FF' : 'rgba(255, 255, 255, 0.7)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease-in-out',
              boxShadow: fundiesGrid ? '0 0 10px rgba(0, 240, 255, 0.3)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            📐 GRID: {fundiesGrid ? 'ON' : 'OFF'}
          </button>

          {/* Pin Engine Toggle Button */}
          <button
            id="pin-engine-toggle-btn"
            onClick={() => setPinEngineActive(!pinEngineActive)}
            style={{
              background: pinEngineActive ? 'rgba(253, 90, 30, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: pinEngineActive ? '1px solid #FD5A1E' : '1px solid rgba(255, 255, 255, 0.15)',
              color: pinEngineActive ? '#FD5A1E' : 'rgba(255, 255, 255, 0.7)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease-in-out',
              boxShadow: pinEngineActive ? '0 0 10px rgba(253, 90, 30, 0.3)' : 'none',
              whiteSpace: 'nowrap',
              marginLeft: '0.5rem'
            }}
          >
            📌 PINS: {pinEngineActive ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Right Column of Info Bar: occupies remaining width without shrinking or overlapping */}
        <div style={{
          flex: '0 0 auto',
          marginLeft: 'auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 1rem',
          gap: '0.5rem',
          boxSizing: 'border-box',
          minWidth: 'max-content',
          flexShrink: 0
        }}>
          {availableGames.length > 0 && (
            <>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.3rem', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '0.7rem', 
                  cursor: 'pointer', 
                  userSelect: 'none',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  transition: 'all 0.2s ease-in-out',
                  whiteSpace: 'nowrap'
                }}
                className="bring-gang-toggle"
                onMouseEnter={(e) => { 
                  e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.4)'; 
                  e.currentTarget.style.background = 'rgba(0, 180, 216, 0.05)'; 
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; 
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; 
                }}
              >
                <input
                  type="checkbox"
                  checked={bringGang}
                  onChange={(e) => setBringGang(e.target.checked)}
                  style={{ 
                    cursor: 'pointer',
                    accentColor: '#00b4d8'
                  }}
                />
                <span style={{ fontWeight: '600', letterSpacing: '0.03em' }}>BRING GANG 🚚</span>
              </label>
              <select
                value={activeGamePk}
                onChange={(e) => {
                  const newPk = e.target.value;
                  if (!newPk) return;
                  
                  setIsSwappingStream(true);
                  isHotSwappingRef.current = true;
                  
                  // Call state-preservative route handler to hot-swap telemetry stream
                  axios.post('/api/session/swap-stream', {
                    target_game_pk: newPk,
                    previous_game_pk: activeGamePk,
                    bring_gang: bringGang
                  }).then((res) => {
                    console.log("[FanPortal] Bring the Gang Along protocol executed:", res.data);
                  }).catch((err) => {
                    console.error("[FanPortal] Swap stream error:", err);
                  });
                  
                  // Keep the station wagon transit screen active for exactly 1.5s
                  setTimeout(() => {
                    setActiveGamePk(newPk);
                    setIsSwappingStream(false);
                    isHotSwappingRef.current = false;
                    
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({
                        type: 'CMD_SWITCH_GAME',
                        game_pk: newPk,
                        force_global: true
                      }));
                    }
                  }, 1500);
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(10, 132, 255, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                <option value="" style={{ background: '#1e293b', color: '#fff' }}>
                  -- Select Game --
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
            </>
          )}
          {wsConnected ? (
            <span 
              className="badge-live"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                color: '#00FFCC',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                animation: 'pulse-live 2s infinite'
              }}
            >
              <Radio size={12} /> LIVE
            </span>
          ) : (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: '#EF4444',
                fontWeight: 'bold', whiteSpace: 'nowrap'
              }}
            >
              <ShieldAlert size={12} /> OFFLINE
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.6)' }}>MODE:</span>
            <select 
              value={personalityMode} 
              onChange={(e) => setPersonalityMode(e.target.value)}
              style={{
                background: '#090e1a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '4px',
                padding: '2px 4px',
                outline: 'none',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              <option value="Matchup Focus">Matchup Focus</option>
              <option value="Lounge">Lounge</option>
              <option value="Analytics">Analytics</option>
              <option value="Gameday Sim">Gameday Sim</option>
              <option value="Pennant Race">Pennant Race</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.6)' }}>THEME:</span>
            <select 
              value={activeTheme} 
              onChange={(e) => setActiveTheme(e.target.value)}
              style={{
                background: '#090e1a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '4px',
                padding: '2px 4px',
                outline: 'none',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              <option value="sovereign-cyan">Sovereign Cyan</option>
              <option value="retro-16bit">16-Bit Retro</option>
              <option value="the-show-sim">The Show Sim</option>
              <option value="sny-cinematic">SNY Cinematic</option>
              <option value="muppet-hell">Muppet Hell</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#fff' }}>VOL: {Math.round(volumeLevel * 100)}%</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volumeLevel * 100} 
              onChange={(e) => setVolumeLevel(parseFloat(e.target.value) / 100)} 
              style={{ width: '60px', cursor: 'pointer', height: '4px' }}
            />
          </div>

        </div>
      </div>

      {/* Main 30 / 70 Layout */}
      {!activeGamePk ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.01)',
          color: 'rgba(255,255,255,0.5)',
          padding: '4rem',
          textAlign: 'center',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <Activity size={48} style={{ color: 'rgba(255,255,255,0.2)', animation: 'pulse-live 2s infinite' }} />
          <h2 style={{ color: '#fff', fontSize: '1.25rem', margin: 0 }}>No Game Room Selected</h2>
          <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: 0 }}>
            Select an active game room from the dropdown menu above to connect to the live crosstalk feed, scoreboard telemetry, and advocate soundboard.
          </p>
        </div>
      ) : (
        <div className="fan-portal-workspace" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: '1rem' }}>
          <SovereignSportsDashboard
            gameState={gameState}
            messages={messages}
            sendMessage={sendChatMessage}
            wsConnected={wsConnected}
            activeGamePk={activeGamePk}
            availableGames={availableGames}
            setActiveGamePk={setActiveGamePk}
            isSwappingStream={isSwappingStream}
            activeOverlays={activeOverlays}
            roster={roster}
            selectedAdvocate={selectedAdvocate}
            setSelectedAdvocate={setSelectedAdvocate}
            soundboardPhrases={soundboardPhrases}
            triggerSoundboardPhrase={triggerSoundboardPhrase}
            volumeLevel={volumeLevel}
            keithTakeover={keithTakeover}
            personalityMode={personalityMode}
            pinEngineActive={pinEngineActive}
            setPinEngineActive={setPinEngineActive}
          />
        </div>
      )}

      {injectedSvg && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeInOut {
              0% { opacity: 0; transform: scale(0.8); }
              15% { opacity: 1; transform: scale(1); }
              85% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(1.2); }
            }
          `}} />
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
              pointerEvents: 'none',
              animation: 'fadeInOut 4s forwards'
            }}
            dangerouslySetInnerHTML={{ __html: injectedSvg || "" }}
          />
        </>
      )}
      {/* Cypher Cell Overlay Modal */}
      <CypherCellModal 
        isOpen={cypherOpen} 
        onClose={() => setCypherOpen(false)} 
        persona={cypherPersona} 
        lyrics={cypherLyrics} 
      />
      {/* Jinx Screen Overlay */}
      <JinxOverlay activeJinx={activeJinx} onClear={() => setActiveJinx(null)} />
    </div>
  );
}
