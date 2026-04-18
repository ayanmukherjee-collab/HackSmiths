import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, LineChart, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface Metric {
    label: string;
    value: string;
    sub: string;
    isPositive: boolean;
    icon: React.ReactNode;
}

export const MetricsGrid: React.FC<{ healthData: any }> = ({ healthData }) => {
    const agg = healthData?.aggregates;
    const years = healthData?.yearBreakdown || [];
    const latestYear = years.length > 0 ? years[years.length - 1] : null;
    const prevYear = years.length > 1 ? years[years.length - 2] : null;

    const metrics: Metric[] = [
        {
            label: 'Liquidity Ratio',
            value: agg?.avgCurrentRatio?.toFixed(2) || '0',
            sub: prevYear ? `${prevYear.year} avg` : '0',
            isPositive: (agg?.avgCurrentRatio || 0) >= 1.5,
            icon: <Wallet size={18} fill="currentColor" strokeWidth={0} />,
        },
        {
            label: 'Expense Ratio',
            value: agg?.avgDebtEquityRatio?.toFixed(2) || '0',
            sub: prevYear ? `${prevYear.year} avg` : '0%',
            isPositive: (agg?.avgDebtEquityRatio || 0) < 1.0,
            icon: <Receipt size={18} fill="currentColor" strokeWidth={0} />,
        },
        {
            label: 'Profitability',
            value: agg ? `${agg.avgNpPct?.toFixed(1)}%` : '0%',
            sub: latestYear ? `FY ${latestYear.year}` : '0%',
            isPositive: (agg?.avgNpPct || 0) > 5,
            icon: <LineChart size={20} strokeWidth={2.5} />,
        },
        {
            label: 'Compliance',
            value: agg ? `${Math.round(agg.complianceRate)}%` : '0%',
            sub: agg ? `${agg.goodCount} Good` : '-',
            isPositive: (agg?.complianceRate || 0) >= 70,
            icon: <FileCheck size={20} strokeWidth={2.5} />,
        },
    ];

    return (
        <div className="bg-white rounded-[40px] p-6 shadow-sm border border-zinc-200/60 w-full col-span-1">
            <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Key Indicators</h3>
                <button className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                    All stats
                </button>
            </div>

            <div className="space-y-4">
                {metrics.map((metric, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-[24px] hover:bg-zinc-50 transition-colors group cursor-default"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-900 text-white rounded-[18px] flex items-center justify-center shadow-md shadow-zinc-300">
                                {metric.icon}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-zinc-900 tracking-tight group-hover:text-zinc-600 transition-colors">{metric.label}</p>
                                <p className="text-xs font-semibold text-zinc-400 mt-0.5">{metric.sub} vs last year</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <span className="font-black text-lg text-zinc-900">{metric.value}</span>
                            {metric.isPositive ? (
                                <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                    <ArrowUpRight size={12} strokeWidth={3} />
                                </div>
                            ) : (
                                <div className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                    <ArrowDownRight size={12} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
