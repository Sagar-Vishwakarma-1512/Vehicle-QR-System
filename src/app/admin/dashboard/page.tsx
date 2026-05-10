"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import {
    TrendingUp,
    Users,
    QrCode,
    AlertTriangle,
    Car,
    Clock,
    ArrowRight,
    ShieldCheck,
    MessageSquare as MessageSquareIcon,
    Info,
    ExternalLink,
    MapPin,
    X,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface Stat {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    bgClass: string;
    trend: string;
}

interface ChartData {
    day: string;
    count: number;
}

interface ScanLog {
    id: string;
    scan_type: string;
    created_at: string;
    qr_codes?: {
        vehicle_number?: string;
        qr_unique_id: string;
    };
}

interface Alert {
    id: string;
    qr_codes?: {
        vehicle_number?: string;
        user_id?: string;
        qr_unique_id: string;
    };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stat[]>([
        { label: "Total QR Codes", value: "0", icon: <QrCode />, color: "blue", bgClass: "bg-blue-600", trend: "0%" },
        { label: "Today's Scans", value: "0", icon: <Clock />, color: "emerald", bgClass: "bg-emerald-600", trend: "0%" },
        { label: "Emergency Alerts", value: "0", icon: <AlertTriangle />, color: "red", bgClass: "bg-red-600", trend: "0%" },
        { label: "Total Scans", value: "0", icon: <TrendingUp />, color: "purple", bgClass: "bg-purple-600", trend: "0%" },
    ]);
    const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const [adminName, setAdminName] = useState("Admin");

    const getDisplayId = (uniqueId: string) => {
        if (!uniqueId) return "";
        const parts = uniqueId.split('-');
        if (parts.length > 1) return `#${parts[parts.length - 1]}`;
        return `#${uniqueId}`;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                setLoading(false);
                return;
            }
            const user = JSON.parse(userStr);
            setAdminName(user.full_name || "Admin");

            if (!user.id) {
                console.error("User ID missing from storage!", user);
                setLoading(false);
                return;
            }

            console.log("Fetching dashboard data for user:", user.id);

            try {
                // FETCH ONLY THIS USER'S CODES
                const { data: userQRs } = await supabase
                    .from('qr_codes')
                    .select('id')
                    .eq('user_id', user.id);
                
                const qrIds = userQRs?.map(q => q.id) || [];

                if (qrIds.length === 0) {
                    setLoading(false);
                    return;
                }

                const { count: qrCount } = await supabase
                    .from('qr_codes')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                const { count: emergencyCount } = await supabase
                    .from('scan_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('scan_type', 'emergency')
                    .in('qr_code_id', qrIds);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { count: todayCount } = await supabase
                    .from('scan_logs')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', today.toISOString())
                    .in('qr_code_id', qrIds);

                const { count: scanCount } = await supabase
                    .from('scan_logs')
                    .select('*', { count: 'exact', head: true })
                    .in('qr_code_id', qrIds);

                setStats([
                    { label: "Total QR Codes", value: qrCount?.toString() || "0", icon: <QrCode />, color: "blue", bgClass: "bg-blue-600", trend: "ACTIVE" },
                    { label: "Today's Scans", value: todayCount?.toString() || "0", icon: <Clock />, color: "emerald", bgClass: "bg-emerald-600", trend: "NEW" },
                    { label: "Emergency Alerts", value: emergencyCount?.toString() || "0", icon: <AlertTriangle />, color: "red", bgClass: "bg-red-600", trend: "CRITICAL" },
                    { label: "Total Scans", value: scanCount?.toString() || "0", icon: <TrendingUp />, color: "purple", bgClass: "bg-purple-600", trend: "TOTAL" },
                ]);

                const { data: scans } = await supabase
                    .from('scan_logs')
                    .select('id, scan_type, created_at, qr_codes!inner (vehicle_number, qr_unique_id, user_id)')
                    .eq('qr_codes.user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (scans) setRecentScans(scans as any[]);

                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                const { data: chartRaw } = await supabase
                    .from('scan_logs')
                    .select('created_at, qr_codes!inner(user_id)')
                    .eq('qr_codes.user_id', user.id)
                    .gte('created_at', sevenDaysAgo.toISOString());

                if (chartRaw) {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayMap = new Map();
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        dayMap.set(d.getDate(), { day: days[d.getDay()], count: 0 });
                    }
                    chartRaw.forEach(log => {
                        const dateKey = new Date(log.created_at).getDate();
                        const existing = dayMap.get(dateKey);
                        if (existing) existing.count++;
                    });
                    setChartData(Array.from(dayMap.values()));
                }

                // Alerts
                const { data: alerts } = await supabase
                    .from('emergency_alerts')
                    .select('*, qr_codes!inner(user_id, vehicle_number, qr_unique_id)')
                    .eq('qr_codes.user_id', user.id)
                    .eq('resolved', false);
                if (alerts) setActiveAlerts(alerts as any[]);

            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="min-h-[600px] flex items-center justify-center"><Loader2 size={48} className="animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header - More compact */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-1 tracking-tight">Hi, {adminName.split(' ')[0]}!</h1>
                    <p className="opacity-60 text-sm font-medium uppercase tracking-[0.2em]">Dashboard Control Center</p>
                </div>
                <Link href="/admin/qr-codes" className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition">Manage Fleet</Link>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            </div>

            {/* Stats - Tighter Gap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bgClass} p-3 rounded-2xl text-white shadow-lg`}>{stat.icon}</div>
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider bg-slate-50 text-slate-400">{stat.trend}</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Main Area - Tightened */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 tracking-tight">Volume Insights</h3>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                             <span className="text-[10px] font-black text-slate-400 uppercase">Total Scans</span>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="font-black text-slate-900 text-sm">Recent Events</h3>
                    </div>
                    <div className="flex-1">
                        <table className="w-full">
                            <tbody className="divide-y divide-slate-50">
                                {recentScans.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition duration-300">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-900 text-xs">{getDisplayId(row.qr_codes?.qr_unique_id || "")}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{row.qr_codes?.vehicle_number || 'New'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${row.scan_type === 'emergency' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>{row.scan_type}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}