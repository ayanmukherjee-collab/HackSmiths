import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { ScoreCard } from './ScoreCard';
import { MetricsGrid } from './MetricsGrid';
import { MarginChart } from './MarginChart';
import { ActionableInsights } from './ActionableInsights';
import { ExpenseBreakdown } from './ExpenseBreakdown';
import { AnomalyTable } from './AnomalyTable';
import { UploadWidget } from './UploadWidget';

interface DashboardProps {
    onUpload: (file: File) => void;
    onNavigateToAnalytics?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onUpload, onNavigateToAnalytics }) => {
    return (
        <div className="pt-2 lg:pt-6 pb-24 max-w-[1400px] mx-auto">


            {/* Expanded Desktop Header */}
            <div className="mb-12 lg:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-500">
                            Analysis Complete
                        </span>
                    </div>
                    <h1 className="text-5xl lg:text-[64px] font-black text-zinc-900 tracking-[-0.04em] leading-none">Global Stats</h1>
                </div>

                <div className="grid grid-cols-2 md:flex items-center gap-3">
                    <button className="h-12 px-6 flex items-center justify-center gap-2 bg-white text-zinc-900 border border-zinc-200 shadow-sm rounded-full hover:bg-zinc-50 transition-colors font-bold text-sm">
                        <Calendar size={18} strokeWidth={2.5} />
                        <span>Oct - Mar</span>
                    </button>
                    <button className="h-12 px-6 flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 shadow-lg transition-colors font-bold text-sm">
                        <Download size={18} strokeWidth={2.5} />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">

                {/* Row 1: Top Metrics */}
                <div className="col-span-1 lg:col-span-2 xl:col-span-1 flex">
                    <ScoreCard score={0} />
                </div>

                <div className="col-span-1 lg:col-span-2 xl:col-span-2 flex">
                    <MetricsGrid />
                </div>

                <div className="col-span-1 lg:col-span-2 xl:col-span-1 flex">
                    <ExpenseBreakdown />
                </div>

                {/* Row 2: Charts and Insights */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 flex">
                    <MarginChart />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1 flex w-full">
                    <ActionableInsights onNavigateToAnalytics={onNavigateToAnalytics} />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1 flex w-full">
                    <UploadWidget onUpload={onUpload} />
                </div>

                {/* Row 3: Bottom Table */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4 mt-2">
                    <AnomalyTable />
                </div>

            </div>
        </div>
    );
};
