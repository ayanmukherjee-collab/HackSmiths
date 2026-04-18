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

interface DataPoint {
    month: string;
    grossSales: number;
    purchase: number;
    grossProfit: number;
    gpPct: number;
    netProfit: number;
    npPct: number;
    // Legacy fallback fields
    name?: string;
    industry?: string;
}

interface GraphEntry {
    year: string;
    chartType: string;
    title: string;
    data: DataPoint[];
}

interface GraphJson {
    availableYears: string[];
    graphs: GraphEntry[];
}

type MetricKey = 'npPct' | 'gpPct' | 'grossSales' | 'netProfit';

const METRICS: { key: MetricKey; label: string; suffix: string; color: string }[] = [
    { key: 'npPct', label: 'NP %', suffix: '%', color: '#ffffff' },
    { key: 'gpPct', label: 'GP %', suffix: '%', color: '#4ade80' },
    { key: 'grossSales', label: 'Revenue', suffix: 'K', color: '#60a5fa' },
    { key: 'netProfit', label: 'Net Profit', suffix: 'K', color: '#f59e0b' },
];

export const MarginChart: React.FC<MarginChartProps> = ({ activeFileId }) => {
    const [graphJson, setGraphJson] = useState<GraphJson | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [activeMetric, setActiveMetric] = useState<MetricKey>('npPct');
    const [showSettings, setShowSettings] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const url = activeFileId
            ? `http://localhost:5001/api/graph-data/${activeFileId}`
            : `http://localhost:5001/uploads/graph.json`;

        fetch(url)
            .then(res => res.json())
            .then(json => {
                const payload = json?.data || json;
                if (payload?.availableYears?.length) {
                    setGraphJson(payload);
                    setSelectedYear(payload.availableYears[payload.availableYears.length - 1]);
                } else if (payload?.graphs?.[0]) {
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

    const activeGraph = graphJson?.graphs?.find(g => g.year === selectedYear);
    const chartData = activeGraph?.data?.map(d => {
        // Intelligent label shortening: "January" → "Jan", "Dec 2022" → "D22"
        const rawMonth = d.month || d.name || 'N/A';
        let label = rawMonth;
        const quarterMatch = rawMonth.match(/^(\w{3})\s+(\d{4})$/);
        if (quarterMatch) {
            label = quarterMatch[1][0] + quarterMatch[2].slice(2);
        } else if (rawMonth.length > 3) {
            label = rawMonth.substring(0, 3);
        }
        return {
            label,
            fullMonth: rawMonth,
            npPct: d.npPct ?? 0,
            gpPct: d.gpPct ?? 0,
            grossSales: d.grossSales ?? 0,
            netProfit: d.netProfit ?? 0,
            grossProfit: d.grossProfit ?? 0,
            purchase: d.purchase ?? 0,
        };
    }) || [];

    const currentMetricInfo = METRICS.find(m => m.key === activeMetric)!;
    const currentValue = chartData.length > 0 ? chartData[chartData.length - 1][activeMetric] : 0;
    const availableYears = graphJson?.availableYears || [];

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
                        <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">{currentMetricInfo.label}</span>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">{currentValue}{currentMetricInfo.suffix}</p>
                </div>

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
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                    Metric
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {METRICS.map(m => (
                                        <button
                                            key={m.key}
                                            onClick={() => setActiveMetric(m.key)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeMetric === m.key ? 'bg-primary text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            <div className="w-full h-[260px] min-h-[260px] -ml-4 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <XAxis
                            dataKey="label"
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
                            formatter={(_value: number, _name: string, props: any) => {
                                const d = props.payload;
                                const val = d[activeMetric];
                                // Auto-detect unit: corporate values are in Crores (typically > 1000)
                                const isCr = d.grossSales > 1000;
                                const unit = isCr ? 'Cr' : 'K';
                                const fmtVal = currentMetricInfo.suffix === '%' ? `${val}%` : `₹${val.toLocaleString('en-IN')} ${unit}`;
                                const rev = `₹${d.grossSales.toLocaleString('en-IN')} ${unit}`;
                                const np = `₹${d.netProfit.toLocaleString('en-IN')} ${unit}`;
                                return [
                                    fmtVal,
                                    `${d.fullMonth} · Rev: ${rev} · NP: ${np}`
                                ];
                            }}
                            labelStyle={{ display: 'none' }}
                        />

                        <Line
                            type="monotone"
                            dataKey={activeMetric}
                            stroke={currentMetricInfo.color}
                            strokeWidth={4}
                            dot={{ stroke: '#18181b', strokeWidth: 3, r: 6, fill: '#fff', cursor: 'pointer' }}
                            activeDot={{ r: 8, fill: '#f97316', stroke: '#18181b', strokeWidth: 4, cursor: 'pointer' }}
                            animationDuration={600}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
};
