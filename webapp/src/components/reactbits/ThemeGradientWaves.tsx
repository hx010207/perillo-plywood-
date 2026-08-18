import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { GradientWaves } from './GradientWaves';

interface ThemeGradientWavesProps {
  className?: string;
}

export const ThemeGradientWaves: React.FC<ThemeGradientWavesProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden ${className}`}>
      <GradientWaves
        horizonColor={isDarkMode ? '#0E0A07' : '#FAF7F2'}
        waveColor={isDarkMode ? '#2A1E17' : '#D9C5B2'}
        crestColor="#8C6D58"
        brightness={isDarkMode ? 0.85 : 1.05}
        opacity={isDarkMode ? 0.95 : 0.85}
        speed={0.05}
        mouseInteraction={true}
        grain={true}
      />
    </div>
  );
};
