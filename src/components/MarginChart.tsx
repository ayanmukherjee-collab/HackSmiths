import React, { useState, useRef, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { Settings, ChevronDown } from 'lucide-react';

interface MarginChartProps {
    activeFileId: string | null;
}

interface GraphEntry {
    year: string;
    chartType: string;
    title: string;
    dataKey1: string;
    data: { name: string; industry?: string; month?: string; npPct: number }[];
}

interface GraphJson {
    availableYears: string[];
    graphs: GraphEntry[];
}

export const MarginChart: React.FC<MarginChartProps> = ({ activeFileId }) => {
    const [graphJson, setGraphJson] = useState<GraphJson | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [durationLimit, setDurationLimit] = useState(12);
    const [showSettings, setShowSettings] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch graph data
    useEffect(() => {
        const url = activeFileId
            ? `http://localhost:5001/api/graph-data/${activeFileId}`
            : `http://localhost:5001/uploads/graph.json`;

        fetch(url)
            .then(res => res.json())
            .then(json => {
                // Handle both shapes: API wraps in { data: { ... } }, static file is direct
                const payload = json?.data || json;

                if (payload?.availableYears?.length) {
                    // New year-wise format
                    setGraphJson(payload);
                    setSelectedYear(payload.availableYears[payload.availableYears.length - 1]); // default to latest year
                } else if (payload?.graphs?.[0]) {
                    // Legacy flat format — wrap it
                    const legacy: GraphJson = {
                        availableYears: ['All'],
                        graphs: [{ year: 'All', ...payload.graphs[0] }]
                    };
                    setGraphJson(legacy);
                    setSelectedYear('All');
                }
            })
            .catch(err => console.error('Failed to fetch graph data', err));
    }, [activeFileId]);


    // Get data for selected year
    const activeGraph = graphJson?.graphs?.find(g => g.year === selectedYear);
    const chartData = activeGraph?.data?.map(d => ({
        name: d.month ? d.month.substring(0, 3) : 'N/A',
        margin: d.npPct,
        fullName: d.name,
        industry: d.industry || 'Unknown Sector',
        fullMonth: d.month || 'Unknown'
    })) || [];

    const visibleData = chartData.slice(Math.max(chartData.length - durationLimit, 0));
    const currentMargin = visibleData.length > 0 ? visibleData[visibleData.length - 1].margin : 0;
    const availableYears = graphJson?.availableYears || [];

    // Handle click outside to close popover
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-[40px] shadow-xl w-full flex flex-col col-span-1 lg:col-span-2 relative min-h-[360px]">

            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">Net Profit Margin</span>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">{currentMargin}%</p>
                </div>

                {/* Settings Gear Popover */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${showSettings ? 'bg-zinc-800 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`}
                    >
                        <Settings size={18} strokeWidth={2.5} />
                    </button>

                    {showSettings && (
                        <div className="absolute right-0 top-12 mt-1 w-64 bg-zinc-800 text-white rounded-[24px] p-5 shadow-2xl border border-zinc-700 z-50 animate-in fade-in zoom-in-95 duration-200">

                            <div className="mb-6">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 overflow-hidden">
                                    Fiscal Year
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 outline-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-zinc-950 transition-colors"
                                    >
                                        <span>FY {selectedYear}</span>
                                        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                            {availableYears.map((yr) => (
                                                <div
                                                    key={yr}
                                                    onClick={() => {
                                                        setSelectedYear(yr);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-colors ${selectedYear === yr ? 'bg-primary/20 text-primary' : 'text-zinc-300 hover:bg-zinc-800'}`}
                                                >
                                                    FY {yr}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Companies Shown
                                    </label>
                                    <span className="text-xs font-black text-primary">{durationLimit}</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max={Math.max(chartData.length, 12)}
                                    step="1"
                                    value={durationLimit}
                                    onChange={(e) => setDurationLimit(Number(e.target.value))}
                                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[9px] font-bold text-zinc-500 mt-2 tracking-widest">
                                    <span>3</span>
                                    <span>6</span>
                                    <span>9</span>
                                    <span>All</span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            <div className="w-full h-[260px] min-h-[260px] -ml-4 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visibleData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
                            dy={10}
                            interval={0}
                            padding={{ left: 20, right: 20 }}
                        />
                        <YAxis
                            hide={true}
                            domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip
                            cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                            itemStyle={{ color: '#09090b' }}
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderRadius: '20px',
                                border: 'none',
                                color: '#09090b',
                                fontWeight: 700,
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                            }}
                            formatter={(value: number, _name: string, props: any) => [`${value}%`, `${props.payload.fullMonth} | ${props.payload.industry} | ${props.payload.fullName}`]}
                            labelStyle={{ display: 'none' }}
                        />

                        <Line
                            type="monotone"
                            dataKey="margin"
                            stroke="#ffffff"
                            strokeWidth={4}
                            dot={{ stroke: '#18181b', strokeWidth: 3, r: 6, fill: '#fff', cursor: 'pointer', onClick: () => { } }}
                            activeDot={{ r: 8, fill: '#f97316', stroke: '#18181b', strokeWidth: 4, cursor: 'pointer' }}
                            animationDuration={600}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
};
