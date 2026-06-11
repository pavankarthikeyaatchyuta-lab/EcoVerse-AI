import { ConsequenceCard as ConsequenceCardType } from '@/store/useStore';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function ConsequenceCard({ card }: { card: ConsequenceCardType }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div 
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 dark:bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Carbon Consequence</h3>
      </div>
      
      <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">
        Your choice: <span className="text-slate-900 dark:text-white font-bold">{card.choice}</span>
      </p>
      
      <p className="text-orange-600 dark:text-orange-400 font-bold text-lg mb-4">
        Generates {card.impact}
      </p>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Equivalent to:</p>
        <ul className="space-y-2">
          {card.equivalent.map((eq, idx) => (
            <li key={idx} className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
              <span className="text-orange-500 mt-1">•</span>
              <span>{eq}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900/50">
        <div>
          <p className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider mb-1">Suggested Alternative</p>
          <p className="text-green-800 dark:text-green-300 font-medium">{card.alternative}</p>
        </div>
        
        {card.impactReductionPercentage > 0 && (
          <div className="mt-3 sm:mt-0 flex items-center space-x-1 text-green-600 dark:text-green-400 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-green-100 dark:border-green-800">
            <TrendingDown className="w-4 h-4" />
            <span>{card.impactReductionPercentage}% Reduction</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
