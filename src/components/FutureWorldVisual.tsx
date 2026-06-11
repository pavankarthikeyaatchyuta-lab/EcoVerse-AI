'use client';

import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';

export default function FutureWorldVisual() {
  const healthScore = useStore((state) => state.stats.healthScore);

  // Determine visual states based on healthScore (0 - 100)
  const isLow = healthScore < 40;
  const isHigh = healthScore >= 70;

  // Dynamic CSS variables based on health score
  const skyColor = isHigh 
    ? 'bg-gradient-to-b from-blue-300 to-blue-100 dark:from-blue-900 dark:to-slate-800' 
    : isLow 
      ? 'bg-gradient-to-b from-slate-400 to-slate-300 dark:from-slate-800 dark:to-slate-700' 
      : 'bg-gradient-to-b from-blue-200 to-slate-200 dark:from-slate-700 dark:to-slate-800';

  const groundColor = isHigh 
    ? 'bg-green-500 dark:bg-green-800' 
    : isLow 
      ? 'bg-amber-700 dark:bg-amber-900' 
      : 'bg-green-600 dark:bg-green-900';

  const buildingOpacity = isLow ? 'opacity-80' : 'opacity-40';

  return (
    <div className={`relative w-full h-64 rounded-2xl overflow-hidden transition-colors duration-1000 ${skyColor}`}>
      {/* Sun / Smog */}
      <motion.div 
        animate={{ 
          backgroundColor: isHigh ? '#FDB813' : isLow ? '#94a3b8' : '#fcd34d',
          scale: isHigh ? 1 : isLow ? 1.5 : 1.2,
          filter: isLow ? 'blur(20px)' : 'blur(2px)'
        }}
        className="absolute top-8 left-8 w-16 h-16 rounded-full transition-all duration-1000"
      />

      {/* Buildings Outline SVG */}
      <div className={`absolute bottom-0 left-0 w-full h-32 flex items-end justify-around px-4 ${buildingOpacity} transition-opacity duration-1000`}>
        {/* Simple CSS shapes for buildings */}
        <div className="w-12 h-24 bg-slate-800 dark:bg-slate-950 mx-1"></div>
        <div className="w-16 h-32 bg-slate-700 dark:bg-slate-900 mx-1"></div>
        <div className="w-10 h-16 bg-slate-800 dark:bg-slate-950 mx-1"></div>
        <div className="w-20 h-28 bg-slate-700 dark:bg-slate-900 mx-1 hidden sm:block"></div>
        <div className="w-14 h-20 bg-slate-800 dark:bg-slate-950 mx-1 hidden md:block"></div>
      </div>

      {/* Ground & Foliage */}
      <div className={`absolute bottom-0 w-full h-8 transition-colors duration-1000 ${groundColor}`}>
        {/* Trees */}
        <div className="absolute bottom-4 left-1/4 flex space-x-8">
          <motion.div 
            animate={{ 
              backgroundColor: isLow ? 'transparent' : '#22c55e',
              height: isLow ? 0 : 32,
              opacity: isLow ? 0 : 1
            }}
            className="w-8 rounded-t-full transition-all duration-1000 origin-bottom"
          />
          <motion.div 
            animate={{ 
              backgroundColor: isLow ? 'transparent' : '#16a34a',
              height: isLow ? 0 : 40,
              opacity: isHigh ? 1 : 0
            }}
            className="w-10 rounded-t-full transition-all duration-1000 origin-bottom"
          />
        </div>
      </div>

      {/* Smog Overlay */}
      {isLow && (
        <div className="absolute inset-0 bg-slate-500/30 dark:bg-slate-900/50 backdrop-blur-[2px] transition-all duration-1000"></div>
      )}
    </div>
  );
}
