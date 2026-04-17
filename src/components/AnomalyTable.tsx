import React from 'react';
import { ShieldAlert, AlertCircle, FileSearch } from 'lucide-react';

interface Anomaly {
    id: string;
    date: string;
    description: string;
    amount: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const AnomalyTable: React.FC = () => {
    const anomalies: Anomaly[] = [];

    return (
        <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-sm border border-zinc-200/60 w-full col-span-1 lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900">
                        <FileSearch size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Identified Discrepancies</h3>
                        <p className="text-xs font-semibold text-zinc-400">AI flagged transactions from parsed documents</p>
                    </div>
                </div>
                <button className="text-[11px] font-bold text-zinc-900 bg-zinc-100 px-4 py-2 rounded-full uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                    View All
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="pb-4 pt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest pl-4">Date</th>
                            <th className="pb-4 pt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Description</th>
                            <th className="pb-4 pt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Amount</th>
                            <th className="pb-4 pt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right pr-4">Flag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {anomalies.map((item) => (
                            <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors group">
                                <td className="py-4 pl-4">
                                    <span className="text-sm font-bold text-zinc-900">{item.date}</span>
                                </td>
                                <td className="py-4 pl-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-zinc-800">{item.description}</span>
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{item.id}</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <span className="text-sm font-black text-zinc-900">{item.amount}</span>
                                </td>
                                <td className="py-4 text-right pr-4">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${item.severity === 'HIGH' ? 'bg-primary/10 text-primary' :
                                        item.severity === 'MEDIUM' ? 'bg-amber-100/50 text-amber-600' :
                                            'bg-zinc-100 text-zinc-500'
                                        }`}>
                                        {item.severity === 'HIGH' && <ShieldAlert size={14} strokeWidth={3} />}
                                        {item.severity === 'MEDIUM' && <AlertCircle size={14} strokeWidth={3} />}
                                        {item.severity}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
