import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { 
  Trophy, Radio, Activity, Send, Flame, Volume2
} from 'lucide-react';

import { CypherCellModal } from './CypherCellModal';
import { JinxOverlay } from './JinxOverlay';
import { SpideyMetOverlay } from './SpideyMetOverlay';

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

/**
 * Synthesizes a high-quality "thwip" audio signal using the browser's Web Audio API.
 * This serves as a reliable fallback in case thwip_loud.mp3 is not present in the static sounds directory.
 */
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
      ctx.fillText("THE AIR BENDER PITCHES!", centerX, centerY + 180);
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

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Connection & Room status states
  const [wsConnected, setWsConnected] = useState(false);
  const [activeGamePk, setActiveGamePk] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('_game_room') || params.get('game_room') || params.get('gamePk') || "";
  });
  const [availableGames, setAvailableGames] = useState<any[]>([]);

  // Jinx & silence state tracking
  const [activeJinx, setActiveJinx] = useState<{ userA: string; userB: string; timestamp: string } | null>(null);
  const [silencedUsers, setSilencedUsers] = useState<{ [username: string]: number }>({});
  const [spideyOverlayActive, setSpideyOverlayActive] = useState(false);

  // Outrage Proxy / RaaS states
  const [proxies, setProxies] = useState<any[]>([]);
  const [selectedProxyId, setSelectedProxyId] = useState<number | null>(null);
  const [tantrumIntensity, setTantrumIntensity] = useState<string>('traditional_drama_loop');
  const [deployingRage, setDeployingRage] = useState(false);
  const [rageError, setRageError] = useState<string | null>(null);

  const startSpideyTakeover = () => {
    triggerSpideyTakeover();
    setSpideyOverlayActive(true);
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
  const [inputText, setInputText] = useState('');
  const [mentionState, setMentionState] = useState({ active: false, filter: '', cursorIndex: -1, selectedIndex: 0 });
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [injectedSvg, setInjectedSvg] = useState<string | null>(null);

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
          } else if (res.data.length > 0 && !res.data.some((g: any) => g.game_pk === GAME_ID)) {
            setActiveGamePk(res.data[0].game_pk);
          }
        }
      } catch (err) {
        console.warn("Failed to load active games:", err);
      }
    };
    fetchActiveGames();
    fetchProxies();
  }, []);

  // Programmatic single/default game room selector hydration
  useEffect(() => {
    if (availableGames && availableGames.length > 0) {
      if (availableGames.length === 1 || !activeGamePk) {
        const defaultGameId = availableGames[0].game_pk;
        console.log(`[STATE SYNC] Single or default game auto-load triggered: ${defaultGameId}`);
        setActiveGamePk(defaultGameId);
      }
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
      try {
        const res = await axios.get(`/api/sports/game_state/${activeGamePk}`);
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

  // Connect to M.A.R.D WebSocket depending on activeGamePk
  useEffect(() => {
    if (!activeGamePk) {
      setWsConnected(false);
      return;
    }
    let ws: WebSocket | null = null;
    let isCurrent = true;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      if (!isCurrent) return;

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
        ws?.send(JSON.stringify({ type: 'JOIN_ROOM', target_game_pk: activeGamePk, room: activeGamePk }));
      };

      ws.onmessage = (event) => {
        if (!isCurrent) return;
        try {
          const msg = JSON.parse(event.data);

          // Handle webslinger_trigger
          if (msg.type === 'webslinger_trigger') {
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
                color: "#38BDF8"
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

          // Handle GAME_SWITCHED room transition
          if (msg.type === 'GAME_SWITCHED' && msg.game_pk) {
            if (msg.game_pk !== activeGamePk) {
              setActiveGamePk(msg.game_pk);
            }
            return;
          }

          // Handle CHAT_HISTORY
          if (msg.type === 'CHAT_HISTORY' && Array.isArray(msg.messages)) {
            const history = msg.messages
              .filter((m: any) => String(m.target_game_pk) === activeGamePk || m.target_game_pk === 'GLOBAL')
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
            return;
          }

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

          // Handle STATE_UPDATE for Scoreboard
          if (msg.type === 'STATE_UPDATE' && String(msg.target_game_pk || msg.data?.game_pk) === activeGamePk && msg.data) {
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
          reconnectTimeout = setTimeout(connectWs, 3000);
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
    <div id="main-dashboard-viewport" className="sports-live-hub" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500, color: '#fff' }}>
            {gameState.away_team} @ {gameState.home_team} — Crosstalk Lounge
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            Decentralized multi-tenant game lobby & telemetry board
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {availableGames.length > 0 && (
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
                  previous_game_pk: activeGamePk
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
                fontSize: '0.75rem',
                padding: '0.4rem 0.8rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(10, 132, 255, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
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
          <span className="badge-live">
            <Activity size={14} style={{ marginRight: '0.25rem' }} /> CROSSTALK ACTIVE
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
            {wsConnected ? 'RELAY CONNECTED' : 'RELAY DISCONNECTED'}
          </span>

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
          
          {/* Top Row: Broadcast Column (65%) and Sidebar (35%) */}
          <div style={{ display: 'flex', flex: 1, gap: '1.5rem', overflow: 'hidden' }}>
            
            {/* 1. Central Broadcast Column (65% width) */}
            <div className="central-broadcast-column" style={{ width: '65%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
              
              {/* Central Broadcast Stream Frame */}
              <div className="vm-panel-glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#00000080' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ff5a00', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff5a00', animation: 'pulse-live 1.5s infinite' }} />
                    LIVE BROADCAST STREAM INGRESS
                  </span>
                  {/* Momentum Sparkline */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>MOMENTUM SPARKLINE:</span>
                    <svg width="100" height="20" style={{ overflow: 'visible' }}>
                      <path
                        d="M 0 10 Q 20 2, 40 12 T 80 5 T 100 15"
                        fill="none"
                        stroke="#ff5a00"
                        strokeWidth="2"
                        style={{ strokeDasharray: '400', strokeDashoffset: '0', animation: 'pulse-live 2s infinite' }}
                      />
                    </svg>
                  </div>
                </div>
                <div style={{ height: '140px', background: '#070a0e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>{gameState.away_team} vs {gameState.home_team}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{gameState.status_msg}</div>
                  </div>
                  <span style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', fontSize: '0.65rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>Opta/Statcast Node 19-B</span>
                </div>
              </div>

              {/* Chat Panel */}
              <div className="vm-panel-glass lobby-chat-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
                
                {/* Roster list at top with Export Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="custom-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>LOBBY:</span>
                    {roster.map(p => {
                      const isSilenced = silencedUsers[p.user_name] && silencedUsers[p.user_name] > Date.now();
                      const avatarSrc = isSilenced ? '/images/coke_can.png' : `/api/persona_image/${p.user_name}`;
                      return (
                        <div 
                          key={p.user_name} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.35rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: `1px solid ${p.color}40`, 
                            borderRadius: '12px', 
                            padding: '0.15rem 0.5rem', 
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <img 
                            src={avatarSrc} 
                            alt={p.user_name} 
                            style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span style={{ fontWeight: 500 }}>@{p.user_name}</span>
                          {isSilenced && <span style={{ fontSize: '0.65rem', color: '#FF5910', fontWeight: 'bold' }}>[SILENCED]</span>}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* EXPORT BUTTONS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
                    {(['md', 'json', 'csv'] as const).map(fmt => {
                      const colors: Record<string, string> = { md: '#38bdf8', json: '#a855f7', csv: '#22c55e' };
                      const c = colors[fmt];
                      return (
                        <button
                          key={fmt}
                          onClick={() => {
                            if (activeGamePk) {
                              window.open(`/api/game-log/export/${activeGamePk}/${fmt}`, '_blank');
                            } else {
                              let content = '';
                              let mediaType = 'text/plain';
                              let extension = 'txt';

                              if (fmt === 'json') {
                                content = JSON.stringify(messages, null, 2);
                                mediaType = 'application/json';
                                extension = 'json';
                              } else if (fmt === 'csv') {
                                const escapeCsv = (str: string) => {
                                  const escaped = (str || '').replace(/"/g, '""');
                                  return `"${escaped}"`;
                                };
                                content = "Timestamp,Author,Message\n" + messages.map(m => {
                                  const ts = m.time || '';
                                  return `${escapeCsv(ts)},${escapeCsv(m.user)},${escapeCsv(m.text)}`;
                                }).join('\n');
                                mediaType = 'text/csv';
                                extension = 'csv';
                              } else {
                                // markdown
                                content = `# 📋 Sovereign Sports Chat Session Export\n\nExported: ${new Date().toISOString()}\n\n---\n\n## Chronological Log\n\n`;
                                content += messages.map(m => {
                                  const ts = m.time || '';
                                  return `**[${ts}]** 🗣️ **${m.user.toUpperCase()}**\n> ${m.text}\n`;
                                }).join('\n');
                                mediaType = 'text/markdown';
                                extension = 'md';
                              }

                              const dataStr = `data:${mediaType};charset=utf-8,` + encodeURIComponent(content);
                              const a = document.createElement('a');
                              a.href = dataStr;
                              a.download = `sports_chat_${Date.now()}.${extension}`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                            }
                          }}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${c}40`,
                            color: c,
                            backgroundColor: `${c}10`,
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            opacity: 0.8
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                          title={`Export chat as ${fmt.toUpperCase()}`}
                        >
                          ↓{fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chat message feed */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                  {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', gap: '0.5rem' }}>
                      <Trophy size={32} strokeWidth={1.5} />
                      <span style={{ fontSize: '0.9rem' }}>Awaiting first game room transmission...</span>
                    </div>
                  ) : (
                    messages.filter(m => m.user?.toLowerCase() !== 'system').map((m) => {
                      const isSilenced = silencedUsers[m.user] && silencedUsers[m.user] > Date.now();
                      const avatarSrc = isSilenced ? '/images/coke_can.png' : `/api/persona_image/${m.user}`;
                      return (
                        <div key={m.id} style={{ display: 'flex', gap: '0.6rem', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                          {m.user !== 'SYSTEM' && (
                            <img 
                              src={avatarSrc} 
                              alt={m.user} 
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${m.color || 'rgba(255,255,255,0.1)'}` }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 'bold', color: m.color || '#fff', fontSize: '0.85rem' }}>
                                @{m.user} {isSilenced && <span style={{ fontSize: '0.65rem', color: '#FF5910', fontWeight: 'bold' }}>[SILENCED BY COKE FACTOR]</span>}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{m.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                              {m.text}
                            </p>
                            {m.image && (
                              <div style={{ marginTop: '0.5rem' }}>
                                {m.image.endsWith('.mp4') ? (
                                  <video 
                                    src={m.image} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    muted 
                                    style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} 
                                  />
                                ) : (
                                  <img 
                                    src={m.image} 
                                    alt="Shared media" 
                                    style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} 
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Autocomplete mention list overlay */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
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
                      {filteredPersonas.map((username, idx) => (
                        <div 
                          key={username}
                          onClick={() => selectMention(username)}
                          style={{ 
                            padding: '0.5rem 0.75rem', 
                            cursor: 'pointer', 
                            fontSize: '0.8rem', 
                            color: '#fff', 
                            background: idx === mentionState.selectedIndex ? 'rgba(10, 132, 255, 0.25)' : 'transparent',
                            borderBottom: idx < filteredPersonas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' 
                          }}
                          onMouseEnter={() => setMentionState(prev => ({ ...prev, selectedIndex: idx }))}
                        >
                          {username}
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    ref={chatInputRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Inject custom commentary..."
                    style={{ 
                      flex: 1, 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '8px', 
                      padding: '0.75rem', 
                      color: '#fff', 
                      fontSize: '0.85rem', 
                      outline: 'none' 
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(10, 132, 255, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <button
                    type="submit"
                    style={{ 
                      background: 'rgba(10, 132, 255, 0.15)', 
                      border: '1px solid rgba(10, 132, 255, 0.3)', 
                      color: '#0A84FF', 
                      borderRadius: '8px', 
                      padding: '0.75rem 1.25rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      transition: 'all 0.15s ease' 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(10, 132, 255, 0.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(10, 132, 255, 0.15)'}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div> {/* Close Chat Panel */}
            </div> {/* Close 65% Central Broadcast Column */}

            {/* 2. Terrace Balcony Sidebar (35% width) */}
            <div className="terrace-balcony-sidebar" style={{ width: '35%', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
              
              {/* Digital Scoreboard */}
              <div className="vm-panel-glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '1px' }}>MLB LIVE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>BOGGS:</span>
                    <span style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: '0.8rem' }}>{gameState.boggs_level}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{gameState.away_team}</span>
                    <span style={{ fontSize: '2rem', fontWeight: 300 }}>{gameState.away_score}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', flex: 0.5 }}>
                    <div>{gameState.inning}</div>
                    <div style={{ marginTop: '0.25rem', letterSpacing: '2px', fontWeight: 'bold' }}>{gameState.balls}-{gameState.strikes}</div>
                    <div style={{ fontSize: '0.7rem', color: '#FF3366', marginTop: '0.1rem' }}>{gameState.outs} OUT</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{gameState.home_team}</span>
                    <span style={{ fontSize: '2rem', fontWeight: 300 }}>{gameState.home_score}</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {gameState.status_msg}
                </div>
              </div>

              {/* Statcast SVG Diamond Bases */}
              <div className="vm-panel-glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-start' }}>BASE PATHS</h3>
                <svg width="120" height="120" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 8px rgba(225, 29, 72, 0.2))' }}>
                  <path d="M50 10 L85 45 L50 80 L15 45 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <rect id="base-2" x="42" y="2" width="16" height="16" transform="rotate(45 50 10)" fill={getBaseColor(gameState.onSecond)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" style={{ transition: 'fill 0.3s ease' }} />
                  <rect id="base-3" x="7" y="37" width="16" height="16" transform="rotate(45 15 45)" fill={getBaseColor(gameState.onThird)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" style={{ transition: 'fill 0.3s ease' }} />
                  <rect id="base-1" x="77" y="37" width="16" height="16" transform="rotate(45 85 45)" fill={getBaseColor(gameState.onFirst)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" style={{ transition: 'fill 0.3s ease' }} />
                  <path d="M46 76 L54 76 L54 84 L50 88 L46 84 Z" fill="#334155" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                </svg>
              </div>

              {/* Statcast Feed */}
              <div className="vm-panel-glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>STATCAST FEED</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>BATTER</div>
                    <div style={{ fontWeight: 'bold' }}>{gameState.batter || '---'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>PITCHER</div>
                    <div style={{ fontWeight: 'bold' }}>{gameState.pitcher || '---'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>PITCH SPEED</div>
                    <div style={{ fontWeight: 'bold', color: '#00FFCC' }}>{gameState.pitch_speed ? `${gameState.pitch_speed} MPH` : '---'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>PITCH TYPE</div>
                    <div style={{ fontWeight: 'bold', color: '#0A84FF' }}>{gameState.pitch_name || '---'}</div>
                  </div>
                </div>
              </div>

              {/* Cypher Cell Burn Tracker */}
              <div className="vm-panel-glass" style={{ padding: '1rem', border: '1px solid rgba(255, 90, 0, 0.2)', boxShadow: 'inset 0 0 15px rgba(255, 90, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#ff5a00', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Flame size={14} /> CYPHER CELL BURN TRACKER
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: '#ff5a00', animation: 'pulse-live 1.5s infinite', background: 'rgba(255, 90, 0, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>MONITORING</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {anomalies.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', padding: '1rem 0', textAlign: 'center', fontStyle: 'italic' }}>
                      No high-entropy anomalies detected in current cycle.
                    </div>
                  ) : (
                    anomalies.map((anomaly) => (
                      <div key={anomaly.id} style={{ fontSize: '0.75rem', background: 'rgba(255, 90, 0, 0.05)', border: '1px solid rgba(255, 90, 0, 0.15)', borderRadius: '6px', padding: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff5a00', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          <span>{anomaly.event}</span>
                          <span>{anomaly.time}</span>
                        </div>
                        {anomaly.script && <div style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>"{anomaly.script}"</div>}
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', textAlign: 'right' }}>
                          Advocate: @{anomaly.persona} {anomaly.format && `| ${anomaly.format}`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Advocate Soundboard */}
              <div className="vm-panel-glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Volume2 size={14} /> ADVOCATE SOUNDBOARD
                </h3>
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                  {roster.map((p) => {
                    const active = selectedAdvocate === p.user_name;
                    return (
                      <button
                        key={p.user_name}
                        onClick={() => setSelectedAdvocate(p.user_name)}
                        style={{
                          background: active ? p.color : 'rgba(255,255,255,0.03)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                          border: active ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.08)',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        @{p.user_name}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {loadingPhrases ? (
                    <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0.5rem' }}>
                      Loading phrases...
                    </div>
                  ) : soundboardPhrases.length === 0 ? (
                    <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0.5rem', fontStyle: 'italic' }}>
                      No phrases loaded for @{selectedAdvocate}.
                    </div>
                  ) : (
                    soundboardPhrases.map((phrase) => {
                      const isSilenced = selectedAdvocate && silencedUsers[selectedAdvocate] && silencedUsers[selectedAdvocate] > Date.now();
                      return (
                        <button
                          key={phrase.sys_id}
                          disabled={!!isSilenced}
                          onClick={() => triggerSoundboardPhrase(phrase)}
                          title={phrase.text_payload}
                          style={{
                            background: isSilenced ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                            border: isSilenced ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.08)',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            color: isSilenced ? 'rgba(255,255,255,0.2)' : '#fff',
                            fontSize: '0.7rem',
                            cursor: isSilenced ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSilenced) {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                              e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSilenced) {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            }
                          }}
                        >
                          {isSilenced ? '🔒' : '🔊'} {phrase.button_label}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Outrage Proxy Control panel (RaaS) */}
              <div className="vm-panel-glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#f43f5e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Activity size={14} /> OUTRAGE PROXY CONTROL (RaaS)
                  </h3>
                </div>
                {rageError && (
                  <div style={{ fontSize: '0.7rem', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '0.35rem', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    {rageError}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {proxies.map((ump) => {
                    const isSelected = selectedProxyId === ump.id;
                    const isExhausted = ump.dirt_kick_capacity <= 0;
                    return (
                      <div
                        key={ump.id}
                        onClick={() => !isExhausted && setSelectedProxyId(ump.id)}
                        style={{
                          background: isSelected ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.08)',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: isExhausted ? 'not-allowed' : 'pointer',
                          opacity: isExhausted ? 0.5 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isSelected ? '#f43f5e' : '#fff' }}>
                            {ump.umpire_name} {isSelected && '🎯'}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                            Flair: {ump.ejection_flair_level}/10
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                          <span style={{ width: '45px' }}>DURABILITY:</span>
                          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${ump.durability_rating}%`, height: '100%', background: '#10B981' }} />
                          </div>
                          <span style={{ width: '25px', textAlign: 'right' }}>{ump.durability_rating}%</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>DIRT KICK CAP:</span>
                          <span style={{ fontWeight: 'bold', color: isExhausted ? '#ef4444' : '#60a5fa' }}>{ump.dirt_kick_capacity} REMAINING</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>TANTRUM INTENSITY</span>
                  <select
                    value={tantrumIntensity}
                    onChange={(e) => setTantrumIntensity(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      padding: '0.3rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="mild_annoyance">Mild Annoyance</option>
                    <option value="traditional_drama_loop">Traditional Drama Loop</option>
                    <option value="vein_popping_fury">Vein-Popping Fury</option>
                    <option value="catastrophic_meltdown">Catastrophic Meltdown</option>
                  </select>
                </div>
                <button
                  onClick={() => selectedProxyId && deployProxy(selectedProxyId)}
                  disabled={deployingRage || !selectedProxyId}
                  style={{
                    background: deployingRage ? '#991b1b' : '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: deployingRage || !selectedProxyId ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!deployingRage && selectedProxyId) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deployingRage && selectedProxyId) {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                >
                  {deployingRage ? 'DEPLOYING OVERRIDE...' : '🔥 ENGAGE EMERGENCY RAGE OVERRIDE'}
                </button>
              </div>

            </div> {/* Close Sidebar */}
          </div> {/* Close Top Row */}

          {/* Bottom Telemetry Ticker */}
          <div className="bottom-telemetry-ticker-container" style={{
            height: '40px',
            background: 'rgba(10, 15, 30, 0.8)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div className="bottom-telemetry-ticker-title" style={{
              background: '#ff5a00',
              color: '#fff',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0 1rem',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              zIndex: 2,
              boxShadow: '4px 0 10px rgba(0,0,0,0.5)'
            }}>
              STATCAST LIVE
            </div>
            <div className="bottom-telemetry-ticker-scroll" style={{
              display: 'flex',
              gap: '3rem',
              whiteSpace: 'nowrap',
              animation: 'ticker-marquee 30s linear infinite',
              paddingLeft: '2rem',
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'monospace'
            }}>
              <span>• BATTER: {gameState.batter || '---'}</span>
              <span>• PITCHER: {gameState.pitcher || '---'}</span>
              <span>• PITCH SPEED: {gameState.pitch_speed ? `${gameState.pitch_speed} MPH` : '---'}</span>
              <span>• PITCH TYPE: {gameState.pitch_name || '---'}</span>
              <span>• INNING: {gameState.inning || '---'}</span>
              <span>• COUNT: {gameState.balls}-{gameState.strikes} ({gameState.outs} OUT)</span>
              <span>• BOGGS MULTIPLIER: {gameState.boggs_level}x</span>
              <span>• LAST ANOMALY: {anomalies[0]?.event || 'NONE DETECTED'}</span>
            </div>
          </div>

        </div> // Close fan-portal-workspace
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

