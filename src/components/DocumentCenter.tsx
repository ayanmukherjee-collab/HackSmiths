import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Clock, AlertCircle, Download, Search, Trash2, Eye } from 'lucide-react';
import { UploadWidget } from './UploadWidget';

interface DocumentCenterProps {
    onUpload: (file: File) => void;
}

export const DocumentCenter: React.FC<DocumentCenterProps> = ({ onUpload }) => {
    const [historicalFiles, setHistoricalFiles] = useState<{ id: string; name: string; size: string; date: string; status: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/files');
            const data = await res.json();
            if (data.success && data.files) {
                setHistoricalFiles(data.files);
            }
        } catch (err) {
            console.error("Failed to fetch files", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        // Option: we could set an interval to auto-refresh if there's processing going on, or just rely on onUpload trigger.
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this file from the repository?")) return;

        try {
            const res = await fetch(`http://localhost:5001/api/files/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchFiles();
            } else {
                alert("Failed to delete file: " + data.message);
            }
        } catch (err) {
            console.error("Failed to delete file", err);
            alert("Error trying to delete file");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 lg:pt-6 pb-24 max-w-[1400px] mx-auto"
        >
            <div className="mb-10 w-full flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-500">
                            Repository
                        </span>
                    </div>
                    <h1 className="text-5xl lg:text-[64px] font-black text-zinc-900 tracking-[-0.04em] leading-none mb-4">Document Center</h1>
                    <p className="text-base text-zinc-500 font-medium max-w-2xl">Drop new fiscal filings to feed the AI engine or browse your historical ledger.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                {/* Upload Widget Col */}
                <div className="lg:col-span-1 flex">
                    <UploadWidget onUpload={onUpload} />
                </div>

                {/* Historical Ledger */}
                <div className="bg-white rounded-[40px] shadow-sm border border-zinc-200/60 lg:col-span-2 overflow-hidden flex flex-col max-h-[600px]">
                    <div className="p-6 lg:p-8 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-50/50 shrink-0 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Recent Filings</h3>
                            <p className="text-xs font-semibold text-zinc-500 mt-1">Showing all parsed and flagged documents</p>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="pl-9 pr-4 py-2 border border-zinc-200 rounded-full text-xs font-bold text-zinc-900 bg-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 w-full sm:w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto mb-8 rounded-b-[16px]">
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                <tr>
                                    <th className="pb-3 pt-4 px-6 lg:px-8 text-xs font-bold tracking-widest text-zinc-400 uppercase">Document</th>
                                    <th className="pb-3 pt-4 px-6 text-xs font-bold tracking-widest text-zinc-400 uppercase">Size</th>
                                    <th className="pb-3 pt-4 px-6 text-xs font-bold tracking-widest text-zinc-400 uppercase">Date</th>
                                    <th className="pb-3 pt-4 px-6 text-xs font-bold tracking-widest text-zinc-400 uppercase">Status</th>
                                    <th className="pb-3 pt-4 px-6 text-xs font-bold tracking-widest text-zinc-400 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historicalFiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                                                    <FileText size={24} />
                                                </div>
                                                <p className="text-sm font-bold text-zinc-400">No documents uploaded yet</p>
                                                <p className="text-xs font-semibold text-zinc-300">Upload a PDF to start your financial analysis</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : historicalFiles.map((file) => (
                                    <tr key={file.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors group">
                                        <td className="py-4 px-6 lg:px-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${file.status === 'failed' ? 'bg-red-100/50 text-red-600' : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors'}`}>
                                                    <FileText size={18} />
                                                </div>
                                                <p className="text-sm font-bold text-zinc-900 leading-tight">{file.name}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-zinc-500 whitespace-nowrap">{file.size}</td>
                                        <td className="py-4 px-6 text-sm font-semibold text-zinc-500 whitespace-nowrap">{file.date}</td>
                                        <td className="py-4 px-6">
                                            {file.status === 'parsed' && (
                                                <div className="flex items-center gap-1.5 text-emerald-600 w-max">
                                                    <CheckCircle2 size={14} strokeWidth={3} />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Parsed</span>
                                                </div>
                                            )}
                                            {file.status === 'processing' && (
                                                <div className="flex items-center gap-1.5 text-blue-600 w-max">
                                                    <Clock size={14} strokeWidth={3} className="animate-spin-slow" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Indexing</span>
                                                </div>
                                            )}
                                            {file.status === 'failed' && (
                                                <div className="flex items-center gap-1.5 text-red-600 w-max">
                                                    <AlertCircle size={14} strokeWidth={3} />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Failed</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`http://localhost:5001/uploads/${file.id}.pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 rounded-full inline-flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Preview PDF"
                                                >
                                                    <Eye size={16} />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(file.id)}
                                                    className="w-8 h-8 rounded-full inline-flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete File"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};
