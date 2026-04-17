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

const data2023 = [
    { month: 'Jan', margin: 0 },
    { month: 'Feb', margin: 0 },
    { month: 'Mar', margin: 0 },
    { month: 'Apr', margin: 0 },
    { month: 'May', margin: 0 },
    { month: 'Jun', margin: 0 },
    { month: 'Jul', margin: 0 },
    { month: 'Aug', margin: 0 },
    { month: 'Sep', margin: 0 },
    { month: 'Oct', margin: 0 },
    { month: 'Nov', margin: 0 },
    { month: 'Dec', margin: 0 },
];

const data2024 = [
    { month: 'Jan', margin: 0 },
    { month: 'Feb', margin: 0 },
    { month: 'Mar', margin: 0 },
    { month: 'Apr', margin: 0 },
    { month: 'May', margin: 0 },
    { month: 'Jun', margin: 0 },
    { month: 'Jul', margin: 0 },
    { month: 'Aug', margin: 0 },
    { month: 'Sep', margin: 0 },
    { month: 'Oct', margin: 0 },
    { month: 'Nov', margin: 0 },
    { month: 'Dec', margin: 0 }, // Dec projection
];

export const MarginChart: React.FC = () => {
    const [year, setYear] = useState('2024');
    const [durationLimit, setDurationLimit] = useState(12);
    const [showSettings, setShowSettings] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const activeData = year === '2024' ? data2024 : data2023;
    const chartData = activeData.slice(Math.max(activeData.length - durationLimit, 0));
    const currentMargin = activeData[activeData.length - 1].margin;

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
                                    Display Year
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 outline-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-zinc-950 transition-colors"
                                    >
                                        <span>Fiscal Year {year}</span>
                                        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                            {['2024', '2023'].map((item) => (
                                                <div
                                                    key={item}
                                                    onClick={() => {
                                                        setYear(item);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-colors ${year === item ? 'bg-primary/20 text-primary' : 'text-zinc-300 hover:bg-zinc-800'}`}
                                                >
                                                    Fiscal Year {item}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Duration Filter
                                    </label>
                                    <span className="text-xs font-black text-primary">{durationLimit} Months</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="12"
                                    step="1"
                                    value={durationLimit}
                                    onChange={(e) => setDurationLimit(Number(e.target.value))}
                                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[9px] font-bold text-zinc-500 mt-2 tracking-widest">
                                    <span>3M</span>
                                    <span>6M</span>
                                    <span>9M</span>
                                    <span>1YR</span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            <div className="w-full h-[260px] min-h-[260px] -ml-4 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 13, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            hide={true}
                            domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip
                            cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderRadius: '20px',
                                border: 'none',
                                color: '#09090b',
                                fontWeight: 700,
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                            }}
                            formatter={(value: number) => [`${value}%`, 'Margin']}
                            labelStyle={{ color: '#71717a', fontSize: '12px', fontWeight: 600, paddingBottom: '4px' }}
                        />

                        <Line
                            type="monotone"
                            dataKey="margin"
                            stroke="#ffffff"
                            strokeWidth={4}
                            dot={{ stroke: '#18181b', strokeWidth: 3, r: 4, fill: '#fff' }}
                            activeDot={{ r: 8, fill: '#f97316', stroke: '#18181b', strokeWidth: 4 }}
                            animationDuration={600}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
};
