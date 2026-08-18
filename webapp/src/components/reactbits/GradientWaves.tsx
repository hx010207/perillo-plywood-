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
  horizonColor = '#0B1D12',
  waveColor = '#10B981',
  crestColor = '#34D399',
  speed = 0.4,
  amplitude = 2.0,
  opacity = 0.85,
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

      // Base ambient deep gradient
      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, horizonColor);
      baseGrad.addColorStop(0.5, horizonColor);
      baseGrad.addColorStop(1, '#051008');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw multi-layered animated flowing waves
      const wavesCount = 4;
      for (let w = 0; w < wavesCount; w++) {
        ctx.save();
        ctx.globalAlpha = opacity * (0.6 + (w / wavesCount) * 0.4);
        ctx.beginPath();
        const baseHeight = height * (0.42 + w * 0.14);
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 12) {
          const wave1 = Math.sin(x * 0.003 + time + w * 1.4) * (32 * amplitude);
          const wave2 = Math.cos(x * 0.006 - time * 0.9 + w * 0.7) * (22 * amplitude);
          const wave3 = Math.sin(x * 0.0018 + time * 1.3 + w * 2) * (16 * amplitude);
          const y = baseHeight + wave1 + wave2 + wave3;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, baseHeight - 50, width, height);
        if (w % 2 === 0) {
          waveGrad.addColorStop(0, crestColor);
          waveGrad.addColorStop(0.5, waveColor);
          waveGrad.addColorStop(1, 'rgba(5, 16, 8, 0.9)');
        } else {
          waveGrad.addColorStop(0, waveColor);
          waveGrad.addColorStop(0.4, crestColor);
          waveGrad.addColorStop(1, 'rgba(5, 16, 8, 0.95)');
        }

        ctx.fillStyle = waveGrad;
        ctx.fill();
        ctx.restore();
      }

      // Add grain overlay
      if (grain && grainCanvas) {
        ctx.globalAlpha = 0.5;
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
      className={`w-full h-full block ${className}`}
    />
  );
};
