"use client";

import { useState, useEffect } from "react";
import {
    Clock,
    Search,
    Filter,
    ArrowUpRight,
    Loader2,
    Calendar,
    Phone,
    MapPin,
    AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ScanLog {
    id: string;
    scan_type: string;
    created_at: string;
    location_lat: number;
    location_lng: number;
    qr_codes: {
        qr_unique_id: string;
        vehicle_number: string;
        owner_name: string;
    };
}

export default function ScanLogsPage() {
    const [logs, setLogs] = useState<ScanLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                setLoading(false);
                return;
            }
            const user = JSON.parse(userStr);

            const { data, error } = await supabase
                .from('scan_logs')
                .select(`
                    id,
                    scan_type,
                    created_at,
                    location_lat,
                    location_lng,
                    qr_codes!inner (
                        qr_unique_id,
                        vehicle_number,
                        owner_name,
                        user_id
                    )
                `)
                .eq('qr_codes.user_id', user.id) // STRICT ISOLATION
                .order('created_at', { ascending: false });

            if (data) setLogs(data as any[]);
            setLoading(false);
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.qr_codes.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.qr_codes.qr_unique_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Scan Activity</h1>
                    <p className="text-slate-400 font-medium text-sm">Real-time interaction history for your fleet.</p>
                </div>
            </div>

            {/* Tight Filter Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-50 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by plate or QR ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition outline-none font-bold text-sm"
                    />
                    <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            {/* Tight Table View */}
            <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Vehicle / QR</th>
                                <th className="px-8 py-5">Event Type</th>
                                <th className="px-8 py-5 text-center">Timestamp</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-slate-50 p-4 rounded-2xl"><Clock className="text-slate-200" /></div>
                                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No activity recorded</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.scan_type === 'emergency' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {log.scan_type === 'emergency' ? <AlertCircle size={18} /> : <QrIcon size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm leading-tight">{log.qr_codes.vehicle_number || "NEW TAG"}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #{log.qr_codes.qr_unique_id.split('-').pop()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${log.scan_type === 'emergency' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {log.scan_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <p className="font-bold text-slate-700 text-xs">{new Date(log.created_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(log.created_at).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <button className="p-2 text-slate-300 hover:text-indigo-600 transition">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function QrIcon({ size, className }: { size: number, className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" /><path d="M12 7v10" /><path d="M7 12h10" /></svg>;
}