// SpideyCanvasOverlay.tsx
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

interface SpideyCanvasOverlayProps {
  active: boolean;
  onComplete: () => void;
  batterName?: string;
  launchAngle?: number;
  exitVelocity?: number;
}

export const SpideyCanvasOverlay: React.FC<SpideyCanvasOverlayProps> = ({
  active,
  onComplete,
  batterName,
  launchAngle,
  exitVelocity
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef<boolean>(active);
  const stateRef = useRef<{
    startTime: number | null;
    particles: Particle[];
    apexTriggered: boolean;
    spideyImage: HTMLImageElement | null;
    particleImage: HTMLImageElement | null;
    imagesLoaded: boolean;
  }>({
    startTime: null,
    particles: [],
    apexTriggered: false,
    spideyImage: null,
    particleImage: null,
    imagesLoaded: false
  });

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      stateRef.current.startTime = null;
      stateRef.current.particles = [];
      stateRef.current.apexTriggered = false;
    }
  }, [active]);

  // Preload images with fallbacks
  useEffect(() => {
    const spidey = new Image();
    spidey.src = '/media/spidey_swing_transparent.png';
    const particle = new Image();
    particle.src = '/media/web_blast_particle.png';

    let loadedCount = 0;
    const checkLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        stateRef.current.imagesLoaded = spidey.naturalWidth > 0 && particle.naturalWidth > 0;
      }
    };

    spidey.onload = checkLoad;
    spidey.onerror = checkLoad;
    particle.onload = checkLoad;
    particle.onerror = checkLoad;

    stateRef.current.spideyImage = spidey;
    stateRef.current.particleImage = particle;
  }, []);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    const duration = 4200; // 4.2 seconds duration as specified

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawVectorSpidey = (context: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
      context.save();
      context.translate(x, y);
      context.rotate(angle);

      // Web anchor thread line back up to high center
      context.restore();
      
      context.save();
      context.translate(x, y);
      context.rotate(angle);

      // Red round head/body mask
      context.fillStyle = '#E53E3E';
      context.strokeStyle = '#000000';
      context.lineWidth = 2.5;
      context.beginPath();
      context.arc(0, 0, 18, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      // Draw web lines on mask
      context.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      context.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const rad = (i * Math.PI) / 4;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(Math.cos(rad) * 18, Math.sin(rad) * 18);
        context.stroke();
      }
      context.beginPath();
      context.arc(0, 0, 9, 0, Math.PI * 2);
      context.stroke();

      // Spidey White Eyes with thick black border
      context.fillStyle = '#FFFFFF';
      context.strokeStyle = '#000000';
      context.lineWidth = 2.5;

      // Left Eye
      context.beginPath();
      context.moveTo(-10, -3);
      context.quadraticCurveTo(-14, -10, -4, -10);
      context.quadraticCurveTo(-2, -5, -10, -3);
      context.fill();
      context.stroke();

      // Right Eye
      context.beginPath();
      context.moveTo(10, -3);
      context.quadraticCurveTo(14, -10, 4, -10);
      context.quadraticCurveTo(2, -5, 10, -3);
      context.fill();
      context.stroke();

      // Blue Suit details
      context.fillStyle = '#1D4ED8';
      context.beginPath();
      context.arc(0, 14, 5, 0, Math.PI * 2);
      context.fill();

      context.restore();
    };

    const drawVectorParticle = (context: CanvasRenderingContext2D, x: number, y: number, alpha: number, size: number) => {
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 1.5;
      context.shadowColor = '#00E5FF';
      context.shadowBlur = 8;

      // Draw a neat 8-pointed web blast particle
      context.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        context.moveTo(x, y);
        context.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
      }
      context.stroke();
      context.restore();
    };

    const animate = (timestamp: number) => {
      if (!activeRef.current) return;
      if (stateRef.current.startTime === null) {
        stateRef.current.startTime = timestamp;
      }

      const elapsed = timestamp - stateRef.current.startTime;
      const t = Math.min(elapsed / duration, 1.0);

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Bezier curve points
      const P0 = { x: -100, y: -100 }; // Top Left
      const P1 = { x: w / 2, y: h * 1.3 }; // Lower Apex (mound / center field)
      const P2 = { x: w + 100, y: -100 }; // Top Right

      // Calculate current position (x, y) along Bezier curve
      const x = (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x;
      const y = (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y;

      // Calculate angle of motion for rotation
      const nextT = Math.min(t + 0.01, 1.0);
      const nextX = (1 - nextT) * (1 - nextT) * P0.x + 2 * (1 - nextT) * nextT * P1.x + nextT * nextT * P2.x;
      const nextY = (1 - nextT) * (1 - nextT) * P0.y + 2 * (1 - nextT) * nextT * P1.y + nextT * nextT * P2.y;
      const angle = Math.atan2(nextY - y, nextX - x);

      // Draw web anchor thread (from top center to swinging Spidey)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(w / 2, -50);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();

      // Trigger Web Blast Particle Emitter at apex (t = 0.5)
      if (t >= 0.5 && !stateRef.current.apexTriggered) {
        stateRef.current.apexTriggered = true;
        const numParticles = 12;
        const particles: Particle[] = [];
        for (let i = 0; i < numParticles; i++) {
          const pAngle = (i * 2 * Math.PI) / numParticles;
          const speed = 2.5 + Math.random() * 3;
          particles.push({
            x: x,
            y: y,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            alpha: 1.0,
            size: 6 + Math.random() * 8
          });
        }
        stateRef.current.particles = particles;
      }

      // Update and draw particles
      stateRef.current.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02; // Fade out slowly

        if (p.alpha > 0) {
          if (stateRef.current.imagesLoaded && stateRef.current.particleImage) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(
              stateRef.current.particleImage,
              p.x - p.size,
              p.y - p.size,
              p.size * 2,
              p.size * 2
            );
            ctx.restore();
          } else {
            drawVectorParticle(ctx, p.x, p.y, p.alpha, p.size);
          }
        }
      });

      // Filter out dead particles
      stateRef.current.particles = stateRef.current.particles.filter(p => p.alpha > 0);

      // Draw Spidey swing character
      if (stateRef.current.imagesLoaded && stateRef.current.spideyImage) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(stateRef.current.spideyImage, -28, -28, 56, 56);
        ctx.restore();
      } else {
        drawVectorSpidey(ctx, x, y, angle);
      }

      // Draw Overlay Text Alert "HOME RUN!"
      if (t > 0.3 && t < 0.8) {
        ctx.save();
        const textAlpha = t < 0.4 ? (t - 0.3) / 0.1 : (t > 0.7 ? (0.8 - t) / 0.1 : 1.0);
        ctx.globalAlpha = textAlpha;
        ctx.font = "bold 2.5rem Impact, sans-serif";
        ctx.fillStyle = "#FF3D00";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.shadowColor = "#FF3D00";
        ctx.shadowBlur = 12;

        const textY = h / 2 - 10;
        ctx.strokeText("⚾ HOME RUN TAKEOVER ⚾", w / 2, textY);
        ctx.fillText("⚾ HOME RUN TAKEOVER ⚾", w / 2, textY);

        if (batterName) {
          ctx.font = "bold 1.25rem Inter, sans-serif";
          ctx.fillStyle = "#FFCC00";
          ctx.shadowBlur = 4;
          ctx.fillText(
            `${batterName.toUpperCase()} BLASTS IT!`,
            w / 2,
            textY + 35
          );

          if (exitVelocity && launchAngle) {
            ctx.font = "italic 0.85rem monospace";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(
              `EXIT VELO: ${exitVelocity} MPH | ANGLE: ${launchAngle}°`,
              w / 2,
              textY + 60
            );
          }
        }
        ctx.restore();
      }

      // Continue animation loop
      if (t < 1.0) {
        animFrameId = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active, onComplete, batterName, launchAngle, exitVelocity]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="spidey-takeover-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50
      }}
    />
  );
};
