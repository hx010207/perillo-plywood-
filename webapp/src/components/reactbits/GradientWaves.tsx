import React, { useEffect, useRef } from 'react';

interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  opacity?: number;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

export const GradientWaves: React.FC<GradientWavesProps> = ({
  horizonColor = '#E2E8F0',
  waveColor = '#10B981',
  crestColor = '#34D399',
  speed = 0.3,
  amplitude = 2.0,
  opacity = 0.6,
  grain = true,
  grainIntensity = 0.03,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const render = () => {
      time += 0.015 * speed;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Base ambient gradient
      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, horizonColor);
      baseGrad.addColorStop(0.5, horizonColor);
      baseGrad.addColorStop(1, '#F8FAF9');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = opacity;

      // Draw multi-layered animated flowing waves
      const wavesCount = 4;
      for (let w = 0; w < wavesCount; w++) {
        ctx.beginPath();
        const baseHeight = height * (0.45 + w * 0.15);
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 15) {
          const wave1 = Math.sin(x * 0.003 + time + w * 1.5) * (30 * amplitude);
          const wave2 = Math.cos(x * 0.006 - time * 0.8 + w * 0.8) * (20 * amplitude);
          const wave3 = Math.sin(x * 0.0015 + time * 1.2 + w) * (15 * amplitude);
          const y = baseHeight + wave1 + wave2 + wave3;

          if (x === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, baseHeight - 40, width, height);
        if (w % 2 === 0) {
          waveGrad.addColorStop(0, crestColor);
          waveGrad.addColorStop(0.6, waveColor);
          waveGrad.addColorStop(1, 'transparent');
        } else {
          waveGrad.addColorStop(0, waveColor);
          waveGrad.addColorStop(0.5, crestColor);
          waveGrad.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      // Add grain overlay
      if (grain && grainCanvas) {
        ctx.globalAlpha = 0.6;
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
    };
  }, [horizonColor, waveColor, crestColor, speed, amplitude, opacity, grain, grainIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none -z-10 w-full h-full ${className}`}
    />
  );
};
