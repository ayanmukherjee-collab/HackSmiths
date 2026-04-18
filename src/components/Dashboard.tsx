import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { ScoreCard } from './ScoreCard';
import { MetricsGrid } from './MetricsGrid';
import { MarginChart } from './MarginChart';
import { ActionableInsights } from './ActionableInsights';
import { ExpenseBreakdown } from './ExpenseBreakdown';
import { AnomalyTable } from './AnomalyTable';
import { UploadWidget } from './UploadWidget';

interface DashboardProps {
    activeFileId: string | null;
    onUpload: (file: File) => void;
    onNavigateToAnalytics?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeFileId, onUpload, onNavigateToAnalytics }) => {
    const [healthData, setHealthData] = useState<any>(null);

    // Fetch aggregate health score from all uploaded files
    const fetchHealthScore = () => {
        fetch('http://localhost:5001/api/health-score')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    setHealthData(res.data);
                }
            })
            .catch(err => console.error("Failed to fetch health score", err));
    };

    useEffect(() => {
        fetchHealthScore();
    }, []);

    useEffect(() => {
        if (activeFileId) {
            fetch(`http://localhost:5001/api/parsed/${activeFileId}`)
                .then(res => res.json())
                .catch(err => console.error("Failed to fetch parsed data", err));
            // Refresh health score when a new file is selected (after upload)
            fetchHealthScore();
        }
    }, [activeFileId]);

    return (
        <div className="pt-2 lg:pt-6 pb-24 max-w-[1400px] mx-auto">


            {/* Expanded Desktop Header */}
            <div className="mb-10 lg:mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-3">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] md:text-xs font-bold tracking-[0.15em] uppercase text-zinc-500">
                            Analysis Complete
                        </span>
                    </div>
                    <h1 className="text-5xl lg:text-[64px] font-black text-zinc-900 tracking-tight leading-none">
                        Global Stats
                    </h1>
                </div>

                <div className="w-full sm:w-auto flex mt-2 sm:mt-0">
                    <button className="group h-14 sm:h-12 px-8 w-full sm:w-auto flex items-center justify-center gap-2.5 bg-zinc-900 text-white rounded-full hover:bg-black hover:shadow-xl hover:shadow-zinc-900/20 active:scale-[0.98] transition-all duration-300 font-semibold text-sm sm:text-base ring-1 ring-zinc-900/10">
                        <Download size={18} strokeWidth={2.5} className="group-hover:translate-y-0.5 transition-transform duration-300" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">

                {/* Row 1: Top Metrics */}
                <div className="col-span-1 lg:col-span-2 xl:col-span-1 flex">
                    <ScoreCard
                        score={healthData?.overallScore || 0}
                        status={healthData?.overallRiskLabel || null}
                        totalCompanies={healthData?.totalCompanies || 0}
                    />
                </div>

                <div className="col-span-1 lg:col-span-2 xl:col-span-2 flex">
                    <MetricsGrid healthData={healthData} />
                </div>

                <div className="col-span-1 lg:col-span-2 xl:col-span-1 flex">
                    <ExpenseBreakdown />
                </div>

                {/* Row 2: Charts and Insights */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 flex">
                    <MarginChart activeFileId={activeFileId} />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1 flex w-full">
                    <ActionableInsights onNavigateToAnalytics={onNavigateToAnalytics} />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1 flex w-full">
                    <UploadWidget onUpload={onUpload} />
                </div>

                {/* Row 3: Bottom Table */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4 mt-2">
                    <AnomalyTable anomalies={healthData?.anomalies || []} />
                </div>

            </div>
        </div>
    );
};
