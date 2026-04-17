import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FileText, X, Sparkles } from 'lucide-react';

const cashflowData: { name: string; inflow: number; outflow: number }[] = [];

const projectionData: { month: string; actual: number | null; projection: number }[] = [];

export const Analytics: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDoc, setShowDoc] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setShowDoc(true);
        }, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 lg:pt-6 pb-24 max-w-[1400px] mx-auto"
        >
            <div className="mb-10 w-full">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-500">
                        Deep Dive
                    </span>
                </div>
                <h1 className="text-5xl lg:text-[64px] font-black text-zinc-900 tracking-[-0.04em] leading-none mb-4">Analytics</h1>
                <p className="text-base text-zinc-500 font-medium max-w-2xl">Compare your historical financial footprints, dissect cashflow runways, and model accurate projections generated dynamically from your filings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Cashflow Bar Chart Component */}
                <div className="bg-white p-6 lg:p-8 rounded-[40px] shadow-sm border border-zinc-200/60 lg:col-span-2 min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Cashflow Discrepancy</h3>
                            <p className="text-xs font-semibold text-zinc-400">Quarterly Inflow vs Outflow analysis (in Thousands)</p>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-zinc-900" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Inflow</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-zinc-200" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Outflow</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }} dy={10} />
                                <YAxis hide={true} />
                                <Tooltip
                                    cursor={{ fill: '#f4f4f5' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontWeight: 600, color: '#18181b', fontSize: '12px' }}
                                />
                                <Bar dataKey="inflow" fill="#18181b" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="outflow" fill="#e4e4e7" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Executive Summary Card */}
                <div className="bg-zinc-900 p-6 lg:p-8 rounded-[40px] shadow-lg flex flex-col justify-between text-white lg:col-span-1 min-h-[400px]">
                    <div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-6">
                            <FileText size={18} className="text-zinc-300" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-4 leading-tight">Upload a document to generate AI insights.</h3>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                            Your executive summary will appear here once financial data has been processed and analyzed by the AI engine.
                        </p>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full mt-8 py-3 bg-white text-zinc-900 font-bold rounded-xl text-sm hover:bg-zinc-200 transition-all disabled:opacity-80 active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                        {isGenerating ? (
                            <>
                                <motion.div
                                    className="absolute inset-0 bg-white/50"
                                    animate={{ left: ["-100%", "100%"] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                />
                                <Sparkles size={16} className="text-violet-500 animate-pulse relative z-10" />
                                <span className="relative z-10 text-zinc-700">Synthesizing Data...</span>
                            </>
                        ) : 'Generate Strategy Doc'}
                    </button>
                </div>

                {/* Trailing Projections Area Chart */}
                <div className="bg-white p-6 lg:p-8 rounded-[40px] shadow-sm border border-zinc-200/60 lg:col-span-3 min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Revenue Projection Modeling</h3>
                            <p className="text-xs font-semibold text-zinc-400">Actuals mapped alongside AI predicted run-rates</p>
                        </div>
                        <button className="px-4 py-1.5 bg-zinc-100 font-bold text-xs uppercase tracking-wider text-zinc-600 rounded-full hover:bg-zinc-200 transition-colors">
                            Change Model
                        </button>
                    </div>

                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={projectionData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }} dy={10} />
                                <YAxis hide={true} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ color: '#71717a', fontSize: '12px', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="actual" stroke="#18181b" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                                <Area type="monotone" dataKey="projection" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProjection)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <AnimatePresence>
                {showDoc && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] bg-white flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Q3 Strategic Action Plan</h2>
                                    <p className="text-sm font-semibold text-zinc-500">AI Generated based on current financial footprint</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDoc(false)}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
                            <div className="max-w-4xl mx-auto space-y-12 pb-24">
                                <section>
                                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-6">Executive Summary</h1>
                                    <p className="text-xl text-zinc-600 leading-relaxed font-medium">
                                        Based on the analysis of your Q3 financial data and projected revenue models, your operational efficiency has positioned the company strongly. With EBITDA outperforming industry standards by <span className="text-violet-600 font-bold">14%</span>, there is a clear opportunity to accelerate growth.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-8">Key Recommendations</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 relative overflow-hidden">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                                <span className="text-2xl font-black text-zinc-900">01</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">Marketing Re-investment</h3>
                                            <p className="text-zinc-600 leading-relaxed font-medium text-lg">We strongly advise allocating surplus funds toward the upcoming seasonal marketing push. The data indicates a consistent ROI jump during these seasonal cycles.</p>
                                        </div>
                                        <div className="bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 relative overflow-hidden">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                                <span className="text-2xl font-black text-zinc-900">02</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">Operational Streamlining</h3>
                                            <p className="text-zinc-600 leading-relaxed font-medium text-lg">Continue optimizing vendor contract cycles. Historical data suggests renegotiating the core infrastructure tier could yield an additional 4% margin improvement.</p>
                                        </div>
                                        <div className="bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 md:col-span-2 relative overflow-hidden">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                                <span className="text-2xl font-black text-zinc-900">03</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">Cashflow Precaution</h3>
                                            <p className="text-zinc-600 leading-relaxed font-medium text-lg lg:max-w-2xl">Despite strong overall performance, ensure liquid reserves remain at a minimum 3-month runway to buffer against the mild projection dip expected in May.</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="bg-zinc-900 text-white p-10 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-10 blur-xl">
                                            <Sparkles size={120} />
                                        </div>
                                        <h2 className="text-3xl font-bold tracking-tight mb-6">Immediate Next Steps</h2>
                                        <p className="text-xl leading-relaxed text-zinc-300 font-medium mb-8 lg:max-w-3xl relative z-10">
                                            Convene with department leads by Friday to review these action items and initiate the budget transfer for the marketing push. Our predictive models suggest acting within this window maximizes return potential by <span className="text-white font-bold underline decoration-violet-500 underline-offset-8">22%</span> compared to waiting for the next quarter.
                                        </p>
                                        <div className="flex flex-wrap gap-4 relative z-10">
                                            <button className="px-8 py-4 bg-white text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-colors">
                                                Share Document
                                            </button>
                                            <button className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-colors">
                                                Download PDF
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
