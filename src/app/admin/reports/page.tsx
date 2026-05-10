"use client";

import { useEffect, useState } from "react";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Calendar, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface Stats {
    totalScans: number;
    emergencyScans: number;
    parkingScans: number;
    growth: string;
}

export default function ReportsPage() {
    const [stats, setStats] = useState<Stats>({
        totalScans: 0,
        emergencyScans: 0,
        parkingScans: 0,
        growth: "LIVE"
    });

    const [barData, setBarData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportStats = async () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                setLoading(false);
                return;
            }
            const user = JSON.parse(userStr);

            setLoading(true);
            try {
                // Fetch ONLY for this user's QR codes
                const { data: userQRs } = await supabase
                    .from('qr_codes')
                    .select('id')
                    .eq('user_id', user.id);
                
                const qrIds = userQRs?.map(q => q.id) || [];

                if (qrIds.length === 0) {
                    setStats({ totalScans: 0, emergencyScans: 0, parkingScans: 0, growth: "0%" });
                    setPieData([{ name: 'No Data', value: 1, color: '#E5E7EB' }]);
                    setLoading(false);
                    return;
                }

                const { count: total } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true }).in('qr_code_id', qrIds);
                const { count: emergency } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true }).eq('scan_type', 'emergency').in('qr_code_id', qrIds);

                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
                sixMonthsAgo.setDate(1);

                const { data: trendData } = await supabase
                    .from('scan_logs')
                    .select('created_at, scan_type')
                    .in('qr_code_id', qrIds)
                    .gte('created_at', sixMonthsAgo.toISOString());

                if (trendData) {
                    const monthMap = new Map();
                    const monthsOrder = [];
                    for (let i = 5; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(1); d.setMonth(d.getMonth() - i);
                        const monthKey = d.toLocaleString('default', { month: 'short' });
                        monthMap.set(monthKey, { normal: 0, emergency: 0 });
                        monthsOrder.push(monthKey);
                    }

                    trendData.forEach(log => {
                        const monthKey = new Date(log.created_at).toLocaleString('default', { month: 'short' });
                        const current = monthMap.get(monthKey);
                        if (current) {
                            if (log.scan_type === 'emergency') current.emergency++;
                            else current.normal++;
                        }
                    });

                    setBarData(monthsOrder.map(month => ({
                        month,
                        normal: monthMap.get(month)?.normal || 0,
                        emergency: monthMap.get(month)?.emergency || 0
                    })));
                }

                const normalScans = (total || 0) - (emergency || 0);
                setPieData([
                    { name: 'Regular', value: normalScans, color: '#3B82F6' },
                    { name: 'Emergency', value: emergency || 0, color: '#EF4444' }
                ]);

                setStats({
                    totalScans: total || 0,
                    emergencyScans: emergency || 0,
                    parkingScans: normalScans,
                    growth: "LIVE"
                });

            } catch (err) {
                console.error("Report error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReportStats();
    }, []);

    if (loading) return <div className="min-h-[600px] flex items-center justify-center"><Loader2 size={48} className="animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Analytics</h1>
                    <p className="text-slate-400 font-medium text-sm">Tightened performance reports for your dashboard.</p>
                </div>
                <button className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Export Report</button>
            </div>

            {/* Tight Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Scans</p>
                    <h3 className="text-2xl font-black text-slate-900">{stats.totalScans}</h3>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency</p>
                    <h3 className="text-2xl font-black text-rose-600">{stats.emergencyScans}</h3>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Regular</p>
                    <h3 className="text-2xl font-black text-indigo-600">{stats.parkingScans}</h3>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Safety Rate</p>
                    <h3 className="text-2xl font-black text-slate-900">{stats.totalScans > 0 ? Math.round(((stats.totalScans - stats.emergencyScans) / stats.totalScans) * 100) : 100}%</h3>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-8">Scan Distribution</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="normal" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="emergency" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center">
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-slate-900">{stats.totalScans}</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Total</span>
                        </div>
                    </div>
                    <div className="w-full mt-6 space-y-2">
                         {pieData.map((item, index) => (
                             <div key={index} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl">
                                 <span className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                     {item.name}
                                 </span>
                                 <span className="text-xs font-black text-slate-900">{item.value}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
}