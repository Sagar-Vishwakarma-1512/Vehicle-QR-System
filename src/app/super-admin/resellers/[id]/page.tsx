"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Store,
    QrCode,
    Users,
    Plus,
    Minus,
    Loader2,
    Save,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    X,
    ChevronRight,
    Globe,
    Palette,
    Zap
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResellerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [reseller, setReseller] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Editable state
    const [formData, setFormData] = useState({
        business_name: "",
        custom_domain: "",
        brand_color: "",
        status: "active"
    });

    // Quota management
    const [quotaChange, setQuotaChange] = useState<number>(0);
    const [showQuotaModal, setShowQuotaModal] = useState(false);
    const [quotaLoading, setQuotaLoading] = useState(false);

    useEffect(() => {
        const fetchReseller = async () => {
            if (!params.id) return;
            
            try {
                const { data, error } = await supabase
                    .from('resellers')
                    .select('*, users(full_name, email)')
                    .eq('id', params.id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setReseller(data);
                    setFormData({
                        business_name: data.business_name || "",
                        custom_domain: data.custom_domain || "",
                        brand_color: data.brand_color || "#6366f1",
                        status: data.status || "active"
                    });
                }
            } catch (err) {
                console.error("Error fetching reseller details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReseller();
    }, [params.id]);

    const handleSaveDetails = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('resellers')
                .update({
                    business_name: formData.business_name,
                    custom_domain: formData.custom_domain,
                    brand_color: formData.brand_color,
                    status: formData.status
                })
                .eq('id', params.id);

            if (error) throw error;
            
            setReseller({ ...reseller, ...formData });
            alert("Partner settings updated!");
        } catch (err: any) {
            alert(err.message || "Failed to update details");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateQuota = async (isAdd: boolean) => {
        if (quotaChange <= 0) return;
        
        setQuotaLoading(true);
        try {
            const currentQuota = reseller.qr_quota || 0;
            const newQuota = isAdd ? currentQuota + quotaChange : Math.max(0, currentQuota - quotaChange);
            
            const { error } = await supabase
                .from('resellers')
                .update({ qr_quota: newQuota })
                .eq('id', params.id);

            if (error) throw error;
            
            setReseller({ ...reseller, qr_quota: newQuota });
            setShowQuotaModal(false);
            setQuotaChange(0);
        } catch (err: any) {
            alert(err.message || "Failed to update quota");
        } finally {
            setQuotaLoading(false);
        }
    };

    const handleDeletePartner = async () => {
        const confirmDelete = window.confirm(`Are you sure you want to permanently offboard ${reseller?.business_name}? This will delete their account and access.`);
        if (!confirmDelete) return;

        try {
            // Because of database Row Level Security, hard-deleting the user might silently fail.
            // So we first scramble their login credentials to completely revoke access.
            if (reseller?.user_id) {
                const fakeEmail = `deleted_${Date.now()}_${reseller.user_id}@deleted.com`;
                await supabase.from('users').update({
                    email: fakeEmail,
                    password_hash: 'deleted',
                    role: 'deleted'
                }).eq('id', reseller.user_id);
                
                // Still try to delete just in case
                await supabase.from('users').delete().eq('id', reseller.user_id);
            }
            
            const { error } = await supabase.from('resellers').delete().eq('id', params.id);
            if (error) throw error;
            
            alert('Partner has been completely offboarded and their login access is permanently revoked.');
            router.push('/super-admin/resellers');
        } catch (err: any) {
            alert('Failed to offboard partner: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!reseller) {
        return (
            <div className="text-center py-24 bg-white border border-slate-200 rounded-[2.5rem]">
                <h2 className="text-2xl font-black text-slate-900 mb-4">Partner Not Found</h2>
                <Link href="/super-admin/resellers" className="text-indigo-600 font-bold hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Back to Whitelabels
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-24 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/super-admin/resellers" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{reseller.business_name}</h1>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                reseller.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                                {reseller.status}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">Configure whitelabel branding and limits.</p>
                    </div>
                </div>
                
                <button
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Apply Changes
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Left Columns */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Branding Settings */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50 relative z-10">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                                <Palette size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Whitelabel Branding</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Visual Configuration</p>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                                <input
                                    type="text"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Domain</label>
                                <div className="relative">
                                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        value={formData.custom_domain}
                                        onChange={(e) => setFormData({...formData, custom_domain: e.target.value})}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Override</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-black focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="active">Active (Verified)</option>
                                    <option value="suspended">Suspended (Locked)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Owner Info */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Partner Access</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Root User Credentials</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">Owner Name</p>
                                <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-900 font-black tracking-tight">
                                    {reseller.users?.full_name}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">Primary Email</p>
                                <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-900 font-black tracking-tight">
                                    {reseller.users?.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Quota & Danger */}
                <div className="space-y-10">
                    {/* Quota Card */}
                    <div className="bg-indigo-600 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md">
                                <QrCode size={32} className="text-white" />
                            </div>
                            <h2 className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-2">QR Quota Limit</h2>
                            <div className="text-6xl font-black text-white mb-8 tracking-tighter">
                                {reseller.qr_quota || 0}
                            </div>
                            
                            <button
                                onClick={() => setShowQuotaModal(true)}
                                className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl"
                            >
                                Manage Inventory
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white border border-rose-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100">
                                <AlertTriangle size={20} />
                            </div>
                            <h2 className="text-lg font-black text-rose-900">Danger Zone</h2>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                            Deleting this whitelabel account will block the reseller's dashboard access. 
                            Active QR codes will remain functional.
                        </p>
                        <button 
                            onClick={handleDeletePartner}
                            className="w-full bg-rose-50 text-rose-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-200 border-dashed"
                        >
                            Offboard Partner
                        </button>
                    </div>
                </div>
            </div>

            {/* Quota Modal */}
            {showQuotaModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 max-w-md w-full shadow-[0_32px_64px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Adjust Quota</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Inventory Management</p>
                            </div>
                            <button onClick={() => setShowQuotaModal(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl transition">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mb-10 relative z-10">
                            <div className="relative">
                                <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500" size={24} />
                                <input
                                    type="number"
                                    min="1"
                                    value={quotaChange || ''}
                                    onChange={(e) => setQuotaChange(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-16 pr-8 py-6 text-4xl text-center text-slate-900 font-black focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-4">Enter amount to modify</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            <button
                                onClick={() => handleUpdateQuota(false)}
                                disabled={quotaLoading || quotaChange <= 0}
                                className="flex items-center justify-center gap-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-100 hover:border-rose-100 disabled:opacity-50"
                            >
                                <Minus size={18} /> Deduct
                            </button>
                            <button
                                onClick={() => handleUpdateQuota(true)}
                                disabled={quotaLoading || quotaChange <= 0}
                                className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                            >
                                <Plus size={18} /> Add Quota
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
