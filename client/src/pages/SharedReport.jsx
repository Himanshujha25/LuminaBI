import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Download, FileText, MonitorPlay, Calendar, Database, ArrowLeft } from 'lucide-react';

export default function SharedReport() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await axios.get(`${API_URL}/exports/view/${id}`);
                setReport(res.data);
            } catch (err) {
                console.error("Failed to load report", err);
                setError("Report not found or has been expired.");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching Lumina Insight...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
                <h1 className="text-3xl font-black text-white mb-4">404</h1>
                <p className="text-slate-400 mb-8">{error}</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-bold text-sm uppercase transition-all">
                    <ArrowLeft size={16} />
                    Back to Lumina
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">
            {/* Header */}
            <header className="border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-indigo-500 font-black text-xl tracking-tighter">LUMINA BI</Link>
                        <div className="h-4 w-px bg-slate-800"></div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-tight m-0">{report.name || 'Shared Insight'}</h1>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                                    <Calendar size={10} /> {new Date(report.created_at).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Global Share</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all">
                            <Download size={14} />
                            Download Static
                         </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto p-6 lg:p-10">
                <div className="bg-[#111827] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <FileText size={16} className="text-indigo-400" />
                             <span className="text-xs font-black uppercase tracking-widest text-slate-300">Data Perspective Snapshot</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-indigo-400 uppercase">Interactive View Active</span>
                         </div>
                    </div>
                    
                    <div className="relative aspect-video bg-black flex items-center justify-center p-2">
                         {report.content?.image ? (
                             <img 
                                src={report.content.image} 
                                alt="Dashboard Snapshot" 
                                className="w-full h-full object-contain shadow-2xl"
                             />
                         ) : (
                             <div className="text-center p-20">
                                 <MonitorPlay size={48} className="text-slate-800 mx-auto mb-4" />
                                 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">This report contains dynamic metadata only.</p>
                             </div>
                         )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                     <div className="p-6 rounded-lg bg-slate-900/40 border border-slate-800">
                         <h3 className="text-[10px] font-black uppercase text-slate-500 mb-2">Dataset Source</h3>
                         <div className="flex items-center gap-3">
                             <Database size={18} className="text-indigo-500" />
                             <span className="text-sm font-bold text-slate-200">{report.name}</span>
                         </div>
                     </div>
                     <div className="p-6 rounded-lg bg-slate-900/40 border border-slate-800">
                         <h3 className="text-[10px] font-black uppercase text-slate-500 mb-2">Report Type</h3>
                         <div className="flex items-center gap-3">
                             <FileText size={18} className="text-indigo-500" />
                             <span className="text-sm font-bold text-slate-200 uppercase">{report.type} Perspective</span>
                         </div>
                     </div>
                     <div className="p-6 rounded-lg bg-indigo-600/10 border border-indigo-500/20">
                         <h3 className="text-[10px] font-black uppercase text-indigo-400 mb-2">Lumina AI Insight</h3>
                         <p className="text-xs text-slate-300 leading-relaxed italic">"This data snapshot was generated using Lumina's deep-intelligence contextual engine."</p>
                     </div>
                </div>
            </main>
        </div>
    );
}
