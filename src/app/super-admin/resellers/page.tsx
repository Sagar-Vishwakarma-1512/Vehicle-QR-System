"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Store, ExternalLink, Loader2, Search, AlertCircle, ChevronRight, UserCircle, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResellersPage() {
    const [resellers, setResellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchResellers = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('resellers')
                    .select('*, users!inner(id, full_name, email, mobile_primary, role)')
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;
                if (data) {
                    // Fetch all qr_codes to calculate counts per user
                    const { data: qrData } = await supabase.from('qr_codes').select('user_id');
                    const countMap: Record<string, number> = {};
                    if (qrData) {
                        qrData.forEach(qr => {
                            if (qr.user_id) {
                                countMap[qr.user_id] = (countMap[qr.user_id] || 0) + 1;
                            }
                        });
                    }
                    
                    const mappedData = data.map(r => ({
                        ...r,
                        generated_count: countMap[r.user_id] || 0
                    }));
                    
                    setResellers(mappedData);
                }
            } catch (err: any) {
                console.error("Error fetching resellers:", err);
                setError(err.message || "Failed to fetch resellers.");
            } finally {
                setLoading(false);
            }
        };
        fetchResellers();
    }, []);

    const handleLoginAsAdmin = (reseller: any) => {
        if (!reseller.users) return;
        
        // Save target admin's data to localStorage to "switch" session
        const adminUser = {
            id: reseller.users.id,
            full_name: reseller.users.full_name,
            email: reseller.users.email,
            mobile_primary: reseller.users.mobile_primary,
            role: 'admin',
            business_slug: reseller.custom_domain
        };
        
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        // Use a full refresh to clear all previous states and force fresh data fetch
        window.location.href = '/admin/dashboard';
    };

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyLoginUrl = (id: string) => {
        const url = `${window.location.origin}/login`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filtered = resellers.filter(r => 
        r.business_name?.toLowerCase().includes(search.toLowerCase()) || 
        r.users?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Whitelabel Admins</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage and monitor your onboarded whitelabel users.</p>
                </div>
                <Link
                    href="/super-admin/resellers/new"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-200"
                >
                    <Plus size={18} />
                    Onboard New Admin
                </Link>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-start gap-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0"><AlertCircle className="text-rose-600" size={20} /></div>
                    <div>
                        <h3 className="font-black text-rose-900">Database Error</h3>
                        <p className="text-sm text-rose-600 font-medium mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-4 items-center bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search partners by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent border-none pl-12 pr-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-0 outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                            <tr>
                                <th className="px-8 py-6">Admin Identity</th>
                                <th className="px-8 py-6">Admin Contact</th>
                                <th className="px-8 py-6 text-center">Generated QRs</th>
                                <th className="px-8 py-6 text-center">Account Status</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                                        <p className="text-xs font-black text-slate-400 mt-4 uppercase tracking-widest">Loading Partners...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300"><Store size={32} /></div>
                                        <p className="text-slate-500 font-bold">No partners found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Store size={22} /></div>
                                                <div>
                                                    <p className="font-black text-slate-900 tracking-tight">{r.business_name || 'Unnamed Partner'}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">/p/{r.custom_domain}</p>
                                                        <button 
                                                            onClick={() => copyLoginUrl(r.id)}
                                                            className="p-1 hover:bg-indigo-100 rounded text-indigo-400 hover:text-indigo-600 transition-colors"
                                                            title="Copy Login URL"
                                                        >
                                                            {copiedId === r.id ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700">{r.users?.full_name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{r.users?.email}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-black text-slate-900">{r.generated_count || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">of {r.qr_quota || 'Unlimited'} limit</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                {r.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleLoginAsAdmin(r)}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    <UserCircle size={14} /> Login as Admin
                                                </button>
                                                <Link 
                                                    href={`/super-admin/resellers/${r.id}`}
                                                    className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                                                >
                                                    <ChevronRight size={18} />
                                                </Link>
                                            </div>
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

