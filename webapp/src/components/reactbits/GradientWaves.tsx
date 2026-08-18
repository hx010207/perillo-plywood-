import React, { useEffect, useRef } from 'react';

interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  opacity?: number;
  brightness?: number;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

export const GradientWaves: React.FC<GradientWavesProps> = ({
  horizonColor = '#FAF7F2',
  waveColor = '#D9C5B2',
  crestColor = '#8C6D58',
  speed = 0.35,
  amplitude = 2.0,
  opacity = 0.9,
  brightness = 1.1,
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
      time += 0.012 * speed;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Base warm linen/cream ambient gradient
      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, horizonColor);
      baseGrad.addColorStop(0.45, horizonColor);
      baseGrad.addColorStop(1, '#F3EFEA');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw multi-layered animated flowing waves with warm timber palette
      const wavesCount = 4;
      for (let w = 0; w < wavesCount; w++) {
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, opacity * (0.55 + (w / wavesCount) * 0.45));
        ctx.beginPath();
        const baseHeight = height * (0.40 + w * 0.15);
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 12) {
          const wave1 = Math.sin(x * 0.0028 + time + w * 1.3) * (30 * amplitude);
          const wave2 = Math.cos(x * 0.0055 - time * 0.85 + w * 0.7) * (20 * amplitude);
          const wave3 = Math.sin(x * 0.0016 + time * 1.25 + w * 1.8) * (15 * amplitude);
          const y = baseHeight + wave1 + wave2 + wave3;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, baseHeight - 40, width, height);
        if (w % 2 === 0) {
          waveGrad.addColorStop(0, crestColor);
          waveGrad.addColorStop(0.45, waveColor);
          waveGrad.addColorStop(1, 'rgba(217, 197, 178, 0.35)');
        } else {
          waveGrad.addColorStop(0, waveColor);
          waveGrad.addColorStop(0.5, crestColor);
          waveGrad.addColorStop(1, 'rgba(140, 109, 88, 0.25)');
        }

        ctx.fillStyle = waveGrad;
        ctx.fill();
        ctx.restore();
      }

      // Add grain overlay
      if (grain && grainCanvas) {
        ctx.globalAlpha = 0.45;
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
  }, [horizonColor, waveColor, crestColor, speed, amplitude, opacity, brightness, grain, grainIntensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{ filter: `brightness(${brightness})` }}
      className={`w-full h-full block ${className}`}
    />
  );
};
