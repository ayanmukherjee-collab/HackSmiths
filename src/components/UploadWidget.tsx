import React, { useState } from 'react';
import { UploadCloud, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadWidgetProps {
    onUpload: (file: File) => void;
}

export const UploadWidget: React.FC<UploadWidgetProps> = ({ onUpload }) => {
    const [isHovering, setIsHovering] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full h-full bg-white p-6 lg:p-8 rounded-[40px] flex flex-col shadow-sm border border-zinc-200/60 mt-4 lg:mt-0">
            <div className="mb-6 flex flex-col mt-2">
                <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-zinc-900">Add Data</h3>
                <p className="text-sm lg:text-base font-medium text-zinc-500 mt-2 leading-relaxed">
                    Upload new GST or P&L files to update stats.
                </p>
            </div>

            <div className="flex-1 w-full flex flex-col justify-end gap-3 min-h-[160px]">
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                    onDragLeave={() => setIsHovering(false)}
                    onDrop={handleDrop}
                    className={`relative rounded-[24px] p-6 flex-1 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${isHovering ? 'bg-zinc-100 border-2 border-dashed border-zinc-400' : 'bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-zinc-300'
                        }`}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]"
                        accept=".pdf"
                        title=" "
                        onChange={handleFileChange}
                    />
                    <div className="w-12 h-12 rounded-full bg-white text-zinc-800 shadow-sm flex items-center justify-center">
                        <UploadCloud size={24} strokeWidth={2} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-zinc-900">
                            Drop PDF here
                        </p>
                    </div>
                </div>

                <AnimatePresence>
                    {file && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 py-3 bg-zinc-900 text-white rounded-[16px] flex items-center gap-3 shadow-md mt-1 mb-1">
                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 shrink-0">
                                    <File size={16} />
                                </div>
                                <div className="flex-1 min-w-0 pr-1">
                                    <p className="text-xs font-semibold truncate leading-tight mb-0.5">{file.name}</p>
                                    <p className="text-[10px] font-medium text-zinc-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => file && onUpload(file)}
                    disabled={!file}
                    className={`w-full h-12 mt-1 font-bold text-sm rounded-full transition-all flex items-center justify-center gap-2 active:scale-95 disabled:shadow-none ${!file ? 'bg-zinc-200 text-zinc-400' : 'bg-zinc-900 text-white shadow-md hover:bg-zinc-800'}`}
                >
                    Start Analysis
                </button>
            </div>
        </div>
    );
};
