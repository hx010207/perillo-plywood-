import React, { useEffect, useRef } from 'react';

interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  opacity?: number;
  brightness?: number;
  mouseInteraction?: boolean;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

export const GradientWaves: React.FC<GradientWavesProps> = ({
  horizonColor = '#FAF7F2',
  waveColor = '#D9C5B2',
  crestColor = '#8C6D58',
  speed = 0.05,
  amplitude = 2.0,
  opacity = 0.85,
  brightness = 1.05,
  mouseInteraction = true,
  grain = true,
  grainIntensity = 0.025,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = e.clientY / window.innerHeight;
    };

    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Create grain canvas if requested
    let grainCanvas: HTMLCanvasElement | null = null;
    if (grain) {
      grainCanvas = document.createElement('canvas');
      grainCanvas.width = 128;
      grainCanvas.height = 128;
      const gctx = grainCanvas.getContext('2d');
      if (gctx) {
        const imgData = gctx.createImageData(128, 128);
        for (let i = 0; i < imgData.data.length; i += 4) {
          const val = Math.random() * 255;
          imgData.data[i] = val;
          imgData.data[i + 1] = val;
          imgData.data[i + 2] = val;
          imgData.data[i + 3] = 255 * grainIntensity;
        }
        gctx.putImageData(imgData, 0, 0);
      }
    }

    const isDark = horizonColor.toLowerCase().startsWith('#0') || 
                   horizonColor.toLowerCase().startsWith('#1') || 
                   horizonColor.toLowerCase().startsWith('#2');

    const render = () => {
      time += 0.015 * Math.max(0.02, speed);
      const width = canvas.width;
      const height = canvas.height;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const mouseOffsetX = (mouseRef.current.x - 0.5) * 35;
      const mouseOffsetY = (mouseRef.current.y - 0.5) * 25;

      ctx.clearRect(0, 0, width, height);

      // Base ambient gradient (dark vs light mode base)
      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, horizonColor);
      baseGrad.addColorStop(0.45, horizonColor);
      baseGrad.addColorStop(1, isDark ? '#060403' : '#F3EFEA');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw multi-layered animated flowing waves with responsive mouse distortion
      const wavesCount = 4;
      for (let w = 0; w < wavesCount; w++) {
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, opacity * (0.6 + (w / wavesCount) * 0.4));
        ctx.beginPath();
        const baseHeight = height * (0.38 + w * 0.15) + mouseOffsetY * (1 - w * 0.2);
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 10) {
          const wave1 = Math.sin(x * 0.0025 + time + w * 1.3 + mouseOffsetX * 0.01) * (28 * amplitude);
          const wave2 = Math.cos(x * 0.005 - time * 0.8 + w * 0.7) * (18 * amplitude);
          const wave3 = Math.sin(x * 0.0015 + time * 1.2 + w * 1.8) * (12 * amplitude);
          const y = baseHeight + wave1 + wave2 + wave3;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, baseHeight - 40, width, height);
        if (w % 2 === 0) {
          waveGrad.addColorStop(0, crestColor);
          waveGrad.addColorStop(0.45, waveColor);
          waveGrad.addColorStop(1, isDark ? 'rgba(14, 10, 7, 0.95)' : 'rgba(217, 197, 178, 0.35)');
        } else {
          waveGrad.addColorStop(0, waveColor);
          waveGrad.addColorStop(0.5, crestColor);
          waveGrad.addColorStop(1, isDark ? 'rgba(42, 30, 23, 0.95)' : 'rgba(140, 109, 88, 0.25)');
        }

        ctx.fillStyle = waveGrad;
        ctx.fill();
        ctx.restore();
      }

      // Add grain overlay
      if (grain && grainCanvas) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat') || 'transparent';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [horizonColor, waveColor, crestColor, speed, amplitude, opacity, brightness, mouseInteraction, grain, grainIntensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{ filter: `brightness(${brightness})`, transition: 'filter 0.3s ease' }}
      className={`w-full h-full block ${className}`}
    />
  );
};
