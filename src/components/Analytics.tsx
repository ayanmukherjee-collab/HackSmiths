import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FileText, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';


export const Analytics: React.FC<{ activeFileId: string | null }> = ({ activeFileId }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDoc, setShowDoc] = useState(false);
    const [graphData, setGraphData] = useState<any>(null);
    const [strategy, setStrategy] = useState<any>(null);

    useEffect(() => {
        const endpoint = activeFileId ? `http://localhost:5001/api/graph-data/${activeFileId}` : `http://localhost:5001/api/analytics`;

        fetch(endpoint)
            .then(res => res.json())
            .then(res => setGraphData(res.data))
            .catch(err => console.error(err));

        setStrategy(null);
    }, [activeFileId]);

    const handleGenerate = async () => {
        if (strategy) {
            setShowDoc(true);
            return;
        }

        setIsGenerating(true);
        setShowDoc(true);
        try {
            const endpoint = activeFileId
                ? `http://localhost:5001/api/strategy/predict/${activeFileId}`
                : `http://localhost:5001/api/strategy/portfolio`;

            const response = await fetch(endpoint);

            if (response.headers.get("Content-Type")?.includes("application/json")) {
                const res = await response.json();
                if (!res.success) {
                    throw new Error(res.message || "Failed to generate AI data.");
                }
                setStrategy(res.data);
                setIsGenerating(false);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Stream unavailable");
            const decoder = new TextDecoder("utf-8");

            let fullText = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffer.trim()) {
                        const lines = buffer.split("\n");
                        for (const line of lines) {
                            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.chunk && data.chunk !== "[DONE]") fullText += data.chunk;
                                } catch (e) { }
                            }
                        }
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                let shouldUpdate = false;
                for (const line of lines) {
                    if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.chunk && data.chunk !== "[DONE]") {
                                fullText += data.chunk;
                                shouldUpdate = true;
                            }
                        } catch (e) { }
                    }
                }

                if (shouldUpdate) {
                    const extractTag = (text: string, tag: string) => {
                        const regex = new RegExp(`<${tag}>([\\s\\S]*?)(</${tag}>|$)`, 'i');
                        const match = text.match(regex);
                        return match ? match[1].trim() : "";
                    };

                    setStrategy({
                        executiveSummary: extractTag(fullText, "executiveSummary"),
                        keyRecommendations: strategy?.keyRecommendations || [],
                        nextSteps: extractTag(fullText, "nextSteps")
                    });
                }
            }

            const extractTagExact = (text: string, tag: string) => {
                const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
                const match = text.match(regex);
                return match ? match[1].trim() : "";
            };

            let keyRecsText = extractTagExact(fullText, "keyRecommendations").replace(/```json/gi, '').replace(/```/gi, '').trim();
            let keyRecs = [];
            try {
                if (keyRecsText) keyRecs = JSON.parse(keyRecsText);
            } catch (e) { }

            setStrategy({
                executiveSummary: extractTagExact(fullText, "executiveSummary"),
                keyRecommendations: keyRecs,
                nextSteps: extractTagExact(fullText, "nextSteps")
            });

        } catch (error: any) {
            console.error("Fetch generation error:", error);
            setStrategy({
                executiveSummary: `## Error \n\nAn error occurred while generating the strategy document: ${error.message}\n\nPlease try again later.`,
                keyRecommendations: [],
                nextSteps: ""
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('strategy-doc-content');
        if (!element) return;

        const opt: any = {
            margin: 0.5,
            filename: 'FInSight_Strategic_Action_Plan.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, ignoreElements: (node: any) => node.id === 'pdf-actions' },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    // Construct chart data from graphData payload dynamically
    const cashflowData = activeFileId ? graphData?.graphs?.[1]?.data || [] : graphData?.cashflow || [];
    const projectionData = activeFileId ? graphData?.graphs?.[2]?.data || [] : graphData?.projection || [];

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
                            <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }} dy={10} padding={{ left: 20, right: 20 }} />
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
                            <AreaChart data={projectionData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
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
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }} dy={10} padding={{ left: 20, right: 20 }} />
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
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Q3 Strategic Action Plan</h2>
                                        <AnimatePresence>
                                            {isGenerating && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden relative"
                                                >
                                                    <motion.div
                                                        className="absolute inset-0 bg-violet-500/20"
                                                        animate={{ left: ["-100%", "100%"] }}
                                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    />
                                                    <div className="flex gap-1 items-center relative z-10 pt-0.5">
                                                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-white uppercase tracking-widest relative z-10">
                                                        Analyzing
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
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
                            <div id="strategy-doc-content" className="max-w-4xl mx-auto space-y-12 pb-24">
                                <section>
                                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-6">Executive Summary</h1>
                                    <div className="text-xl text-zinc-600 leading-relaxed font-medium">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-3xl lg:text-4xl font-black text-zinc-900 mt-10 mb-6 pb-4 border-b border-zinc-200/60" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900 mt-8 mb-4" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-xl lg:text-2xl font-bold text-zinc-900 mt-6 mb-3" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-3 marker:text-violet-500" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-3 marker:text-violet-500 font-semibold text-zinc-900" {...props} />,
                                                li: ({ node, ...props }) => <li className="text-[1.125rem] leading-relaxed text-zinc-600 font-medium" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-6 text-[1.125rem] leading-relaxed text-zinc-600 font-medium inline-block w-full" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-extrabold text-zinc-900" {...props} />,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-violet-500 pl-4 italic text-zinc-500 my-6 bg-zinc-50 py-3 rounded-r-xl" {...props} />,
                                                code: ({ node, inline, className, children, ...props }: any) => {
                                                    if (String(children).replace(/\n$/, '') === 'cursor') {
                                                        return <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="inline-block w-3 h-[1.125rem] bg-violet-500 ml-1.5 align-middle rounded-[2px]" />;
                                                    }
                                                    return <code className={className} {...props}>{children}</code>;
                                                }
                                            }}
                                        >
                                            {strategy?.executiveSummary ? (
                                                strategy.executiveSummary + (isGenerating ? " `cursor`" : "")
                                            ) : (
                                                isGenerating ? "Generating comprehensive financial insight based on available data... Please wait. `cursor`" : "No summary available."
                                            )}
                                        </ReactMarkdown>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-8">Key Recommendations</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {strategy?.keyRecommendations ? strategy.keyRecommendations.map((rec: any, idx: number) => (
                                            <div key={idx} className={`bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 relative overflow-hidden ${idx === 2 ? 'md:col-span-2' : ''}`}>
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                                    <span className="text-2xl font-black text-zinc-900">0{idx + 1}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">{rec.title}</h3>
                                                <p className="text-zinc-600 leading-relaxed font-medium text-lg lg:max-w-2xl">{rec.description}</p>
                                            </div>
                                        )) : (
                                            <div className="col-span-1 text-zinc-500 font-bold p-8">No recommendations generated yet.</div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <div className="bg-zinc-900 text-white p-10 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-10 blur-xl">
                                            <Sparkles size={120} />
                                        </div>
                                        <h2 className="text-3xl font-bold tracking-tight mb-6">Immediate Next Steps</h2>
                                        <p className="text-xl leading-relaxed text-zinc-300 font-medium mb-8 lg:max-w-3xl relative z-10">
                                            {strategy?.nextSteps ? (
                                                strategy.nextSteps + (isGenerating ? " `cursor`" : "")
                                            ) : (
                                                isGenerating ? "Synthesizing immediate next steps... `cursor`" : "No next steps generated."
                                            )}
                                        </p>
                                        <div id="pdf-actions" className="flex flex-wrap gap-4 relative z-10">
                                            <button className="px-8 py-4 bg-white text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-colors">
                                                Share Document
                                            </button>
                                            <button onClick={handleDownloadPDF} className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-colors">
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
