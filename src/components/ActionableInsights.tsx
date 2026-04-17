import React from 'react';
import { ArrowRight, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface Insight {
    type: 'CRITICAL' | 'TIP';
    title: string;
    description: string;
    action: string;
}

interface ActionableInsightsProps {
    onNavigateToAnalytics?: () => void;
}

export const ActionableInsights: React.FC<ActionableInsightsProps> = ({ onNavigateToAnalytics }) => {
    const insights: Insight[] = [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 col-span-1 lg:col-span-2 gap-4 lg:gap-6 mt-4 lg:mt-0">
            {insights.map((insight, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className={`p-6 lg:p-8 rounded-[40px] flex flex-col justify-between shadow-sm relative overflow-hidden group ${insight.type === 'CRITICAL'
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-900 border border-zinc-200/60'
                        }`}
                >
                    {insight.type === 'CRITICAL' && (
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <AlertTriangle size={120} />
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-[14px] ${insight.type === 'CRITICAL' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-zinc-100 text-zinc-500'}`}>
                                {insight.type === 'CRITICAL' ? <AlertTriangle size={18} strokeWidth={2.5} /> : <Lightbulb size={18} strokeWidth={2.5} />}
                            </div>
                            <span className={`text-[11px] font-bold tracking-widest uppercase ${insight.type === 'CRITICAL' ? 'text-primary' : 'text-zinc-500'}`}>
                                {insight.type === 'CRITICAL' ? 'High Priority' : 'Observation'}
                            </span>
                        </div>

                        <h4 className="text-xl lg:text-2xl font-bold mb-3 tracking-tight">{insight.title}</h4>
                        <p className={`text-sm lg:text-base font-medium leading-relaxed max-w-sm ${insight.type === 'CRITICAL' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {insight.description}
                        </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <button
                            onClick={() => {
                                if (insight.action === 'View Analysis' && onNavigateToAnalytics) {
                                    onNavigateToAnalytics();
                                }
                            }}
                            className={`px-6 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${insight.type === 'CRITICAL'
                                ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                                : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                }`}>
                            {insight.action}
                            <ArrowRight size={16} strokeWidth={2.5} />
                        </button>

                        {/* Small visual detail mimicking reference cards */}
                        <div className="flex -space-x-2">
                            <img src="https://ui-avatars.com/api/?name=AI&background=f4f4f5&color=18181b" className="w-8 h-8 rounded-full border-2 border-[inherit] opacity-80" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
