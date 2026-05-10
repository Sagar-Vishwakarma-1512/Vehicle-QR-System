"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Store,
    Activity,
    CreditCard,
    Plus,
    Loader2,
    ShieldCheck,
    Globe,
    Zap,
    TrendingUp,
    ArrowRight,
    BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        totalResellers: 0,
        activeResellers: 0,
        totalScans: 0,
        totalQuotaAssigned: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const { count: resellersCount } = await supabase
                    .from('resellers')
                    .select('*', { count: 'exact', head: true });

                const { count: activeResellers } = await supabase
                    .from('resellers')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');

                const { count: totalScans } = await supabase
                    .from('scan_logs')
                    .select('*', { count: 'exact', head: true });

                const { data: quotaData } = await supabase
                    .from('resellers')
                    .select('qr_quota');

                const totalQuota = quotaData?.reduce((acc, curr) => acc + (curr.qr_quota || 0), 0) || 0;

                setStats({
                    totalResellers: resellersCount || 0,
                    activeResellers: activeResellers || 0,
                    totalScans: totalScans || 0,
                    totalQuotaAssigned: totalQuota
                });
            } catch (error) {
                console.error("Error fetching platform stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalStats();
    }, []);

    const statCards = [
        {
            title: "Total Admins",
            value: stats.totalResellers,
            icon: <Store size={24} className="text-indigo-600" />,
            color: "bg-indigo-50",
            border: "border-indigo-100",
            subtitle: "Whitelabel Users"
        },
        {
            title: "Active Admins",
            value: stats.activeResellers,
            icon: <Activity size={24} className="text-emerald-600" />,
            color: "bg-emerald-50",
            border: "border-emerald-100",
            subtitle: "Live Systems"
        },
        {
            title: "Total QR Quota",
            value: stats.totalQuotaAssigned.toLocaleString(),
            icon: <Zap size={24} className="text-amber-600" />,
            color: "bg-amber-50",
            border: "border-amber-100",
            subtitle: "Assigned Globally"
        },
        {
            title: "Total System Scans",
            value: stats.totalScans.toLocaleString(),
            icon: <BarChart3 size={24} className="text-purple-600" />,
            color: "bg-purple-50",
            border: "border-purple-100",
            subtitle: "Platform Activity"
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Whitelabel Control</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your whitelabel admins and platform distributions.</p>
                </div>
                <Link
                    href="/super-admin/resellers/new"
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition flex items-center gap-2 shadow-xl shadow-indigo-200"
                >
                    <Plus size={18} /> Onboard New Admin
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div
                        key={i}
                        className={`${stat.color} ${stat.border} border rounded-[2rem] p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300`}
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Platform Growth</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Partner Onboarding (Last 6 Months)</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest border border-emerald-100 flex items-center gap-1">
                            <TrendingUp size={12} /> +12% GROWTH
                        </div>
                    </div>
                </div>

                <div className="h-48 flex items-end gap-3 px-4">
                    {[35, 45, 30, 65, 85, 100].map((height, i) => (
                        <div key={i} className="flex-1 group relative">
                            <div
                                className="w-full bg-indigo-100 rounded-t-xl transition-all duration-500 group-hover:bg-indigo-600"
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {height}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Nov</span>
                    <span>Dec</span>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Scale Business Card */}
                {/* <div className="bg-indigo-600 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl shadow-indigo-100">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-150" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                            <ShieldCheck size={32} className="text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Scale Your Platform</h2>
                        <p className="text-indigo-100 leading-relaxed max-w-md mb-8 font-medium">
                            Onboard new whitelabel admins, assign them custom domains, and manage their QR quotas from a single unified interface.
                        </p>
                        <Link
                            href="/super-admin/resellers"
                            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition shadow-xl"
                        >
                            Manage All Admins <ArrowRight size={18} />
                        </Link>
                    </div>
                </div> */}

                {/* Whitelabel Specs */}
                {/* <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col justify-center shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                        <Globe className="text-indigo-600" size={24} /> Whitelabel Features
                    </h3>
                    <div className="space-y-6">
                        {[
                            { title: "Custom Domains", desc: "Partners can use their own branding URLs." },
                            { title: "Quota Management", desc: "Control how many QRs each partner can generate." },
                            { title: "Brand Identity", desc: "Support for custom logos and primary colors." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1 border border-indigo-100 group-hover:bg-indigo-600 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 group-hover:bg-white" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-sm tracking-tight">{item.title}</h4>
                                    <p className="text-xs text-slate-400 font-bold mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div> */}
            </div>
        </div>
    );
}

