import React from 'react';
import { useTheme } from './ThemeContext';

export function Logo({ className = "" }: { className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-10 h-10">
        {/* Petri dish */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-400 bg-gray-800/50"></div>
        {/* Clear zones */}
        <div className="absolute top-1.5 left-2 w-2.5 h-2.5 rounded-full bg-red-500/60 ring-2 ring-red-400/40"></div>
        <div className="absolute bottom-2 right-1.5 w-2 h-2 rounded-full bg-red-500/60 ring-2 ring-red-400/40"></div>
        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500/60 ring-2 ring-red-400/40"></div>
      </div>
      <span className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>ZoneAnalyzer</span>
    </div>
  );
}
