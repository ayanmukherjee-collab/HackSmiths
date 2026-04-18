import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#e4e4e7'];

export const ExpenseBreakdown: React.FC = () => {
    const [data, setData] = useState([
        { name: 'Loading...', value: 1 },
    ]);
    const [total, setTotal] = useState(0);
    const [unit, setUnit] = useState('K');

    useEffect(() => {
        fetch('http://localhost:5001/api/analytics')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data?.opexBreakdown?.length > 0) {
                    setData(res.data.opexBreakdown);
                    const sum = res.data.opexBreakdown.reduce((acc: number, curr: any) => acc + curr.value, 0);
                    setTotal(sum);
                    setUnit(res.data.unit || 'K');
                }
            })
            .catch(err => console.error("Failed to fetch analytics data for opex", err));
    }, []);

    const formatTotal = () => {
        if (unit === 'Cr') {
            if (total >= 100000) return `₹${(total / 100000).toFixed(1)}L Cr`;
            if (total >= 1000) return `₹${(total / 1000).toFixed(1)}K Cr`;
            return `₹${total.toLocaleString('en-IN')} Cr`;
        }
        // SME: values in thousands
        if (total >= 1000) return `₹${(total / 1000).toFixed(1)}M`;
        return `₹${total}K`;
    };

    const formatValue = (value: number) => {
        if (unit === 'Cr') return `₹${value.toLocaleString('en-IN')} Cr`;
        return `₹${value}K`;
    };

    // Determine latest period label from cashflow data
    const [periodLabel, setPeriodLabel] = useState('Latest');
    useEffect(() => {
        fetch('http://localhost:5001/api/analytics')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data?.cashflow?.length > 0) {
                    const last = res.data.cashflow[res.data.cashflow.length - 1];
                    setPeriodLabel(last.name || 'Latest');
                }
            })
            .catch(() => { });
    }, []);

    return (
        <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-sm border border-zinc-200/60 w-full col-span-1 flex flex-col justify-between min-h-[340px]">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Opex Breakdown</h3>
                <button className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                    {periodLabel}
                </button>
            </div>
            <p className="text-xs font-semibold text-zinc-400 mb-6">Distribution of overall expenses</p>

            <div className="flex-1 w-full flex items-center justify-center relative min-h-[160px]">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-zinc-900 tracking-tight">
                        {formatTotal()}
                    </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontWeight: 600, color: '#18181b', fontSize: '12px' }}
                            formatter={(value: number, name: string) => {
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                                return [`${formatValue(value)} (${pct}%)`, name];
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span className="text-[11px] font-bold text-zinc-600 truncate">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
