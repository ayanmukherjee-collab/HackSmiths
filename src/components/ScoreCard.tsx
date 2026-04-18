import React from 'react';
import { motion } from 'framer-motion';

interface ScoreCardProps {
    score: number;
    status?: string | null;
    totalCompanies?: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, status, totalCompanies = 0 }) => {
    const roundedScore = Math.round(score);
    const hasData = roundedScore > 0 || totalCompanies > 0;

    const getStatusColor = () => {
        if (!status) return 'bg-zinc-400';
        const s = status.toLowerCase();
        if (s === 'good') return 'bg-emerald-500';
        if (s === 'medium') return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getStatusTextColor = () => {
        if (!status) return 'text-zinc-400';
        const s = status.toLowerCase();
        if (s === 'good') return 'text-emerald-600';
        if (s === 'medium') return 'text-amber-600';
        return 'text-rose-600';
    };

    return (
        <div className="bg-white p-6 lg:p-8 rounded-[40px] flex flex-col items-center justify-between shadow-sm border border-zinc-200/60 w-full col-span-1 min-h-[340px] relative overflow-hidden group">

            <div className="flex items-center gap-2 w-full justify-start z-10">
                <span className={`w-2 h-2 rounded-full ${hasData ? getStatusColor() : 'bg-zinc-900'}`} />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Health Score</h3>
            </div>

            <div className="relative flex-1 w-full flex flex-col items-center justify-center z-10">

                {/* Subtle Floating Numerical Indicator */}
                <motion.div
                    animate={{
                        y: [0, -6, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: [0.45, 0, 0.55, 1],
                        repeatType: "loop"
                    }}
                    className="relative"
                    style={{ willChange: 'transform' }}
                >
                    <span className="text-[120px] font-black tracking-[-0.06em] leading-none text-zinc-900">
                        {roundedScore}
                    </span>
                    <span className="absolute -right-10 top-8 text-2xl font-black text-zinc-300">%</span>
                </motion.div>

            </div>

            <div className="flex items-end justify-between w-full z-10">
                <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                    <p className={`text-[14px] font-bold ${hasData ? getStatusTextColor() : 'text-zinc-400'}`}>
                        {hasData
                            ? `${totalCompanies} companies`
                            : 'No data yet'
                        }
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${hasData ? getStatusColor() : 'bg-emerald-500'} animate-pulse`} />
                        <span className={`text-[11px] font-black tracking-widest uppercase ${hasData ? getStatusTextColor() : 'text-zinc-400'}`}>
                            {hasData ? (status || 'Active') : 'Awaiting'}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

